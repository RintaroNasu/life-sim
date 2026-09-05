package route

import (
	"github.com/RintaroNasu/life-sim/api/internal/handler"
	"github.com/labstack/echo"
)

func Register(
	e *echo.Echo,
	authHandler handler.AuthHandler,
	dashboardHandler handler.DashboardHandler,
	householdHandler handler.HouseholdHandler,
	simulationHandler handler.SimulationHandler,
	authMiddleware echo.MiddlewareFunc,
) {
	e.POST("/signup", authHandler.Signup)
	e.POST("/login", authHandler.Login)
	e.GET("/me", authHandler.Me, authMiddleware)
	e.GET("/dashboard", dashboardHandler.Get, authMiddleware)
	e.GET("/households/:year/:month", householdHandler.Get, authMiddleware)
	e.PUT("/households/:year/:month", householdHandler.Save, authMiddleware)
	e.POST("/simulations", simulationHandler.Save, authMiddleware)
}
