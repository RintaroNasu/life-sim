package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTManager struct {
	secretKey []byte
	ttl       time.Duration
}

func NewJWTManager(secret string, ttl time.Duration) *JWTManager {
	return &JWTManager{
		secretKey: []byte(secret),
		ttl:       ttl,
	}
}

func (m *JWTManager) GenerateToken(userID uint) (string, error) {
	now := time.Now()

	claims := jwt.MapClaims{
		"sub": fmt.Sprintf("%d", userID),
		"exp": now.Add(m.ttl).Unix(),
		"iat": now.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(m.secretKey)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}

	return signedToken, nil
}
