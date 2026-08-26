package main

import (
	"log/slog"
	"os"
	"time"

	"github.com/RintaroNasu/life-sim/api/cmd/migrate"
	"github.com/RintaroNasu/life-sim/api/internal/auth"
	"github.com/RintaroNasu/life-sim/api/internal/db"
	"github.com/RintaroNasu/life-sim/api/internal/handler"
	"github.com/RintaroNasu/life-sim/api/internal/httpx"
	"github.com/RintaroNasu/life-sim/api/internal/logging"
	"github.com/RintaroNasu/life-sim/api/internal/repository"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/RintaroNasu/life-sim/api/route"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	logger := logging.New()
	slog.SetDefault(logger)

	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.OPTIONS},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))
	e.HideBanner = true
	e.HTTPErrorHandler = httpx.HTTPErrorHandler(logger)
	e.Use(httpx.RecoverMiddleware())
	// dbのインスタンス作成
	conn, err := db.New()
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	defer func() {
		if err := db.CloseDB(conn); err != nil {
			logger.Error("failed to close database", "error", err)
		}
	}()

	if err := migrate.Migrate(conn); err != nil {
		logger.Error("failed to migrate database", "error", err)
		os.Exit(1)
	}

	jwtManager := auth.NewJWTManager(getJWTSecret(), 1*time.Hour)
	authRepository := repository.NewAuthRepository(conn)
	authService := service.NewAuthService(authRepository, jwtManager)
	authHandler := handler.NewAuthHandler(authService)
	householdRepository := repository.NewHouseholdRepository(conn)
	dashboardService := service.NewDashboardService(householdRepository)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	householdService := service.NewHouseholdService(householdRepository)
	householdHandler := handler.NewHouseholdHandler(householdService)
	authMiddleware := auth.Middleware(jwtManager)

	route.Register(e, authHandler, dashboardHandler, householdHandler, authMiddleware)

	logger.Info("server starting", "addr", ":8080")
	if err := e.Start(":8080"); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "development-secret"
	}

	return secret
}
