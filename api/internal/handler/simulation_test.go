package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/RintaroNasu/life-sim/api/internal/httpx"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/labstack/echo"
	"github.com/stretchr/testify/require"
)

type fakeSimulationService struct {
	saveFunc      func(ctx context.Context, userID uint, input service.SaveSimulationInput) (*service.SimulationResponse, error)
	getListFunc   func(ctx context.Context, userID uint) ([]service.SimulationListItemResponse, error)
	getDetailFunc func(ctx context.Context, userID uint, id uint) (*service.SimulationResponse, error)
}

func (f *fakeSimulationService) SaveSimulation(ctx context.Context, userID uint, input service.SaveSimulationInput) (*service.SimulationResponse, error) {
	if f.saveFunc == nil {
		return nil, nil
	}

	return f.saveFunc(ctx, userID, input)
}

func (f *fakeSimulationService) GetSimulations(ctx context.Context, userID uint) ([]service.SimulationListItemResponse, error) {
	if f.getListFunc == nil {
		return nil, nil
	}

	return f.getListFunc(ctx, userID)
}

func (f *fakeSimulationService) GetSimulation(ctx context.Context, userID uint, id uint) (*service.SimulationResponse, error) {
	if f.getDetailFunc == nil {
		return nil, nil
	}

	return f.getDetailFunc(ctx, userID, id)
}

func TestSimulationHandler_GetList(t *testing.T) {
	now := time.Date(2026, 9, 9, 10, 0, 0, 0, time.UTC)

	tests := []struct {
		name         string
		setUserID    bool
		service      fakeSimulationService
		wantStatus   int
		wantResponse []service.SimulationListItemResponse
		wantAppError *httpx.AppError
	}{
		{
			name:      "【正常系】一覧取得成功時は200でシミュレーション一覧を返すこと",
			setUserID: true,
			service: fakeSimulationService{
				getListFunc: func(ctx context.Context, userID uint) ([]service.SimulationListItemResponse, error) {
					require.Equal(t, uint(1), userID)
					return []service.SimulationListItemResponse{
						{
							ID:                1,
							Title:             "固定費見直し",
							MonthlyFreeAmount: 60000,
							YearlySavings:     360000,
							FiveYearAssets:    5400000,
							CreatedAt:         now,
						},
					}, nil
				},
			},
			wantStatus: http.StatusOK,
			wantResponse: []service.SimulationListItemResponse{
				{
					ID:                1,
					Title:             "固定費見直し",
					MonthlyFreeAmount: 60000,
					YearlySavings:     360000,
					FiveYearAssets:    5400000,
					CreatedAt:         now,
				},
			},
		},
		{
			name:      "【正常系】一覧が0件の場合は200で空配列を返すこと",
			setUserID: true,
			service: fakeSimulationService{
				getListFunc: func(ctx context.Context, userID uint) ([]service.SimulationListItemResponse, error) {
					return []service.SimulationListItemResponse{}, nil
				},
			},
			wantStatus:   http.StatusOK,
			wantResponse: []service.SimulationListItemResponse{},
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
			name:      "【異常系】想定外エラー時は500を返すこと",
			setUserID: true,
			service: fakeSimulationService{
				getListFunc: func(ctx context.Context, userID uint) ([]service.SimulationListItemResponse, error) {
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
			req := httptest.NewRequest(http.MethodGet, "/simulations", nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			if tt.setUserID {
				c.Set(authUserIDContextKey, uint(1))
			}

			h := NewSimulationHandler(&tt.service)
			err := h.GetList(c)

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

			var got []service.SimulationListItemResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
			require.Equal(t, tt.wantResponse, got)
		})
	}
}

func TestSimulationHandler_GetDetail(t *testing.T) {
	now := time.Date(2026, 9, 9, 11, 0, 0, 0, time.UTC)

	tests := []struct {
		name         string
		id           string
		setUserID    bool
		service      fakeSimulationService
		wantStatus   int
		wantResponse *service.SimulationResponse
		wantAppError *httpx.AppError
	}{
		{
			name:      "【正常系】詳細取得成功時は200でシミュレーション詳細を返すこと",
			id:        "10",
			setUserID: true,
			service: fakeSimulationService{
				getDetailFunc: func(ctx context.Context, userID uint, id uint) (*service.SimulationResponse, error) {
					require.Equal(t, uint(1), userID)
					require.Equal(t, uint(10), id)
					return &service.SimulationResponse{
						ID:                   10,
						Title:                "固定費見直し",
						Income:               290000,
						Rent:                 90000,
						Food:                 50000,
						Transportation:       10000,
						SocialExpense:        20000,
						DailyGoods:           10000,
						Utilities:            15000,
						SubscriptionFee:      5000,
						Savings:              30000,
						MonthlyExpenses:      200000,
						MonthlyFreeAmount:    60000,
						YearlySavings:        360000,
						YearlyFreeAmount:     720000,
						MonthlyAssetIncrease: 90000,
						YearlyAssetIncrease:  1080000,
						FiveYearAssets:       5400000,
						CreatedAt:            now,
						UpdatedAt:            now,
					}, nil
				},
			},
			wantStatus: http.StatusOK,
			wantResponse: &service.SimulationResponse{
				ID:                   10,
				Title:                "固定費見直し",
				Income:               290000,
				Rent:                 90000,
				Food:                 50000,
				Transportation:       10000,
				SocialExpense:        20000,
				DailyGoods:           10000,
				Utilities:            15000,
				SubscriptionFee:      5000,
				Savings:              30000,
				MonthlyExpenses:      200000,
				MonthlyFreeAmount:    60000,
				YearlySavings:        360000,
				YearlyFreeAmount:     720000,
				MonthlyAssetIncrease: 90000,
				YearlyAssetIncrease:  1080000,
				FiveYearAssets:       5400000,
				CreatedAt:            now,
				UpdatedAt:            now,
			},
		},
		{
			name:      "【異常系】contextにuserIDがない場合は401を返すこと",
			id:        "10",
			setUserID: false,
			wantAppError: httpx.Unauthorized(
				"authenticated user is required",
				errors.New("authenticated user is missing from context"),
			),
		},
		{
			name:      "【異常系】id変換失敗時は400を返すこと",
			id:        "abc",
			setUserID: true,
			wantAppError: httpx.InvalidRequest(
				"simulation id must be a valid integer",
				errors.New("invalid syntax"),
			),
		},
		{
			name:      "【異常系】idが1未満の場合は400を返すこと",
			id:        "0",
			setUserID: true,
			wantAppError: httpx.InvalidRequest(
				"simulation id is invalid",
				errors.New("simulation id must be greater than 0"),
			),
		},
		{
			name:      "【異常系】ErrSimulationNotFound時は404を返すこと",
			id:        "999",
			setUserID: true,
			service: fakeSimulationService{
				getDetailFunc: func(ctx context.Context, userID uint, id uint) (*service.SimulationResponse, error) {
					return nil, service.ErrSimulationNotFound
				},
			},
			wantAppError: httpx.NotFound("simulation was not found", service.ErrSimulationNotFound),
		},
		{
			name:      "【異常系】想定外エラー時は500を返すこと",
			id:        "10",
			setUserID: true,
			service: fakeSimulationService{
				getDetailFunc: func(ctx context.Context, userID uint, id uint) (*service.SimulationResponse, error) {
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
			req := httptest.NewRequest(http.MethodGet, "/simulations/"+tt.id, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetParamNames("id")
			c.SetParamValues(tt.id)
			if tt.setUserID {
				c.Set(authUserIDContextKey, uint(1))
			}

			h := NewSimulationHandler(&tt.service)
			err := h.GetDetail(c)

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

			var got service.SimulationResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
			require.Equal(t, tt.wantResponse, &got)
		})
	}
}

func TestSimulationHandler_Save(t *testing.T) {
	now := time.Date(2026, 9, 2, 11, 0, 0, 0, time.UTC)

	tests := []struct {
		name         string
		body         string
		setUserID    bool
		service      fakeSimulationService
		wantStatus   int
		wantResponse *service.SimulationResponse
		wantAppError *httpx.AppError
	}{
		{
			name:      "【正常系】save成功時は201でシミュレーションを返すこと",
			setUserID: true,
			body:      `{"title":"固定費見直し","income":290000,"rent":90000,"food":50000,"transportation":10000,"social_expense":20000,"daily_goods":10000,"utilities":15000,"subscription_fee":5000,"savings":30000,"monthly_expenses":200000,"monthly_free_amount":60000,"yearly_savings":360000,"yearly_free_amount":720000,"monthly_asset_increase":90000,"yearly_asset_increase":1080000,"five_year_assets":5400000}`,
			service: fakeSimulationService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveSimulationInput) (*service.SimulationResponse, error) {
					require.Equal(t, uint(1), userID)
					require.Equal(t, "固定費見直し", input.Title)
					require.Equal(t, 290000, input.Income)
					require.Equal(t, 5400000, input.FiveYearAssets)
					return &service.SimulationResponse{
						ID:                   1,
						Title:                "固定費見直し",
						Income:               290000,
						Rent:                 90000,
						Food:                 50000,
						Transportation:       10000,
						SocialExpense:        20000,
						DailyGoods:           10000,
						Utilities:            15000,
						SubscriptionFee:      5000,
						Savings:              30000,
						MonthlyExpenses:      200000,
						MonthlyFreeAmount:    60000,
						YearlySavings:        360000,
						YearlyFreeAmount:     720000,
						MonthlyAssetIncrease: 90000,
						YearlyAssetIncrease:  1080000,
						FiveYearAssets:       5400000,
						CreatedAt:            now,
						UpdatedAt:            now,
					}, nil
				},
			},
			wantStatus: http.StatusCreated,
			wantResponse: &service.SimulationResponse{
				ID:                   1,
				Title:                "固定費見直し",
				Income:               290000,
				Rent:                 90000,
				Food:                 50000,
				Transportation:       10000,
				SocialExpense:        20000,
				DailyGoods:           10000,
				Utilities:            15000,
				SubscriptionFee:      5000,
				Savings:              30000,
				MonthlyExpenses:      200000,
				MonthlyFreeAmount:    60000,
				YearlySavings:        360000,
				YearlyFreeAmount:     720000,
				MonthlyAssetIncrease: 90000,
				YearlyAssetIncrease:  1080000,
				FiveYearAssets:       5400000,
				CreatedAt:            now,
				UpdatedAt:            now,
			},
		},
		{
			name:      "【異常系】contextにuserIDがない場合は401を返すこと",
			setUserID: false,
			body:      `{}`,
			wantAppError: httpx.Unauthorized(
				"authenticated user is required",
				errors.New("authenticated user is missing from context"),
			),
		},
		{
			name:      "【異常系】bind失敗時は400を返すこと",
			setUserID: true,
			body:      `{"title":"固定費見直し",`,
			wantAppError: httpx.InvalidRequest(
				"invalid request body",
				errors.New("bind failed"),
			),
		},
		{
			name:      "【異常系】ErrSimulationNegativeValue時は400を返すこと",
			setUserID: true,
			body:      `{}`,
			service: fakeSimulationService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveSimulationInput) (*service.SimulationResponse, error) {
					return nil, service.ErrSimulationNegativeValue
				},
			},
			wantAppError: httpx.InvalidRequest("amount must be greater than or equal to 0", service.ErrSimulationNegativeValue),
		},
		{
			name:      "【異常系】想定外エラー時は500を返すこと",
			setUserID: true,
			body:      `{}`,
			service: fakeSimulationService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveSimulationInput) (*service.SimulationResponse, error) {
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
			req := httptest.NewRequest(http.MethodPost, "/simulations", strings.NewReader(tt.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			if tt.setUserID {
				c.Set(authUserIDContextKey, uint(1))
			}

			h := NewSimulationHandler(&tt.service)
			err := h.Save(c)

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

			var got service.SimulationResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
			require.Equal(t, tt.wantResponse, &got)
		})
	}
}
