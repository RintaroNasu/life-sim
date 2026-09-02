package models

import "time"

type Simulation struct {
	ID                   uint `gorm:"primaryKey"`
	UserID               uint `gorm:"not null;index"`
	Title                string
	Income               int `gorm:"not null"`
	Rent                 int `gorm:"not null"`
	Food                 int `gorm:"not null"`
	Transportation       int `gorm:"not null"`
	SocialExpense        int `gorm:"not null"`
	DailyGoods           int `gorm:"not null"`
	Utilities            int `gorm:"not null"`
	SubscriptionFee      int `gorm:"not null"`
	Savings              int `gorm:"not null"`
	MonthlyExpenses      int `gorm:"not null"`
	MonthlyFreeAmount    int `gorm:"not null"`
	YearlySavings        int `gorm:"not null"`
	YearlyFreeAmount     int `gorm:"not null"`
	MonthlyAssetIncrease int `gorm:"not null"`
	YearlyAssetIncrease  int `gorm:"not null"`
	FiveYearAssets       int `gorm:"not null"`
	CreatedAt            time.Time
	UpdatedAt            time.Time
}
