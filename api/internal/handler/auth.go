package handler

import (
	"errors"
	"net/http"

	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/labstack/echo"
)

type AuthHandler interface {
	Signup(c echo.Context) error
	Login(c echo.Context) error
}

type authHandler struct {
	authService service.AuthService
}

type signupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type errorResponse struct {
	Error errorDetail `json:"error"`
}

type errorDetail struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func NewAuthHandler(authService service.AuthService) AuthHandler {
	return &authHandler{authService: authService}
}

func (h *authHandler) Signup(c echo.Context) error {
	var req signupRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, newErrorResponse("BAD_REQUEST", "invalid request body"))
	}

	result, err := h.authService.Signup(c.Request().Context(), service.SignupInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return respondAuthError(c, err)
	}

	return c.JSON(http.StatusCreated, result)
}

func (h *authHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, newErrorResponse("BAD_REQUEST", "invalid request body"))
	}

	result, err := h.authService.Login(c.Request().Context(), service.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return respondAuthError(c, err)
	}

	return c.JSON(http.StatusOK, result)
}

func respondAuthError(c echo.Context, err error) error {
	switch {
	case errors.Is(err, service.ErrEmailRequired):
		return c.JSON(http.StatusBadRequest, newErrorResponse("EMAIL_REQUIRED", "email is required"))
	case errors.Is(err, service.ErrPasswordRequired):
		return c.JSON(http.StatusBadRequest, newErrorResponse("PASSWORD_REQUIRED", "password is required"))
	case errors.Is(err, service.ErrInvalidEmailFormat):
		return c.JSON(http.StatusBadRequest, newErrorResponse("INVALID_EMAIL_FORMAT", "email format is invalid"))
	case errors.Is(err, service.ErrEmailAlreadyExists):
		return c.JSON(http.StatusConflict, newErrorResponse("EMAIL_ALREADY_EXISTS", "email already exists"))
	case errors.Is(err, service.ErrInvalidCredentials):
		return c.JSON(http.StatusUnauthorized, newErrorResponse("INVALID_CREDENTIALS", "email or password is incorrect"))
	default:
		return c.JSON(http.StatusInternalServerError, newErrorResponse("INTERNAL_ERROR", "internal server error"))
	}
}

func newErrorResponse(code string, message string) errorResponse {
	return errorResponse{
		Error: errorDetail{
			Code:    code,
			Message: message,
		},
	}
}
