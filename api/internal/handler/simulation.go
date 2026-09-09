package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/RintaroNasu/life-sim/api/internal/auth"
	"github.com/RintaroNasu/life-sim/api/internal/httpx"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/labstack/echo"
)

type SimulationHandler interface {
	Save(c echo.Context) error
	GetList(c echo.Context) error
	GetDetail(c echo.Context) error
}

type simulationHandler struct {
	simulationService service.SimulationService
}

type saveSimulationRequest struct {
	Title                string `json:"title"`
	Income               int    `json:"income"`
	Rent                 int    `json:"rent"`
	Food                 int    `json:"food"`
	Transportation       int    `json:"transportation"`
	SocialExpense        int    `json:"social_expense"`
	DailyGoods           int    `json:"daily_goods"`
	Utilities            int    `json:"utilities"`
	SubscriptionFee      int    `json:"subscription_fee"`
	Savings              int    `json:"savings"`
	MonthlyExpenses      int    `json:"monthly_expenses"`
	MonthlyFreeAmount    int    `json:"monthly_free_amount"`
	YearlySavings        int    `json:"yearly_savings"`
	YearlyFreeAmount     int    `json:"yearly_free_amount"`
	MonthlyAssetIncrease int    `json:"monthly_asset_increase"`
	YearlyAssetIncrease  int    `json:"yearly_asset_increase"`
	FiveYearAssets       int    `json:"five_year_assets"`
}

func NewSimulationHandler(simulationService service.SimulationService) SimulationHandler {
	return &simulationHandler{simulationService: simulationService}
}

func (h *simulationHandler) GetList(c echo.Context) error {
	userID, ok := auth.UserIDFromContext(c)
	if !ok {
		return httpx.Unauthorized("authenticated user is required", errors.New("authenticated user is missing from context"))
	}

	result, err := h.simulationService.GetSimulations(c.Request().Context(), userID)
	if err != nil {
		return respondSimulationError(err)
	}

	return c.JSON(http.StatusOK, result)
}

func (h *simulationHandler) GetDetail(c echo.Context) error {
	userID, ok := auth.UserIDFromContext(c)
	if !ok {
		return httpx.Unauthorized("authenticated user is required", errors.New("authenticated user is missing from context"))
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return httpx.InvalidRequest("simulation id must be a valid integer", err)
	}
	if id < 1 {
		return httpx.InvalidRequest("simulation id is invalid", errors.New("simulation id must be greater than 0"))
	}

	result, err := h.simulationService.GetSimulation(c.Request().Context(), userID, uint(id))
	if err != nil {
		return respondSimulationError(err)
	}

	return c.JSON(http.StatusOK, result)
}

func (h *simulationHandler) Save(c echo.Context) error {
	userID, ok := auth.UserIDFromContext(c)
	if !ok {
		return httpx.Unauthorized("authenticated user is required", errors.New("authenticated user is missing from context"))
	}

	var req saveSimulationRequest
	if err := c.Bind(&req); err != nil {
		return httpx.InvalidRequest("invalid request body", err)
	}

	result, err := h.simulationService.SaveSimulation(c.Request().Context(), userID, service.SaveSimulationInput{
		Title:                req.Title,
		Income:               req.Income,
		Rent:                 req.Rent,
		Food:                 req.Food,
		Transportation:       req.Transportation,
		SocialExpense:        req.SocialExpense,
		DailyGoods:           req.DailyGoods,
		Utilities:            req.Utilities,
		SubscriptionFee:      req.SubscriptionFee,
		Savings:              req.Savings,
		MonthlyExpenses:      req.MonthlyExpenses,
		MonthlyFreeAmount:    req.MonthlyFreeAmount,
		YearlySavings:        req.YearlySavings,
		YearlyFreeAmount:     req.YearlyFreeAmount,
		MonthlyAssetIncrease: req.MonthlyAssetIncrease,
		YearlyAssetIncrease:  req.YearlyAssetIncrease,
		FiveYearAssets:       req.FiveYearAssets,
	})
	if err != nil {
		return respondSimulationError(err)
	}

	return c.JSON(http.StatusCreated, result)
}

func respondSimulationError(err error) error {
	switch {
	case errors.Is(err, service.ErrSimulationNegativeValue):
		return httpx.InvalidRequest("amount must be greater than or equal to 0", err)
	case errors.Is(err, service.ErrSimulationNotFound):
		return httpx.NotFound("simulation was not found", err)
	default:
		return httpx.Internal("internal server error", err)
	}
}
