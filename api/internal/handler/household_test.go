package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/RintaroNasu/life-sim/api/internal/httpx"
	"github.com/RintaroNasu/life-sim/api/internal/service"
	"github.com/labstack/echo"
	"github.com/stretchr/testify/require"
)

type fakeHouseholdService struct {
	getFunc  func(ctx context.Context, userID uint, year int, month int) (*service.HouseholdResponse, error)
	saveFunc func(ctx context.Context, userID uint, input service.SaveHouseholdInput) (*service.HouseholdResponse, error)
}

func (f *fakeHouseholdService) GetHousehold(ctx context.Context, userID uint, year int, month int) (*service.HouseholdResponse, error) {
	if f.getFunc == nil {
		return nil, nil
	}

	return f.getFunc(ctx, userID, year, month)
}

func (f *fakeHouseholdService) SaveHousehold(ctx context.Context, userID uint, input service.SaveHouseholdInput) (*service.HouseholdResponse, error) {
	if f.saveFunc == nil {
		return nil, nil
	}

	return f.saveFunc(ctx, userID, input)
}

func TestHouseholdHandler_Save(t *testing.T) {
	type input struct {
		year  string
		month string
		body  string
	}

	tests := []struct {
		name         string
		in           input
		setUserID    bool
		service      fakeHouseholdService
		wantStatus   int
		wantResponse *service.HouseholdResponse
		wantAppError *httpx.AppError
	}{
		{
			name:      "【正常系】save成功時は200で家計データを返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
				body:  `{"income":290000,"rent":90000,"food":50000,"savings":30000,"transportation":10000,"social_expense":20000,"daily_goods":10000,"utilities":15000,"subscription_fee":5000}`,
			},
			service: fakeHouseholdService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveHouseholdInput) (*service.HouseholdResponse, error) {
					require.Equal(t, uint(1), userID)
					require.Equal(t, 2026, input.Year)
					require.Equal(t, 6, input.Month)
					require.Equal(t, 290000, input.Income)
					return &service.HouseholdResponse{
						ID:              1,
						Year:            2026,
						Month:           6,
						Income:          290000,
						Rent:            90000,
						Food:            50000,
						Savings:         30000,
						Transportation:  10000,
						SocialExpense:   20000,
						DailyGoods:      10000,
						Utilities:       15000,
						SubscriptionFee: 5000,
					}, nil
				},
			},
			wantStatus: http.StatusOK,
			wantResponse: &service.HouseholdResponse{
				ID:              1,
				Year:            2026,
				Month:           6,
				Income:          290000,
				Rent:            90000,
				Food:            50000,
				Savings:         30000,
				Transportation:  10000,
				SocialExpense:   20000,
				DailyGoods:      10000,
				Utilities:       15000,
				SubscriptionFee: 5000,
			},
		},
		{
			name:      "【異常系】contextにuserIDがない場合は401を返すこと",
			setUserID: false,
			in: input{
				year:  "2026",
				month: "6",
				body:  `{}`,
			},
			wantAppError: httpx.Unauthorized(
				"authenticated user is required",
				errors.New("authenticated user is missing from context"),
			),
		},
		{
			name:      "【異常系】year変換失敗時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "abc",
				month: "6",
				body:  `{}`,
			},
			wantAppError: httpx.InvalidRequest("year must be a valid integer", errors.New("invalid syntax")),
		},
		{
			name:      "【異常系】month変換失敗時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "abc",
				body:  `{}`,
			},
			wantAppError: httpx.InvalidRequest("month must be a valid integer", errors.New("invalid syntax")),
		},
		{
			name:      "【異常系】bind失敗時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
				body:  `{"income":290000,`,
			},
			wantAppError: httpx.InvalidRequest("invalid request body", errors.New("bind failed")),
		},
		{
			name:      "【異常系】ErrInvalidYear時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
				body:  `{}`,
			},
			service: fakeHouseholdService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveHouseholdInput) (*service.HouseholdResponse, error) {
					return nil, service.ErrInvalidYear
				},
			},
			wantAppError: httpx.InvalidRequest("year is invalid", service.ErrInvalidYear),
		},
		{
			name:      "【異常系】ErrInvalidMonth時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
				body:  `{}`,
			},
			service: fakeHouseholdService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveHouseholdInput) (*service.HouseholdResponse, error) {
					return nil, service.ErrInvalidMonth
				},
			},
			wantAppError: httpx.InvalidRequest("month is invalid", service.ErrInvalidMonth),
		},
		{
			name:      "【異常系】ErrNegativeValue時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
				body:  `{}`,
			},
			service: fakeHouseholdService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveHouseholdInput) (*service.HouseholdResponse, error) {
					return nil, service.ErrNegativeValue
				},
			},
			wantAppError: httpx.InvalidRequest("amount must be greater than or equal to 0", service.ErrNegativeValue),
		},
		{
			name:      "【異常系】想定外エラー時は500を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
				body:  `{}`,
			},
			service: fakeHouseholdService{
				saveFunc: func(ctx context.Context, userID uint, input service.SaveHouseholdInput) (*service.HouseholdResponse, error) {
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
			req := httptest.NewRequest(http.MethodPut, "/households/"+tt.in.year+"/"+tt.in.month, strings.NewReader(tt.in.body))
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetParamNames("year", "month")
			c.SetParamValues(tt.in.year, tt.in.month)
			if tt.setUserID {
				c.Set(authUserIDContextKey, uint(1))
			}

			h := NewHouseholdHandler(&tt.service)
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

			var got service.HouseholdResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
			require.Equal(t, tt.wantResponse, &got)
		})
	}
}

func TestHouseholdHandler_Get(t *testing.T) {
	type input struct {
		year  string
		month string
	}

	tests := []struct {
		name         string
		in           input
		setUserID    bool
		service      fakeHouseholdService
		wantStatus   int
		wantResponse *service.HouseholdResponse
		wantAppError *httpx.AppError
	}{
		{
			name:      "【正常系】get成功時は200で家計データを返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
			},
			service: fakeHouseholdService{
				getFunc: func(ctx context.Context, userID uint, year int, month int) (*service.HouseholdResponse, error) {
					require.Equal(t, uint(1), userID)
					require.Equal(t, 2026, year)
					require.Equal(t, 6, month)
					return &service.HouseholdResponse{
						ID:              1,
						Year:            2026,
						Month:           6,
						Income:          290000,
						Rent:            90000,
						Food:            50000,
						Savings:         30000,
						Transportation:  10000,
						SocialExpense:   20000,
						DailyGoods:      10000,
						Utilities:       15000,
						SubscriptionFee: 5000,
					}, nil
				},
			},
			wantStatus: http.StatusOK,
			wantResponse: &service.HouseholdResponse{
				ID:              1,
				Year:            2026,
				Month:           6,
				Income:          290000,
				Rent:            90000,
				Food:            50000,
				Savings:         30000,
				Transportation:  10000,
				SocialExpense:   20000,
				DailyGoods:      10000,
				Utilities:       15000,
				SubscriptionFee: 5000,
			},
		},
		{
			name:      "【異常系】contextにuserIDがない場合は401を返すこと",
			setUserID: false,
			in: input{
				year:  "2026",
				month: "6",
			},
			wantAppError: httpx.Unauthorized(
				"authenticated user is required",
				errors.New("authenticated user is missing from context"),
			),
		},
		{
			name:      "【異常系】year変換失敗時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "abc",
				month: "6",
			},
			wantAppError: httpx.InvalidRequest("year must be a valid integer", errors.New("invalid syntax")),
		},
		{
			name:      "【異常系】month変換失敗時は400を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "abc",
			},
			wantAppError: httpx.InvalidRequest("month must be a valid integer", errors.New("invalid syntax")),
		},
		{
			name:      "【異常系】ErrHouseholdNotFound時は404を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
			},
			service: fakeHouseholdService{
				getFunc: func(ctx context.Context, userID uint, year int, month int) (*service.HouseholdResponse, error) {
					return nil, service.ErrHouseholdNotFound
				},
			},
			wantAppError: httpx.NotFound("household data was not found", service.ErrHouseholdNotFound),
		},
		{
			name:      "【異常系】想定外エラー時は500を返すこと",
			setUserID: true,
			in: input{
				year:  "2026",
				month: "6",
			},
			service: fakeHouseholdService{
				getFunc: func(ctx context.Context, userID uint, year int, month int) (*service.HouseholdResponse, error) {
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
			req := httptest.NewRequest(http.MethodGet, "/households/"+tt.in.year+"/"+tt.in.month, nil)
			rec := httptest.NewRecorder()
			c := e.NewContext(req, rec)
			c.SetParamNames("year", "month")
			c.SetParamValues(tt.in.year, tt.in.month)
			if tt.setUserID {
				c.Set(authUserIDContextKey, uint(1))
			}

			h := NewHouseholdHandler(&tt.service)
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

			var got service.HouseholdResponse
			require.NoError(t, json.Unmarshal(rec.Body.Bytes(), &got))
			require.Equal(t, tt.wantResponse, &got)
		})
	}
}
