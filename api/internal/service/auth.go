package service

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"github.com/RintaroNasu/life-sim/api/internal/auth"
	"github.com/RintaroNasu/life-sim/api/internal/models"
	"github.com/RintaroNasu/life-sim/api/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidEmailFormat = errors.New("invalid email format")
	ErrEmailRequired      = errors.New("email is required")
	ErrPasswordRequired   = errors.New("password is required")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type AuthService interface {
	Signup(ctx context.Context, input SignupInput) (*SignupOutput, error)
	Login(ctx context.Context, input LoginInput) (*LoginOutput, error)
}

type SignupInput struct {
	Name     string
	Email    string
	Password string
}

type SignupOutput struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type LoginInput struct {
	Email    string
	Password string
}

type LoginOutput struct {
	Token string `json:"token"`
}

type authService struct {
	repo       repository.AuthRepository
	jwtManager *auth.JWTManager
}

func NewAuthService(repo repository.AuthRepository, jwtManager *auth.JWTManager) AuthService {
	return &authService{
		repo:       repo,
		jwtManager: jwtManager,
	}
}

func (s *authService) Signup(ctx context.Context, input SignupInput) (*SignupOutput, error) {
	email, err := normalizeAndValidateCredentials(input.Email, input.Password)
	if err != nil {
		return nil, err
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("generate password hash: %w", err)
	}

	user := &models.User{
		Name:         strings.TrimSpace(input.Name),
		Email:        email,
		PasswordHash: string(passwordHash),
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, ErrEmailAlreadyExists
		}

		return nil, fmt.Errorf("create user: %w", err)
	}

	return &SignupOutput{
		ID:    user.ID,
		Name:  user.Name,
		Email: user.Email,
	}, nil
}

func (s *authService) Login(ctx context.Context, input LoginInput) (*LoginOutput, error) {
	email, err := normalizeAndValidateCredentials(input.Email, input.Password)
	if err != nil {
		return nil, err
	}

	user, err := s.repo.FindUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}

		return nil, fmt.Errorf("find user by email: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return nil, ErrInvalidCredentials
		}

		return nil, fmt.Errorf("compare password hash: %w", err)
	}

	token, err := s.jwtManager.GenerateToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &LoginOutput{
		Token: token,
	}, nil
}

func normalizeAndValidateCredentials(email string, password string) (string, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	if normalizedEmail == "" {
		return "", ErrEmailRequired
	}

	if password == "" {
		return "", ErrPasswordRequired
	}

	if _, err := mail.ParseAddress(normalizedEmail); err != nil {
		return "", ErrInvalidEmailFormat
	}

	return normalizedEmail, nil
}
