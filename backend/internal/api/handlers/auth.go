package handlers

import (
	"net/http"

	"child-behavior-app/internal/models"
	"child-behavior-app/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// RegisterRequest 注册请求结构
type RegisterRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Nickname string `json:"nickname" binding:"required"`
	Role     string `json:"role" binding:"required,oneof=parent"`
}

// LoginRequest 登录请求结构
type LoginRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// VerifyPasswordRequest 密码验证请求结构
type VerifyPasswordRequest struct {
	Password string `json:"password" binding:"required"`
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// Register 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 检查手机号是否已存在
	var existingUser models.User
	if err := h.db.Where("phone = ?", req.Phone).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, utils.ErrorResponse(409, "Phone number already exists"))
		return
	}

	// 密码哈希
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to hash password"))
		return
	}

	// 创建用户（强制设置为家长角色）
	user := models.User{
		Phone:    &req.Phone,
		Password: &hashedPassword,
		Nickname: req.Nickname,
		Role:     "parent", // 注册时强制为家长角色
	}

	if err := h.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to create user"))
		return
	}

	// 为用户创建积分记录
	userPoints := models.UserPoints{
		UserID:          user.ID,
		TotalPoints:     0,
		AvailablePoints: 0,
	}
	h.db.Create(&userPoints)

	// 生成JWT令牌
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to generate token"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"user_id": user.ID,
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"phone":    utils.GetStringValue(user.Phone),
			"nickname": user.Nickname,
			"role":     user.Role,
			"avatar":   user.Avatar,
		},
	}))
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 查找用户
	var user models.User
	if err := h.db.Where("phone = ?", req.Phone).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse(401, "Invalid phone or password"))
		return
	}

	// 验证密码
	if user.Password == nil || !utils.CheckPasswordHash(req.Password, *user.Password) {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse(401, "Invalid phone or password"))
		return
	}

	// 生成JWT令牌
	token, err := utils.GenerateToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to generate token"))
		return
	}

	// 获取用户积分信息
	var userPoints models.UserPoints
	h.db.Where("user_id = ?", user.ID).First(&userPoints)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"user_id": user.ID,
		"token":   token,
		"user": gin.H{
			"id":               user.ID,
			"phone":            utils.GetStringValue(user.Phone),
			"nickname":         user.Nickname,
			"role":             user.Role,
			"avatar":           user.Avatar,
			"parent_id":        user.ParentID,
			"total_points":     userPoints.TotalPoints,
			"available_points": userPoints.AvailablePoints,
		},
	}))
}

// VerifyToken 验证JWT令牌
func (h *AuthHandler) VerifyToken(c *gin.Context) {
	// 如果能到达这里，说明中间件已经验证了token
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse(401, "Invalid token"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"valid":   true,
		"user_id": userID,
	}))
}

// VerifyPassword 验证用户密码
func (h *AuthHandler) VerifyPassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse(401, "User not authenticated"))
		return
	}

	var req VerifyPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 查找用户
	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "User not found"))
		return
	}

	// 验证密码
	if user.Password == nil || !utils.CheckPasswordHash(req.Password, *user.Password) {
		c.JSON(http.StatusUnauthorized, utils.ErrorResponse(401, "Invalid password"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"valid": true,
	}))
}

// ChangePassword 修改密码
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 获取用户信息
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "User not found"))
		return
	}

	// 验证旧密码
	if user.Password == nil || !utils.CheckPasswordHash(req.OldPassword, *user.Password) {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "旧密码不正确"))
		return
	}

	// 加密新密码
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to hash password"))
		return
	}

	// 更新密码
	if err := h.db.Model(&user).Update("password", hashedPassword).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to update password"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"message": "密码修改成功",
	}))
}
