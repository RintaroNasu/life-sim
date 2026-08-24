package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestDashboardService_GetDashboard(t *testing.T) {
	now := time.Now()
	year := now.Year()
	month := int(now.Month())

	tests := []struct {
		name        string
		userID      uint
		repo        fakeHouseholdRepo
		want        *DashboardResponse
		wantErr     error
		errContains string
	}{
		{
			name:   "【正常系】当月のダッシュボードデータを取得できること",
			userID: 1,
			repo: fakeHouseholdRepo{
				findFunc: func(ctx context.Context, userID uint, gotYear int, gotMonth int) (*models.Household, error) {
					require.Equal(t, uint(1), userID)
					require.Equal(t, year, gotYear)
					require.Equal(t, month, gotMonth)

					return &models.Household{
						ID:              1,
						UserID:          userID,
						Year:            gotYear,
						Month:           gotMonth,
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
			want: &DashboardResponse{
				Year:          year,
				Month:         month,
				Income:        290000,
				TotalExpenses: 230000,
				FreeAmount:    60000,
				ExpenseBreakdown: []ExpenseBreakdownItem{
					{Label: "家賃", Value: 90000},
					{Label: "食費", Value: 50000},
					{Label: "貯金額", Value: 30000},
					{Label: "交通費", Value: 10000},
					{Label: "交際費", Value: 20000},
					{Label: "日用品", Value: 10000},
					{Label: "光熱費", Value: 15000},
					{Label: "サブスク費", Value: 5000},
				},
			},
		},
		{
			name:   "【異常系】当月データ未登録の場合は ErrDashboardNotFound を返すこと",
			userID: 1,
			repo: fakeHouseholdRepo{
				findFunc: func(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
					return nil, gorm.ErrRecordNotFound
				},
			},
			wantErr: ErrDashboardNotFound,
		},
		{
			name:   "【異常系】DB検索失敗時は find dashboard household by user and month エラーになること",
			userID: 1,
			repo: fakeHouseholdRepo{
				findFunc: func(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
					return nil, errors.New("select failed")
				},
			},
			errContains: "find dashboard household by user and month",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			svc := NewDashboardService(&tt.repo)
			got, err := svc.GetDashboard(context.Background(), tt.userID)

			switch {
			case tt.wantErr != nil:
				require.ErrorIs(t, err, tt.wantErr)
				require.Nil(t, got)
			case tt.errContains != "":
				require.Error(t, err)
				require.Contains(t, err.Error(), tt.errContains)
				require.Nil(t, got)
			default:
				require.NoError(t, err)
				require.NotNil(t, got)
				require.Equal(t, tt.want, got)
			}
		})
	}
}
