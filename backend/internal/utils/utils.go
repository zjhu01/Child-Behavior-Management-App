package utils

import (
	"crypto/md5"
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWT密钥 - 从配置文件加载
var jwtSecret []byte

// 内存缓存
var (
	cache     = make(map[string]interface{})
	cacheMu   sync.RWMutex
	cacheTime = make(map[string]time.Time)
)

// Claims JWT声明
type Claims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// InitJWT 初始化JWT密钥
func InitJWT() error {
	config, err := LoadConfig()
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	jwtSecret = []byte(config.JWT.Secret)
	return nil
}

// HashPassword 密码哈希
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPasswordHash 验证密码
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateToken 生成JWT令牌
func GenerateToken(userID uint, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ParseToken 解析JWT令牌
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// InitCache 初始化缓存
func InitCache() {
	// 启动缓存清理协程
	go func() {
		for {
			time.Sleep(10 * time.Minute)
			CleanExpiredCache()
		}
	}()
}

// SetCache 设置缓存
func SetCache(key string, value interface{}, duration time.Duration) {
	cacheMu.Lock()
	defer cacheMu.Unlock()

	cache[key] = value
	cacheTime[key] = time.Now().Add(duration)
}

// GetCache 获取缓存
func GetCache(key string) (interface{}, bool) {
	cacheMu.RLock()
	defer cacheMu.RUnlock()

	value, exists := cache[key]
	if !exists {
		return nil, false
	}

	expireTime, timeExists := cacheTime[key]
	if !timeExists || time.Now().After(expireTime) {
		delete(cache, key)
		delete(cacheTime, key)
		return nil, false
	}

	return value, true
}

// DeleteCache 删除缓存
func DeleteCache(key string) {
	cacheMu.Lock()
	defer cacheMu.Unlock()

	delete(cache, key)
	delete(cacheTime, key)
}

// CleanExpiredCache 清理过期缓存
func CleanExpiredCache() {
	cacheMu.Lock()
	defer cacheMu.Unlock()

	now := time.Now()
	for key, expireTime := range cacheTime {
		if now.After(expireTime) {
			delete(cache, key)
			delete(cacheTime, key)
		}
	}
}

// GenerateFileHash 生成文件哈希
func GenerateFileHash(filename string) string {
	hash := md5.Sum([]byte(fmt.Sprintf("%s_%d", filename, time.Now().UnixNano())))
	return fmt.Sprintf("%x", hash)
}

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// SuccessResponse 成功响应
func SuccessResponse(data interface{}) Response {
	return Response{
		Code:    200,
		Message: "success",
		Data:    data,
	}
}

// ErrorResponse 错误响应
func ErrorResponse(code int, message string) Response {
	return Response{
		Code:    code,
		Message: message,
	}
}

// GetStringValue 安全获取字符串指针的值
func GetStringValue(ptr *string) string {
	if ptr == nil {
		return ""
	}
	return *ptr
}
