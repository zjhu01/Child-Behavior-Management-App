package handlers

import (
	"net/http"
	"strconv"

	"child-behavior-app/internal/models"
	"child-behavior-app/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	db *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{db: db}
}

// CreateChildRequest 创建儿童账户请求
type CreateChildRequest struct {
	Nickname string `json:"nickname" binding:"required"`
	Age      int    `json:"age"`
	Gender   string `json:"gender"`
	Avatar   string `json:"avatar"`
}

// CreateChild 创建儿童账户
func (h *UserHandler) CreateChild(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 只有家长可以创建儿童账户
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can create child accounts"))
		return
	}

	var req CreateChildRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	parentID := userID.(uint)

	// 创建儿童用户
	child := models.User{
		Nickname: req.Nickname,
		Age:      req.Age,
		Gender:   req.Gender,
		Avatar:   req.Avatar,
		Role:     "child",
		ParentID: &parentID,
		// 儿童账户不需要手机号和密码，由家长管理
		// Phone和Password字段不设置，让它们使用数据库默认值NULL
	}

	if err := h.db.Create(&child).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to create child account"))
		return
	}

	// 为儿童创建积分记录
	userPoints := models.UserPoints{
		UserID:          child.ID,
		TotalPoints:     0,
		AvailablePoints: 0,
	}
	h.db.Create(&userPoints)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"id":               child.ID,
		"nickname":         child.Nickname,
		"age":              child.Age,
		"gender":           child.Gender,
		"avatar":           child.Avatar,
		"role":             child.Role,
		"parent_id":        child.ParentID,
		"total_points":     0,
		"available_points": 0,
	}))
}

// GetChildren 获取儿童列表
func (h *UserHandler) GetChildren(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 只有家长可以获取儿童列表
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can access children list"))
		return
	}

	parentID := userID.(uint)

	// 查询儿童列表及其积分信息
	var children []models.User
	if err := h.db.Where("parent_id = ?", parentID).Find(&children).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get children list"))
		return
	}

	// 获取每个儿童的积分信息
	var result []gin.H
	for _, child := range children {
		var userPoints models.UserPoints
		h.db.Where("user_id = ?", child.ID).First(&userPoints)

		result = append(result, gin.H{
			"id":               child.ID,
			"nickname":         child.Nickname,
			"avatar":           child.Avatar,
			"role":             child.Role,
			"parent_id":        child.ParentID,
			"total_points":     userPoints.TotalPoints,
			"available_points": userPoints.AvailablePoints,
			"created_at":       child.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(result))
}

// GetUserProfile 获取用户信息
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "User not found"))
		return
	}

	// 获取积分信息
	var userPoints models.UserPoints
	h.db.Where("user_id = ?", userID).First(&userPoints)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"id":               user.ID,
		"phone":            utils.GetStringValue(user.Phone),
		"nickname":         user.Nickname,
		"avatar":           user.Avatar,
		"role":             user.Role,
		"parent_id":        user.ParentID,
		"total_points":     userPoints.TotalPoints,
		"available_points": userPoints.AvailablePoints,
		"created_at":       user.CreatedAt,
	}))
}

// UpdateUserProfile 更新用户信息
func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	type UpdateRequest struct {
		Nickname string `json:"nickname"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Avatar   string `json:"avatar"`
	}

	var req UpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 更新用户信息
	updates := make(map[string]interface{})
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to update user profile"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{"message": "Profile updated successfully"}))
}

// GetUserPoints 获取用户积分
func (h *UserHandler) GetUserPoints(c *gin.Context) {
	userIDParam := c.Param("user_id")
	currentUserID, _ := c.Get("user_id")
	currentUserRole, _ := c.Get("user_role")

	// 解析用户ID
	targetUserID, err := strconv.ParseUint(userIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid user ID"))
		return
	}

	// 权限检查：用户只能查看自己的积分，或家长查看自己孩子的积分
	if currentUserRole == "child" && uint(targetUserID) != currentUserID.(uint) {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Permission denied"))
		return
	}

	if currentUserRole == "parent" {
		// 检查是否是自己的孩子
		var targetUser models.User
		if err := h.db.First(&targetUser, targetUserID).Error; err != nil {
			c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "User not found"))
			return
		}

		if targetUser.ParentID == nil || *targetUser.ParentID != currentUserID.(uint) {
			c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Permission denied"))
			return
		}
	}

	// 获取积分信息
	var userPoints models.UserPoints
	if err := h.db.Where("user_id = ?", targetUserID).First(&userPoints).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "Points record not found"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"total_points":     userPoints.TotalPoints,
		"available_points": userPoints.AvailablePoints,
		"updated_at":       userPoints.UpdatedAt,
	}))
}

// UpdateChild 更新儿童信息
func (h *UserHandler) UpdateChild(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 只有家长可以更新儿童信息
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can update child information"))
		return
	}

	childIDParam := c.Param("child_id")
	childID, err := strconv.ParseUint(childIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid child ID"))
		return
	}

	parentID := userID.(uint)

	// 验证儿童是否属于当前家长
	var child models.User
	if err := h.db.Where("id = ? AND parent_id = ?", childID, parentID).First(&child).Error; err != nil {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Child not found or permission denied"))
		return
	}

	type UpdateChildRequest struct {
		Nickname string `json:"nickname"`
		Age      int    `json:"age"`
		Gender   string `json:"gender"`
		Avatar   string `json:"avatar"`
	}

	var req UpdateChildRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 更新儿童信息
	updates := make(map[string]any)
	if req.Nickname != "" {
		updates["nickname"] = req.Nickname
	}
	if req.Age > 0 {
		updates["age"] = req.Age
	}
	if req.Gender != "" {
		updates["gender"] = req.Gender
	}
	if req.Avatar != "" {
		updates["avatar"] = req.Avatar
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", childID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to update child information"))
		return
	}

	// 获取更新后的儿童信息
	h.db.First(&child, childID)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"id":        child.ID,
		"nickname":  child.Nickname,
		"age":       child.Age,
		"gender":    child.Gender,
		"avatar":    child.Avatar,
		"role":      child.Role,
		"parent_id": child.ParentID,
	}))
}

// DeleteChild 删除儿童账户
func (h *UserHandler) DeleteChild(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 只有家长可以删除儿童账户
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can delete child accounts"))
		return
	}

	childIDParam := c.Param("child_id")
	childID, err := strconv.ParseUint(childIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid child ID"))
		return
	}

	parentID := userID.(uint)

	// 验证儿童是否属于当前家长
	var child models.User
	if err := h.db.Where("id = ? AND parent_id = ?", childID, parentID).First(&child).Error; err != nil {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Child not found or permission denied"))
		return
	}

	// 删除相关数据（级联删除）
	// 删除积分记录
	h.db.Where("user_id = ?", childID).Delete(&models.UserPoints{})
	// 删除行为记录
	h.db.Where("child_id = ?", childID).Delete(&models.BehaviorRecord{})
	// 删除兑换记录
	h.db.Where("user_id = ?", childID).Delete(&models.ExchangeRecord{})
	// 删除用户记录
	h.db.Delete(&child)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"message": "Child account deleted successfully",
	}))
}
