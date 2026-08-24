package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/RintaroNasu/life-sim/api/internal/repository"
	"gorm.io/gorm"
)

var ErrDashboardNotFound = errors.New("dashboard data not found")

type DashboardService interface {
	GetDashboard(ctx context.Context, userID uint) (*DashboardResponse, error)
}

type ExpenseBreakdownItem struct {
	Label string `json:"label"`
	Value int    `json:"value"`
}

type DashboardResponse struct {
	Year             int                    `json:"year"`
	Month            int                    `json:"month"`
	Income           int                    `json:"income"`
	TotalExpenses    int                    `json:"total_expenses"`
	FreeAmount       int                    `json:"free_amount"`
	ExpenseBreakdown []ExpenseBreakdownItem `json:"expense_breakdown"`
}

type dashboardService struct {
	repo repository.HouseholdRepository
}

func NewDashboardService(repo repository.HouseholdRepository) DashboardService {
	return &dashboardService{repo: repo}
}

func (s *dashboardService) GetDashboard(ctx context.Context, userID uint) (*DashboardResponse, error) {
	now := time.Now()
	year := now.Year()
	month := int(now.Month())

	household, err := s.repo.FindHouseholdByUserAndMonth(ctx, userID, year, month)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDashboardNotFound
		}

		return nil, fmt.Errorf("find dashboard household by user and month: %w", err)
	}

	expenseBreakdown := []ExpenseBreakdownItem{
		{Label: "家賃", Value: household.Rent},
		{Label: "食費", Value: household.Food},
		{Label: "貯金額", Value: household.Savings},
		{Label: "交通費", Value: household.Transportation},
		{Label: "交際費", Value: household.SocialExpense},
		{Label: "日用品", Value: household.DailyGoods},
		{Label: "光熱費", Value: household.Utilities},
		{Label: "サブスク費", Value: household.SubscriptionFee},
	}

	totalExpenses := 0
	for _, item := range expenseBreakdown {
		totalExpenses += item.Value
	}

	return &DashboardResponse{
		Year:             household.Year,
		Month:            household.Month,
		Income:           household.Income,
		TotalExpenses:    totalExpenses,
		FreeAmount:       household.Income - totalExpenses,
		ExpenseBreakdown: expenseBreakdown,
	}, nil
}
