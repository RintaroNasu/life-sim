package route

import (
	"github.com/RintaroNasu/life-sim/api/internal/handler"
	"github.com/labstack/echo"
)

func Register(e *echo.Echo, authHandler handler.AuthHandler) {
	e.POST("/signup", authHandler.Signup)
	e.POST("/login", authHandler.Login)
}
