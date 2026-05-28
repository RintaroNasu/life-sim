package main

import (
	"os"
	"time"

	"github.com/RintaroNasu/life-sim/api/cmd/migrate"
	"github.com/RintaroNasu/life-sim/api/internal/auth"
	"github.com/RintaroNasu/life-sim/api/internal/db"
	"github.com/RintaroNasu/life-sim/api/internal/handler"
	"github.com/RintaroNasu/life-sim/api/internal/repository"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/RintaroNasu/life-sim/api/route"
	"github.com/labstack/echo"
)

func main() {
	e := echo.New()

	conn, err := db.New()
	if err != nil {
		e.Logger.Fatal("Failed to connect to database: ", err)
	}

	defer func() {
		if err := db.CloseDB(conn); err != nil {
			e.Logger.Error("Failed to close database: ", err)
		}
	}()

	if err := migrate.Migrate(conn); err != nil {
		e.Logger.Fatal("Failed to migrate database: ", err)
	}

	jwtManager := auth.NewJWTManager(getJWTSecret(), 24*time.Hour)
	authRepository := repository.NewAuthRepository(conn)
	authService := service.NewAuthService(authRepository, jwtManager)
	authHandler := handler.NewAuthHandler(authService)

	route.Register(e, authHandler)

	e.Logger.Fatal(e.Start(":8080"))
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "development-secret"
	}

	return secret
}
