package service

import (
	"context"
	"errors"
	"testing"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

type fakeHouseholdRepo struct {
	upsertFunc func(ctx context.Context, household *models.Household) error
	findFunc   func(ctx context.Context, userID uint, year int, month int) (*models.Household, error)
}

func (f *fakeHouseholdRepo) UpsertHousehold(ctx context.Context, household *models.Household) error {
	if f.upsertFunc == nil {
		return nil
	}

	return f.upsertFunc(ctx, household)
}

func (f *fakeHouseholdRepo) FindHouseholdByUserAndMonth(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
	if f.findFunc == nil {
		return nil, nil
	}

	return f.findFunc(ctx, userID, year, month)
}

func TestHouseholdService_SaveHousehold(t *testing.T) {
	type input struct {
		userID uint
		save   SaveHouseholdInput
	}

	tests := []struct {
		name         string
		in           input
		repo         fakeHouseholdRepo
		want         *HouseholdResponse
		wantErr      error
		errContains  string
		assertUpsert func(t *testing.T, household *models.Household)
	}{
		{
			name: "【正常系】家計データを保存できること",
			in: input{
				userID: 1,
				save: SaveHouseholdInput{
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
			repo: fakeHouseholdRepo{
				upsertFunc: func(ctx context.Context, household *models.Household) error {
					return nil
				},
				findFunc: func(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
					return &models.Household{
						ID:              1,
						UserID:          userID,
						Year:            year,
						Month:           month,
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
			want: &HouseholdResponse{
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
			assertUpsert: func(t *testing.T, household *models.Household) {
				require.Equal(t, uint(1), household.UserID)
				require.Equal(t, 2026, household.Year)
				require.Equal(t, 6, household.Month)
				require.Equal(t, 290000, household.Income)
			},
		},
		{
			name: "【異常系】year不正の場合は ErrInvalidYear を返すこと",
			in: input{
				userID: 1,
				save: SaveHouseholdInput{
					Year:  0,
					Month: 6,
				},
			},
			wantErr: ErrInvalidYear,
		},
		{
			name: "【異常系】month不正の場合は ErrInvalidMonth を返すこと",
			in: input{
				userID: 1,
				save: SaveHouseholdInput{
					Year:  2026,
					Month: 13,
				},
			},
			wantErr: ErrInvalidMonth,
		},
		{
			name: "【異常系】負数を含む場合は ErrNegativeValue を返すこと",
			in: input{
				userID: 1,
				save: SaveHouseholdInput{
					Year:  2026,
					Month: 6,
					Rent:  -1,
				},
			},
			wantErr: ErrNegativeValue,
		},
		{
			name: "【異常系】DB保存失敗時は upsert household エラーになること",
			in: input{
				userID: 1,
				save: SaveHouseholdInput{
					Year:  2026,
					Month: 6,
				},
			},
			repo: fakeHouseholdRepo{
				upsertFunc: func(ctx context.Context, household *models.Household) error {
					return errors.New("insert failed")
				},
			},
			errContains: "upsert household",
		},
		{
			name: "【異常系】保存後のDB取得失敗時は find household after upsert エラーになること",
			in: input{
				userID: 1,
				save: SaveHouseholdInput{
					Year:  2026,
					Month: 6,
				},
			},
			repo: fakeHouseholdRepo{
				upsertFunc: func(ctx context.Context, household *models.Household) error {
					return nil
				},
				findFunc: func(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
					return nil, errors.New("select failed")
				},
			},
			errContains: "find household after upsert",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			var upserted *models.Household
			repo := tt.repo
			if repo.upsertFunc != nil {
				original := repo.upsertFunc
				repo.upsertFunc = func(ctx context.Context, household *models.Household) error {
					upserted = &models.Household{
						UserID:          household.UserID,
						Year:            household.Year,
						Month:           household.Month,
						Income:          household.Income,
						Rent:            household.Rent,
						Food:            household.Food,
						Savings:         household.Savings,
						Transportation:  household.Transportation,
						SocialExpense:   household.SocialExpense,
						DailyGoods:      household.DailyGoods,
						Utilities:       household.Utilities,
						SubscriptionFee: household.SubscriptionFee,
					}
					return original(ctx, household)
				}
			}

			svc := NewHouseholdService(&repo)
			got, err := svc.SaveHousehold(context.Background(), tt.in.userID, tt.in.save)

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
				if tt.assertUpsert != nil {
					require.NotNil(t, upserted)
					tt.assertUpsert(t, upserted)
				}
			}
		})
	}
}

func TestHouseholdService_GetHousehold(t *testing.T) {
	tests := []struct {
		name        string
		userID      uint
		year        int
		month       int
		repo        fakeHouseholdRepo
		want        *HouseholdResponse
		wantErr     error
		errContains string
	}{
		{
			name:   "【正常系】指定月の家計データを取得できること",
			userID: 1,
			year:   2026,
			month:  6,
			repo: fakeHouseholdRepo{
				findFunc: func(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
					return &models.Household{
						ID:              1,
						UserID:          userID,
						Year:            year,
						Month:           month,
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
			want: &HouseholdResponse{
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
			name:    "【異常系】year不正の場合は ErrInvalidYear を返すこと",
			userID:  1,
			year:    0,
			month:   6,
			wantErr: ErrInvalidYear,
		},
		{
			name:    "【異常系】month不正の場合は ErrInvalidMonth を返すこと",
			userID:  1,
			year:    2026,
			month:   13,
			wantErr: ErrInvalidMonth,
		},
		{
			name:   "【異常系】データ未登録の場合は ErrHouseholdNotFound を返すこと",
			userID: 1,
			year:   2026,
			month:  6,
			repo: fakeHouseholdRepo{
				findFunc: func(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
					return nil, gorm.ErrRecordNotFound
				},
			},
			wantErr: ErrHouseholdNotFound,
		},
		{
			name:   "【異常系】DB検索失敗時は find household by user and month エラーになること",
			userID: 1,
			year:   2026,
			month:  6,
			repo: fakeHouseholdRepo{
				findFunc: func(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
					return nil, errors.New("select failed")
				},
			},
			errContains: "find household by user and month",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			svc := NewHouseholdService(&tt.repo)
			got, err := svc.GetHousehold(context.Background(), tt.userID, tt.year, tt.month)

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
