package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"github.com/RintaroNasu/life-sim/api/internal/repository"
	"gorm.io/gorm"
)

var (
	ErrInvalidYear       = errors.New("invalid year")
	ErrInvalidMonth      = errors.New("invalid month")
	ErrNegativeValue     = errors.New("amount must be greater than or equal to 0")
	ErrHouseholdNotFound = errors.New("household not found")
)

type HouseholdService interface {
	GetHousehold(ctx context.Context, userID uint, year int, month int) (*HouseholdResponse, error)
	SaveHousehold(ctx context.Context, userID uint, input SaveHouseholdInput) (*HouseholdResponse, error)
}

type SaveHouseholdInput struct {
	Year            int
	Month           int
	Income          int
	Rent            int
	Food            int
	Savings         int
	Transportation  int
	SocialExpense   int
	DailyGoods      int
	Utilities       int
	SubscriptionFee int
}

type HouseholdResponse struct {
	ID              uint `json:"id"`
	Year            int  `json:"year"`
	Month           int  `json:"month"`
	Income          int  `json:"income"`
	Rent            int  `json:"rent"`
	Food            int  `json:"food"`
	Savings         int  `json:"savings"`
	Transportation  int  `json:"transportation"`
	SocialExpense   int  `json:"social_expense"`
	DailyGoods      int  `json:"daily_goods"`
	Utilities       int  `json:"utilities"`
	SubscriptionFee int  `json:"subscription_fee"`
}

type householdService struct {
	repo repository.HouseholdRepository
}

func NewHouseholdService(repo repository.HouseholdRepository) HouseholdService {
	return &householdService{repo: repo}
}

func (s *householdService) GetHousehold(ctx context.Context, userID uint, year int, month int) (*HouseholdResponse, error) {
	if year < 1 {
		return nil, ErrInvalidYear
	}

	if month < 1 || month > 12 {
		return nil, ErrInvalidMonth
	}

	household, err := s.repo.FindHouseholdByUserAndMonth(ctx, userID, year, month)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrHouseholdNotFound
		}

		return nil, fmt.Errorf("find household by user and month: %w", err)
	}

	return &HouseholdResponse{
		ID:              household.ID,
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
	}, nil
}

func (s *householdService) SaveHousehold(ctx context.Context, userID uint, input SaveHouseholdInput) (*HouseholdResponse, error) {
	if input.Year < 1 {
		return nil, ErrInvalidYear
	}

	if input.Month < 1 || input.Month > 12 {
		return nil, ErrInvalidMonth
	}

	if err := validateNonNegativeAmounts(input); err != nil {
		return nil, err
	}

	household := &models.Household{
		UserID:          userID,
		Year:            input.Year,
		Month:           input.Month,
		Income:          input.Income,
		Rent:            input.Rent,
		Food:            input.Food,
		Savings:         input.Savings,
		Transportation:  input.Transportation,
		SocialExpense:   input.SocialExpense,
		DailyGoods:      input.DailyGoods,
		Utilities:       input.Utilities,
		SubscriptionFee: input.SubscriptionFee,
	}

	if err := s.repo.UpsertHousehold(ctx, household); err != nil {
		return nil, fmt.Errorf("upsert household: %w", err)
	}

	saved, err := s.repo.FindHouseholdByUserAndMonth(ctx, userID, input.Year, input.Month)
	if err != nil {
		return nil, fmt.Errorf("find household after upsert: %w", err)
	}

	return &HouseholdResponse{
		ID:              saved.ID,
		Year:            saved.Year,
		Month:           saved.Month,
		Income:          saved.Income,
		Rent:            saved.Rent,
		Food:            saved.Food,
		Savings:         saved.Savings,
		Transportation:  saved.Transportation,
		SocialExpense:   saved.SocialExpense,
		DailyGoods:      saved.DailyGoods,
		Utilities:       saved.Utilities,
		SubscriptionFee: saved.SubscriptionFee,
	}, nil
}

func validateNonNegativeAmounts(input SaveHouseholdInput) error {
	values := []int{
		input.Income,
		input.Rent,
		input.Food,
		input.Savings,
		input.Transportation,
		input.SocialExpense,
		input.DailyGoods,
		input.Utilities,
		input.SubscriptionFee,
	}

	for _, value := range values {
		if value < 0 {
			return ErrNegativeValue
		}
	}

	return nil
}
