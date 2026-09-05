package repository

import (
	"context"

	"github.com/RintaroNasu/life-sim/api/internal/models"
	"gorm.io/gorm"
)

type SimulationRepository interface {
	CreateSimulation(ctx context.Context, simulation *models.Simulation) error
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
