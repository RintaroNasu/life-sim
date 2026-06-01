package handler

import (
	"errors"

	"github.com/RintaroNasu/life-sim/api/internal/httpx"
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

func NewAuthHandler(authService service.AuthService) AuthHandler {
	return &authHandler{authService: authService}
}

func (h *authHandler) Signup(c echo.Context) error {
	var req signupRequest
	if err := c.Bind(&req); err != nil {
		return httpx.InvalidRequest("invalid request body", err)
	}

	result, err := h.authService.Signup(c.Request().Context(), service.SignupInput{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return respondAuthError(err)
	}

	return c.JSON(201, result)
}

func (h *authHandler) Login(c echo.Context) error {
	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return httpx.InvalidRequest("invalid request body", err)
	}

	result, err := h.authService.Login(c.Request().Context(), service.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return respondAuthError(err)
	}

	return c.JSON(200, result)
}

func respondAuthError(err error) error {
	switch {
	case errors.Is(err, service.ErrEmailRequired):
		return httpx.InvalidRequest("email is required", err)
	case errors.Is(err, service.ErrPasswordRequired):
		return httpx.InvalidRequest("password is required", err)
	case errors.Is(err, service.ErrInvalidEmailFormat):
		return httpx.InvalidRequest("email format is invalid", err)
	case errors.Is(err, service.ErrEmailAlreadyExists):
		return httpx.Conflict("email already exists", err)
	case errors.Is(err, service.ErrInvalidCredentials):
		return httpx.Unauthorized("email or password is incorrect", err)
	default:
		return httpx.Internal("internal server error", err)
	}
}
