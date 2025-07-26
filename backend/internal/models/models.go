package models

import (
	"fmt"
	"log"
	"time"

	"child-behavior-app/internal/utils"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// User 用户表
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Phone     *string   `json:"phone" gorm:"uniqueIndex;size:20"`
	Password  *string   `json:"-" gorm:"size:255"`
	Nickname  string    `json:"nickname" gorm:"size:50;not null"`
	Email     string    `json:"email" gorm:"size:100"`
	Avatar    string    `json:"avatar" gorm:"size:255"`
	Age       int       `json:"age" gorm:"default:0"`
	Gender    string    `json:"gender" gorm:"size:10"`
	Role      string    `json:"role" gorm:"type:enum('parent','child');not null"`
	ParentID  *uint     `json:"parent_id" gorm:"index"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// 关联关系
	Parent   *User  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []User `json:"children,omitempty" gorm:"foreignKey:ParentID"`
}

// BehaviorRecord 行为记录表
type BehaviorRecord struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	ChildID      uint      `json:"child_id" gorm:"column:user_id;not null;index"`
	RecorderID   uint      `json:"recorder_id" gorm:"not null;index"`
	BehaviorType string    `json:"behavior_type" gorm:"column:behavior_type;size:20;not null"`
	BehaviorDesc string    `json:"behavior_desc" gorm:"column:description;type:text;not null"`
	ScoreChange  int       `json:"score_change" gorm:"column:points;not null"`
	ImageURL     string    `json:"image_url" gorm:"column:image_url;size:255"`
	RecordedAt   time.Time `json:"recorded_at" gorm:"not null"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// 关联关系
	Child    User `json:"child" gorm:"foreignKey:ChildID"`
	Recorder User `json:"recorder" gorm:"foreignKey:RecorderID"`
}

// UserPoints 积分表
type UserPoints struct {
	ID              uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID          uint      `json:"user_id" gorm:"uniqueIndex;not null"`
	TotalPoints     int       `json:"total_points" gorm:"default:0;not null"`
	AvailablePoints int       `json:"available_points" gorm:"default:0;not null"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// 关联关系
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// Reward 奖励表
type Reward struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        string    `json:"name" gorm:"size:100;not null"`
	Description string    `json:"description" gorm:"type:text"`
	Points      int       `json:"points" gorm:"not null"`
	Image       string    `json:"image" gorm:"size:255"`
	Stock       int       `json:"stock" gorm:"default:1;not null"`
	IsActive    bool      `json:"is_active" gorm:"default:true;not null"`
	CreatedBy   uint      `json:"created_by" gorm:"not null;index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// 关联关系
	Creator User `json:"creator" gorm:"foreignKey:CreatedBy"`
}

// ExchangeRecord 兑换记录表
type ExchangeRecord struct {
	ID          uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID      uint      `json:"user_id" gorm:"not null;index"`
	RewardID    uint      `json:"reward_id" gorm:"not null;index"`
	PointsUsed  int       `json:"points_used" gorm:"column:points_used;not null"`
	ExchangedAt time.Time `json:"exchanged_at" gorm:"not null"`
	Status      string    `json:"status" gorm:"type:enum('pending','completed','cancelled');default:'completed';not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// 关联关系
	User   User   `json:"user" gorm:"foreignKey:UserID"`
	Reward Reward `json:"reward" gorm:"foreignKey:RewardID"`
}

// InitDB 初始化数据库连接（使用配置文件）
func InitDB() *gorm.DB {
	// 加载配置文件
	config, err := utils.LoadConfig()
	if err != nil {
		log.Printf("Failed to load config: %v", err)
		log.Fatal("Config loading failed")
	}

	// 使用配置文件初始化数据库连接
	db, err := InitDBWithConfig(config.Database)
	if err != nil {
		log.Printf("Failed to connect to MariaDB: %v", err)
		log.Printf("Please ensure MariaDB is running and the database '%s' exists", config.Database.DBName)
		log.Printf("You can create it with: CREATE DATABASE %s CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;", config.Database.DBName)
		log.Fatal("MariaDB connection failed")
	}

	log.Println("Successfully connected to MariaDB database")
	return db
}

// InitDBWithConfig 使用配置初始化MariaDB数据库连接
func InitDBWithConfig(config utils.DatabaseConfig) (*gorm.DB, error) {
	dsn := config.GetDSN()

	// 使用MySQL驱动连接MariaDB（兼容）
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MariaDB: %w", err)
	}

	// 配置连接池
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(config.ConnMaxLifetime) * time.Second)

	return db, nil
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate(db *gorm.DB) error {
	err := db.AutoMigrate(
		&User{},
		&BehaviorRecord{},
		&UserPoints{},
		&Reward{},
		&ExchangeRecord{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}
	log.Println("Database migration completed successfully")
	return nil
}
