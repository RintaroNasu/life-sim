package migrate

import (
	"github.com/RintaroNasu/life-sim/api/internal/models"
	"gorm.io/gorm"
)

func Migrate(conn *gorm.DB) error {
	return conn.AutoMigrate(
		&models.User{},
		&models.Household{},
	)
}
