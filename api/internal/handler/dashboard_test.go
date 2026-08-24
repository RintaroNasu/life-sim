package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/RintaroNasu/life-sim/api/internal/httpx"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/labstack/echo"
	"github.com/stretchr/testify/require"
)

type fakeDashboardService struct {
	getFunc func(ctx context.Context, userID uint) (*service.DashboardResponse, error)
}

func (f *fakeDashboardService) GetDashboard(ctx context.Context, userID uint) (*service.DashboardResponse, error) {
	if f.getFunc == nil {
		return nil, nil
	}

	return f.getFunc(ctx, userID)
}

func TestDashboardHandler_Get(t *testing.T) {
	tests := []struct {
		name         string
		setUserID    bool
		service      fakeDashboardService
		wantStatus   int
		wantResponse *service.DashboardResponse
		wantAppError *httpx.AppError
	}{
		{
			name:      "【正常系】get成功時は200でダッシュボードデータを返すこと",
			setUserID: true,
			service: fakeDashboardService{
				getFunc: func(ctx context.Context, userID uint) (*service.DashboardResponse, error) {
					require.Equal(t, uint(1), userID)

					return &service.DashboardResponse{
						Year:          2026,
						Month:         8,
						Income:        290000,
						TotalExpenses: 230000,
						FreeAmount:    60000,
						ExpenseBreakdown: []service.ExpenseBreakdownItem{
							{Label: "家賃", Value: 90000},
							{Label: "食費", Value: 50000},
							{Label: "貯金額", Value: 30000},
						},
					}, nil
				},
			},
			wantStatus: http.StatusOK,
			wantResponse: &service.DashboardResponse{
				Year:          2026,
				Month:         8,
				Income:        290000,
				TotalExpenses: 230000,
				FreeAmount:    60000,
				ExpenseBreakdown: []service.ExpenseBreakdownItem{
					{Label: "家賃", Value: 90000},
					{Label: "食費", Value: 50000},
					{Label: "貯金額", Value: 30000},
				},
			},
		},
		{
			name:      "【異常系】contextにuserIDがない場合は401を返すこと",
			setUserID: false,
			wantAppError: httpx.Unauthorized(
				"authenticated user is required",
				errors.New("authenticated user is missing from context"),
			),
		},
		{
			name:      "【異常系】ErrDashboardNotFound時は404を返すこと",
			setUserID: true,
			service: fakeDashboardService{
				getFunc: func(ctx context.Context, userID uint) (*service.DashboardResponse, error) {
					return nil, service.ErrDashboardNotFound
				},
			},
			wantAppError: httpx.NotFound("dashboard data was not found", service.ErrDashboardNotFound),
		},
		{
			name:      "【異常系】想定外エラー時は500を返すこと",
			setUserID: true,
			service: fakeDashboardService{
				getFunc: func(ctx context.Context, userID uint) (*service.DashboardResponse, error) {
					return nil, errors.New("unexpected error")
				},
			},
			wantAppError: httpx.Internal("internal server error", errors.New("unexpected error")),
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			e := echo.New()
			req := httptest.NewRequest(http.MethodGet, "/dashboard", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			if tt.setUserID {
				c.Set(authUserIDContextKey, uint(1))
			}

			h := NewDashboardHandler(&tt.service)
			err := h.Get(c)

			if tt.wantAppError != nil {
				require.Error(t, err)
				appErr, ok := err.(*httpx.AppError)
				require.True(t, ok)
				require.Equal(t, tt.wantAppError.Status, appErr.Status)
				require.Equal(t, tt.wantAppError.Code, appErr.Code)
				require.Equal(t, tt.wantAppError.Message, appErr.Message)
				return
			}

			require.NoError(t, err)
			require.Equal(t, tt.wantStatus, rec.Code)

			var got service.DashboardResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
			require.Equal(t, tt.wantResponse, &got)
		})
	}
}
