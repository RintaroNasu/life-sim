package handler

import (
	"errors"
	"strconv"

	"github.com/RintaroNasu/life-sim/api/internal/auth"
	"github.com/RintaroNasu/life-sim/api/internal/httpx"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/labstack/echo"
)

type HouseholdHandler interface {
	Get(c echo.Context) error
	Save(c echo.Context) error
}

type householdHandler struct {
	householdService service.HouseholdService
}

type saveHouseholdRequest struct {
	Income          int `json:"income"`
	Rent            int `json:"rent"`
	Food            int `json:"food"`
	Savings         int `json:"savings"`
	Transportation  int `json:"transportation"`
	SocialExpense   int `json:"social_expense"`
	DailyGoods      int `json:"daily_goods"`
	Utilities       int `json:"utilities"`
	SubscriptionFee int `json:"subscription_fee"`
}

func NewHouseholdHandler(householdService service.HouseholdService) HouseholdHandler {
	return &householdHandler{householdService: householdService}
}

func (h *householdHandler) Get(c echo.Context) error {
	userID, ok := auth.UserIDFromContext(c)
	if !ok {
		return httpx.Unauthorized("authenticated user is required", errors.New("authenticated user is missing from context"))
	}

	year, month, err := householdYearMonthFromParams(c)
	if err != nil {
		return err
	}

	result, err := h.householdService.GetHousehold(c.Request().Context(), userID, year, month)
	if err != nil {
		return respondHouseholdError(err)
	}

	return c.JSON(200, result)
}

func (h *householdHandler) Save(c echo.Context) error {
	userID, ok := auth.UserIDFromContext(c)
	if !ok {
		return httpx.Unauthorized("authenticated user is required", errors.New("authenticated user is missing from context"))
	}

	year, month, err := householdYearMonthFromParams(c)
	if err != nil {
		return err
	}

	var req saveHouseholdRequest
	if err := c.Bind(&req); err != nil {
		return httpx.InvalidRequest("invalid request body", err)
	}

	result, err := h.householdService.SaveHousehold(c.Request().Context(), userID, service.SaveHouseholdInput{
		Year:            year,
		Month:           month,
		Income:          req.Income,
		Rent:            req.Rent,
		Food:            req.Food,
		Savings:         req.Savings,
		Transportation:  req.Transportation,
		SocialExpense:   req.SocialExpense,
		DailyGoods:      req.DailyGoods,
		Utilities:       req.Utilities,
		SubscriptionFee: req.SubscriptionFee,
	})
	if err != nil {
		return respondHouseholdError(err)
	}

	return c.JSON(200, result)
}

func respondHouseholdError(err error) error {
	switch {
	case errors.Is(err, service.ErrInvalidYear):
		return httpx.InvalidRequest("year is invalid", err)
	case errors.Is(err, service.ErrInvalidMonth):
		return httpx.InvalidRequest("month is invalid", err)
	case errors.Is(err, service.ErrHouseholdNotFound):
		return httpx.NotFound("household data was not found", err)
	case errors.Is(err, service.ErrNegativeValue):
		return httpx.InvalidRequest("amount must be greater than or equal to 0", err)
	default:
		return httpx.Internal("internal server error", err)
	}
}

func householdYearMonthFromParams(c echo.Context) (int, int, error) {
	year, err := strconv.Atoi(c.Param("year"))
	if err != nil {
		return 0, 0, httpx.InvalidRequest("year must be a valid integer", err)
	}

	month, err := strconv.Atoi(c.Param("month"))
	if err != nil {
		return 0, 0, httpx.InvalidRequest("month must be a valid integer", err)
	}

	return year, month, nil
}
