package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"github.com/RintaroNasu/life-sim/api/internal/repository"
)

var ErrSimulationNegativeValue = errors.New("amount must be greater than or equal to 0")

type SimulationService interface {
	SaveSimulation(ctx context.Context, userID uint, input SaveSimulationInput) (*SimulationResponse, error)
}

type SaveSimulationInput struct {
	Title                string
	Income               int
	Rent                 int
	Food                 int
	Transportation       int
	SocialExpense        int
	DailyGoods           int
	Utilities            int
	SubscriptionFee      int
	Savings              int
	MonthlyExpenses      int
	MonthlyFreeAmount    int
	YearlySavings        int
	YearlyFreeAmount     int
	MonthlyAssetIncrease int
	YearlyAssetIncrease  int
	FiveYearAssets       int
}

type SimulationResponse struct {
	ID                   uint      `json:"id"`
	Title                string    `json:"title"`
	Income               int       `json:"income"`
	Rent                 int       `json:"rent"`
	Food                 int       `json:"food"`
	Transportation       int       `json:"transportation"`
	SocialExpense        int       `json:"social_expense"`
	DailyGoods           int       `json:"daily_goods"`
	Utilities            int       `json:"utilities"`
	SubscriptionFee      int       `json:"subscription_fee"`
	Savings              int       `json:"savings"`
	MonthlyExpenses      int       `json:"monthly_expenses"`
	MonthlyFreeAmount    int       `json:"monthly_free_amount"`
	YearlySavings        int       `json:"yearly_savings"`
	YearlyFreeAmount     int       `json:"yearly_free_amount"`
	MonthlyAssetIncrease int       `json:"monthly_asset_increase"`
	YearlyAssetIncrease  int       `json:"yearly_asset_increase"`
	FiveYearAssets       int       `json:"five_year_assets"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type simulationService struct {
	repo repository.SimulationRepository
}

func NewSimulationService(repo repository.SimulationRepository) SimulationService {
	return &simulationService{repo: repo}
}

func (s *simulationService) SaveSimulation(ctx context.Context, userID uint, input SaveSimulationInput) (*SimulationResponse, error) {
	if err := validateSimulationNonNegativeAmounts(input); err != nil {
		return nil, err
	}

	simulation := &models.Simulation{
		UserID:               userID,
		Title:                input.Title,
		Income:               input.Income,
		Rent:                 input.Rent,
		Food:                 input.Food,
		Transportation:       input.Transportation,
		SocialExpense:        input.SocialExpense,
		DailyGoods:           input.DailyGoods,
		Utilities:            input.Utilities,
		SubscriptionFee:      input.SubscriptionFee,
		Savings:              input.Savings,
		MonthlyExpenses:      input.MonthlyExpenses,
		MonthlyFreeAmount:    input.MonthlyFreeAmount,
		YearlySavings:        input.YearlySavings,
		YearlyFreeAmount:     input.YearlyFreeAmount,
		MonthlyAssetIncrease: input.MonthlyAssetIncrease,
		YearlyAssetIncrease:  input.YearlyAssetIncrease,
		FiveYearAssets:       input.FiveYearAssets,
	}

	if err := s.repo.CreateSimulation(ctx, simulation); err != nil {
		return nil, fmt.Errorf("create simulation: %w", err)
	}

	return &SimulationResponse{
		ID:                   simulation.ID,
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
		CreatedAt:            simulation.CreatedAt,
		UpdatedAt:            simulation.UpdatedAt,
	}, nil
}

func validateSimulationNonNegativeAmounts(input SaveSimulationInput) error {
	values := []int{
		input.Income,
		input.Rent,
		input.Food,
		input.Transportation,
		input.SocialExpense,
		input.DailyGoods,
		input.Utilities,
		input.SubscriptionFee,
		input.Savings,
		input.MonthlyExpenses,
		input.YearlySavings,
	}

	for _, value := range values {
		if value < 0 {
			return ErrSimulationNegativeValue
		}
	}

	return nil
}
