package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func TestCORSAllowedOrigins(t *testing.T) {
	tests := []struct {
		name   string
		config string
		origin string
		want   string
	}{
		{"local default", "", "http://localhost:3000", "http://localhost:3000"},
		{"production", "https://life-sim-app.com", "https://life-sim-app.com", "https://life-sim-app.com"},
		{"multiple origins with whitespace", " https://life-sim-app.com, , http://localhost:3000 ", "http://localhost:3000", "http://localhost:3000"},
		{"localhost excluded in production", "https://life-sim-app.com", "http://localhost:3000", ""},
		{"untrusted origin", "https://life-sim-app.com", "https://example.com", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("CORS_ALLOWED_ORIGINS", tt.config)
			e := echo.New()
			e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
				AllowOrigins: getCORSAllowedOrigins(),
				AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.OPTIONS},
				AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
			}))
			e.PUT("/households/2026/9", func(c echo.Context) error { return c.NoContent(http.StatusOK) })
			req := httptest.NewRequest(http.MethodOptions, "/households/2026/9", nil)
			req.Header.Set(echo.HeaderOrigin, tt.origin)
			req.Header.Set(echo.HeaderAccessControlRequestMethod, echo.PUT)
			req.Header.Set(echo.HeaderAccessControlRequestHeaders, "authorization,content-type")
			rec := httptest.NewRecorder()
			e.ServeHTTP(rec, req)
			if got := rec.Header().Get(echo.HeaderAccessControlAllowOrigin); got != tt.want {
				t.Fatalf("Access-Control-Allow-Origin = %q, want %q", got, tt.want)
			}
		})
	}
}
