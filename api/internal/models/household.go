package models

import "time"

type Household struct {
	ID              uint `gorm:"primaryKey"`
	UserID          uint `gorm:"not null;uniqueIndex:idx_user_year_month"`
	Year            int  `gorm:"not null;uniqueIndex:idx_user_year_month"`
	Month           int  `gorm:"not null;uniqueIndex:idx_user_year_month"`
	Income          int  `gorm:"not null"`
	Rent            int  `gorm:"not null"`
	Food            int  `gorm:"not null"`
	Savings         int  `gorm:"not null"`
	Transportation  int  `gorm:"not null"`
	SocialExpense   int  `gorm:"not null"`
	DailyGoods      int  `gorm:"not null"`
	Utilities       int  `gorm:"not null"`
	SubscriptionFee int  `gorm:"not null"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
