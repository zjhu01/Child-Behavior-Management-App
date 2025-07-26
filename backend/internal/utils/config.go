package utils

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/spf13/viper"
)

// Config 应用配置结构
type Config struct {
	App        AppConfig        `mapstructure:"app"`
	Database   DatabaseConfig   `mapstructure:"database"`
	JWT        JWTConfig        `mapstructure:"jwt"`
	Upload     UploadConfig     `mapstructure:"upload"`
	CORS       CORSConfig       `mapstructure:"cors"`
	Log        LogConfig        `mapstructure:"log"`
	Cache      CacheConfig      `mapstructure:"cache"`
	Security   SecurityConfig   `mapstructure:"security"`
	Development DevelopmentConfig `mapstructure:"development"`
	Production  ProductionConfig  `mapstructure:"production"`
}

// AppConfig 应用配置
type AppConfig struct {
	Name    string `mapstructure:"name"`
	Version string `mapstructure:"version"`
	Port    int    `mapstructure:"port"`
	Mode    string `mapstructure:"mode"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Username        string `mapstructure:"username"`
	Password        string `mapstructure:"password"`
	DBName          string `mapstructure:"dbname"`
	Charset         string `mapstructure:"charset"`
	ParseTime       bool   `mapstructure:"parse_time"`
	Loc             string `mapstructure:"loc"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret       string `mapstructure:"secret"`
	ExpiresHours int    `mapstructure:"expires_hours"`
	Issuer       string `mapstructure:"issuer"`
}

// UploadConfig 文件上传配置
type UploadConfig struct {
	MaxFileSize    int64    `mapstructure:"max_file_size"`
	MaxAvatarSize  int64    `mapstructure:"max_avatar_size"`
	AllowedTypes   []string `mapstructure:"allowed_types"`
	UploadDir      string   `mapstructure:"upload_dir"`
	AvatarDir      string   `mapstructure:"avatar_dir"`
}

// CORSConfig CORS配置
type CORSConfig struct {
	AllowedOrigins   []string `mapstructure:"allowed_origins"`
	AllowedMethods   []string `mapstructure:"allowed_methods"`
	AllowedHeaders   []string `mapstructure:"allowed_headers"`
	AllowCredentials bool     `mapstructure:"allow_credentials"`
	MaxAge           int      `mapstructure:"max_age"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	Output     string `mapstructure:"output"`
	FilePath   string `mapstructure:"file_path"`
	MaxSize    int    `mapstructure:"max_size"`
	MaxBackups int    `mapstructure:"max_backups"`
	MaxAge     int    `mapstructure:"max_age"`
	Compress   bool   `mapstructure:"compress"`
}

// CacheConfig 缓存配置
type CacheConfig struct {
	DefaultExpiration int `mapstructure:"default_expiration"`
	CleanupInterval   int `mapstructure:"cleanup_interval"`
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	BcryptCost int `mapstructure:"bcrypt_cost"`
	RateLimit  struct {
		Enabled           bool `mapstructure:"enabled"`
		RequestsPerMinute int  `mapstructure:"requests_per_minute"`
		Burst             int  `mapstructure:"burst"`
	} `mapstructure:"rate_limit"`
}

// DevelopmentConfig 开发环境配置
type DevelopmentConfig struct {
	AutoMigrate bool `mapstructure:"auto_migrate"`
	SeedData    bool `mapstructure:"seed_data"`
	DebugSQL    bool `mapstructure:"debug_sql"`
}

// ProductionConfig 生产环境配置
type ProductionConfig struct {
	AutoMigrate bool `mapstructure:"auto_migrate"`
	SeedData    bool `mapstructure:"seed_data"`
	DebugSQL    bool `mapstructure:"debug_sql"`
}

// LoadConfig 加载配置文件
func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	
	// 添加配置文件搜索路径
	viper.AddConfigPath("./configs")
	viper.AddConfigPath("../configs")
	viper.AddConfigPath(".")
	
	// 设置环境变量前缀
	viper.SetEnvPrefix("CHILD_BEHAVIOR")
	viper.AutomaticEnv()
	
	// 设置默认值
	setDefaults()
	
	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			// 配置文件未找到，使用默认值
			fmt.Println("Config file not found, using default values")
		} else {
			// 配置文件找到但解析出错
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}
	
	// 解析配置到结构体
	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}
	
	// 从环境变量覆盖敏感配置
	overrideFromEnv(&config)
	
	return &config, nil
}

// setDefaults 设置默认配置值
func setDefaults() {
	// 应用默认配置
	viper.SetDefault("app.name", "Child Behavior Management API")
	viper.SetDefault("app.version", "1.0.0")
	viper.SetDefault("app.port", 8080)
	viper.SetDefault("app.mode", "debug")
	
	// 数据库默认配置
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 3306)
	viper.SetDefault("database.username", "root")
	viper.SetDefault("database.password", "password")
	viper.SetDefault("database.dbname", "child_behavior_db")
	viper.SetDefault("database.charset", "utf8mb4")
	viper.SetDefault("database.parse_time", true)
	viper.SetDefault("database.loc", "Local")
	viper.SetDefault("database.max_idle_conns", 10)
	viper.SetDefault("database.max_open_conns", 100)
	viper.SetDefault("database.conn_max_lifetime", 3600)
	
	// JWT默认配置
	viper.SetDefault("jwt.secret", "your-secret-key-change-this-in-production")
	viper.SetDefault("jwt.expires_hours", 24)
	viper.SetDefault("jwt.issuer", "child-behavior-app")
	
	// 上传默认配置
	viper.SetDefault("upload.max_file_size", 5242880)  // 5MB
	viper.SetDefault("upload.max_avatar_size", 2097152) // 2MB
	viper.SetDefault("upload.upload_dir", "uploads")
	viper.SetDefault("upload.avatar_dir", "uploads/avatars")
	
	// 缓存默认配置
	viper.SetDefault("cache.default_expiration", 300)
	viper.SetDefault("cache.cleanup_interval", 600)
	
	// 安全默认配置
	viper.SetDefault("security.bcrypt_cost", 12)
}

// overrideFromEnv 从环境变量覆盖敏感配置
func overrideFromEnv(config *Config) {
	if dbHost := os.Getenv("DB_HOST"); dbHost != "" {
		config.Database.Host = dbHost
	}
	if dbPort := os.Getenv("DB_PORT"); dbPort != "" {
		if port, err := strconv.Atoi(dbPort); err == nil {
			config.Database.Port = port
		}
	}
	if dbUser := os.Getenv("DB_USER"); dbUser != "" {
		config.Database.Username = dbUser
	}
	if dbPass := os.Getenv("DB_PASSWORD"); dbPass != "" {
		config.Database.Password = dbPass
	}
	if dbName := os.Getenv("DB_NAME"); dbName != "" {
		config.Database.DBName = dbName
	}
	if jwtSecret := os.Getenv("JWT_SECRET"); jwtSecret != "" {
		config.JWT.Secret = jwtSecret
	}
	if appPort := os.Getenv("PORT"); appPort != "" {
		if port, err := strconv.Atoi(appPort); err == nil {
			config.App.Port = port
		}
	}
}

// GetDSN 获取MariaDB数据库连接字符串
func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=%t&loc=%s&allowNativePasswords=true&allowCleartextPasswords=true&tls=false&allowOldPasswords=true&clientFoundRows=true",
		c.Username,
		c.Password,
		c.Host,
		c.Port,
		c.DBName,
		c.Charset,
		c.ParseTime,
		c.Loc,
	)
}

// EnsureUploadDirs 确保上传目录存在
func (c *UploadConfig) EnsureUploadDirs() error {
	dirs := []string{c.UploadDir, c.AvatarDir}
	for _, dir := range dirs {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return fmt.Errorf("failed to create directory %s: %w", dir, err)
		}
	}
	return nil
}

// GetLogFilePath 获取日志文件完整路径
func (c *LogConfig) GetLogFilePath() string {
	if c.Output == "file" && c.FilePath != "" {
		dir := filepath.Dir(c.FilePath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			fmt.Printf("Failed to create log directory: %v\n", err)
		}
		return c.FilePath
	}
	return ""
}