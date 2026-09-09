package repository

import (
	"context"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"gorm.io/gorm"
)

type SimulationRepository interface {
	CreateSimulation(ctx context.Context, simulation *models.Simulation) error
	FindSimulationsByUser(ctx context.Context, userID uint) ([]models.Simulation, error)
	FindSimulationByUserAndID(ctx context.Context, userID uint, id uint) (*models.Simulation, error)
}

type simulationRepository struct {
	db *gorm.DB
}

func NewSimulationRepository(db *gorm.DB) SimulationRepository {
	return &simulationRepository{db: db}
}

func (r *simulationRepository) CreateSimulation(ctx context.Context, simulation *models.Simulation) error {
	return r.db.WithContext(ctx).Create(simulation).Error
}

func (r *simulationRepository) FindSimulationsByUser(ctx context.Context, userID uint) ([]models.Simulation, error) {
	var simulations []models.Simulation
	if err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&simulations).Error; err != nil {
		return nil, err
	}

	return simulations, nil
}

func (r *simulationRepository) FindSimulationByUserAndID(ctx context.Context, userID uint, id uint) (*models.Simulation, error) {
	var simulation models.Simulation
	if err := r.db.WithContext(ctx).
		Where("user_id = ? AND id = ?", userID, id).
		First(&simulation).Error; err != nil {
		return nil, err
	}

	return &simulation, nil
}
