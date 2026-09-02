package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"github.com/stretchr/testify/require"
)

type fakeSimulationRepo struct {
	createFunc func(ctx context.Context, simulation *models.Simulation) error
}

func (f *fakeSimulationRepo) CreateSimulation(ctx context.Context, simulation *models.Simulation) error {
	if f.createFunc == nil {
		return nil
	}

	return f.createFunc(ctx, simulation)
}

func TestSimulationService_SaveSimulation(t *testing.T) {
	type input struct {
		userID uint
		save   SaveSimulationInput
	}

	now := time.Date(2026, 9, 2, 10, 0, 0, 0, time.UTC)

	tests := []struct {
		name        string
		in          input
		repo        fakeSimulationRepo
		want        *SimulationResponse
		wantErr     error
		errContains string
		assertSave  func(t *testing.T, simulation *models.Simulation)
	}{
		{
			name: "【正常系】シミュレーションを保存できること",
			in: input{
				userID: 1,
				save: SaveSimulationInput{
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
				},
			},
			repo: fakeSimulationRepo{
				createFunc: func(ctx context.Context, simulation *models.Simulation) error {
					simulation.ID = 10
					simulation.CreatedAt = now
					simulation.UpdatedAt = now
					return nil
				},
			},
			want: &SimulationResponse{
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
			assertSave: func(t *testing.T, simulation *models.Simulation) {
				require.Equal(t, uint(1), simulation.UserID)
				require.Equal(t, "固定費見直し", simulation.Title)
				require.Equal(t, 290000, simulation.Income)
				require.Equal(t, 5400000, simulation.FiveYearAssets)
			},
		},
		{
			name: "【正常系】自由額や資産増加額が負数でも保存できること",
			in: input{
				userID: 2,
				save: SaveSimulationInput{
					Title:                "赤字シミュレーション",
					Income:               200000,
					Rent:                 120000,
					Food:                 50000,
					Transportation:       20000,
					SocialExpense:        30000,
					DailyGoods:           10000,
					Utilities:            15000,
					SubscriptionFee:      5000,
					Savings:              10000,
					MonthlyExpenses:      250000,
					MonthlyFreeAmount:    -60000,
					YearlySavings:        120000,
					YearlyFreeAmount:     -720000,
					MonthlyAssetIncrease: -50000,
					YearlyAssetIncrease:  -600000,
					FiveYearAssets:       -3000000,
				},
			},
			repo: fakeSimulationRepo{
				createFunc: func(ctx context.Context, simulation *models.Simulation) error {
					simulation.ID = 11
					simulation.CreatedAt = now
					simulation.UpdatedAt = now
					return nil
				},
			},
			want: &SimulationResponse{
				ID:                   11,
				Title:                "赤字シミュレーション",
				Income:               200000,
				Rent:                 120000,
				Food:                 50000,
				Transportation:       20000,
				SocialExpense:        30000,
				DailyGoods:           10000,
				Utilities:            15000,
				SubscriptionFee:      5000,
				Savings:              10000,
				MonthlyExpenses:      250000,
				MonthlyFreeAmount:    -60000,
				YearlySavings:        120000,
				YearlyFreeAmount:     -720000,
				MonthlyAssetIncrease: -50000,
				YearlyAssetIncrease:  -600000,
				FiveYearAssets:       -3000000,
				CreatedAt:            now,
				UpdatedAt:            now,
			},
		},
		{
			name: "【異常系】負数を含む場合は ErrSimulationNegativeValue を返すこと",
			in: input{
				userID: 1,
				save: SaveSimulationInput{
					Rent: -1,
				},
			},
			wantErr: ErrSimulationNegativeValue,
		},
		{
			name: "【異常系】DB保存失敗時は create simulation エラーになること",
			in: input{
				userID: 1,
				save: SaveSimulationInput{
					Income: 290000,
				},
			},
			repo: fakeSimulationRepo{
				createFunc: func(ctx context.Context, simulation *models.Simulation) error {
					return errors.New("insert failed")
				},
			},
			errContains: "create simulation",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			var savedSimulation *models.Simulation
			repo := tt.repo
			if repo.createFunc != nil {
				original := repo.createFunc
				repo.createFunc = func(ctx context.Context, simulation *models.Simulation) error {
					savedSimulation = &models.Simulation{
						UserID:               simulation.UserID,
						Title:                simulation.Title,
						Income:               simulation.Income,
						Rent:                 simulation.Rent,
						Food:                 simulation.Food,
						Transportation:       simulation.Transportation,
						SocialExpense:        simulation.SocialExpense,
						DailyGoods:           simulation.DailyGoods,
						Utilities:            simulation.Utilities,
						SubscriptionFee:      simulation.SubscriptionFee,
						Savings:              simulation.Savings,
						MonthlyExpenses:      simulation.MonthlyExpenses,
						MonthlyFreeAmount:    simulation.MonthlyFreeAmount,
						YearlySavings:        simulation.YearlySavings,
						YearlyFreeAmount:     simulation.YearlyFreeAmount,
						MonthlyAssetIncrease: simulation.MonthlyAssetIncrease,
						YearlyAssetIncrease:  simulation.YearlyAssetIncrease,
						FiveYearAssets:       simulation.FiveYearAssets,
					}
					return original(ctx, simulation)
				}
			}

			svc := NewSimulationService(&repo)
			got, err := svc.SaveSimulation(context.Background(), tt.in.userID, tt.in.save)

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
				if tt.assertSave != nil {
					require.NotNil(t, savedSimulation)
					tt.assertSave(t, savedSimulation)
				}
			}
		})
	}
}
