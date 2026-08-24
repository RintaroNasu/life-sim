package handler

import (
	"errors"

	"github.com/RintaroNasu/life-sim/api/internal/auth"
	"github.com/RintaroNasu/life-sim/api/internal/httpx"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/labstack/echo"
)

type DashboardHandler interface {
	Get(c echo.Context) error
}

type dashboardHandler struct {
	dashboardService service.DashboardService
}

func NewDashboardHandler(dashboardService service.DashboardService) DashboardHandler {
	return &dashboardHandler{dashboardService: dashboardService}
}

func (h *dashboardHandler) Get(c echo.Context) error {
	userID, ok := auth.UserIDFromContext(c)
	if !ok {
		return httpx.Unauthorized("authenticated user is required", errors.New("authenticated user is missing from context"))
	}

	result, err := h.dashboardService.GetDashboard(c.Request().Context(), userID)
	if err != nil {
		return respondDashboardError(err)
	}

	return c.JSON(200, result)
}

func respondDashboardError(err error) error {
	switch {
	case errors.Is(err, service.ErrDashboardNotFound):
		return httpx.NotFound("dashboard data was not found", err)
	default:
		return httpx.Internal("internal server error", err)
	}
}
