package repository

import (
	"context"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type HouseholdRepository interface {
	UpsertHousehold(ctx context.Context, household *models.Household) error
	FindHouseholdByUserAndMonth(ctx context.Context, userID uint, year int, month int) (*models.Household, error)
}

type householdRepository struct {
	db *gorm.DB
}

func NewHouseholdRepository(db *gorm.DB) HouseholdRepository {
	return &householdRepository{db: db}
}

func (r *householdRepository) UpsertHousehold(ctx context.Context, household *models.Household) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{
				{Name: "user_id"},
				{Name: "year"},
				{Name: "month"},
			},
			DoUpdates: clause.AssignmentColumns([]string{
				"income",
				"rent",
				"food",
				"savings",
				"transportation",
				"social_expense",
				"daily_goods",
				"utilities",
				"subscription_fee",
				"updated_at",
			}),
		}).
		Create(household).Error
}

func (r *householdRepository) FindHouseholdByUserAndMonth(ctx context.Context, userID uint, year int, month int) (*models.Household, error) {
	var household models.Household
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND year = ? AND month = ?", userID, year, month).
		First(&household).Error; err != nil {
		return nil, err
	}

	return &household, nil
}
