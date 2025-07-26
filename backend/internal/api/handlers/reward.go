package handlers

import (
	"net/http"
	"strconv"
	"time"

	"child-behavior-app/internal/models"
	"child-behavior-app/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RewardHandler struct {
	db *gorm.DB
}

func NewRewardHandler(db *gorm.DB) *RewardHandler {
	return &RewardHandler{db: db}
}

// CreateRewardRequest 创建奖励请求
type CreateRewardRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	PointsCost  int    `json:"points_cost" binding:"required,min=1"`
	Image       string `json:"image"`
	Stock       int    `json:"stock" binding:"required,min=0"`
}

// CreateReward 创建奖励
func (h *RewardHandler) CreateReward(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 只有家长可以创建奖励
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can create rewards"))
		return
	}

	var req CreateRewardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	parentID := userID.(uint)

	// 创建奖励
	reward := models.Reward{
		Name:        req.Name,
		Description: req.Description,
		Points:      req.PointsCost,
		Image:       req.Image,
		Stock:       req.Stock,
		CreatedBy:   parentID,
		IsActive:    true,
	}

	if err := h.db.Create(&reward).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to create reward"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"id":          reward.ID,
		"name":        reward.Name,
		"description": reward.Description,
		"points":      reward.Points,
		"image":       reward.Image,
		"stock":       reward.Stock,
		"is_active":   reward.IsActive,
		"created_by":  reward.CreatedBy,
		"created_at":  reward.CreatedAt,
	}))
}

// GetRewards 获取奖励列表
func (h *RewardHandler) GetRewards(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")
	isActiveStr := c.Query("is_active")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	offset := (page - 1) * limit

	// 构建查询条件
	query := h.db.Model(&models.Reward{})

	if userRole == "parent" {
		// 家长只能看到自己创建的奖励
		query = query.Where("created_by = ?", userID)
	} else {
		// 儿童可以看到家长创建的奖励
		var user models.User
		h.db.First(&user, userID)
		if user.ParentID != nil {
			query = query.Where("created_by = ?", *user.ParentID)
		}
	}

	// 添加活跃状态过滤
	if isActiveStr != "" {
		isActive := isActiveStr == "true"
		query = query.Where("is_active = ?", isActive)
	}

	// 获取总数
	var total int64
	query.Count(&total)

	// 获取奖励列表
	var rewards []models.Reward
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&rewards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get rewards"))
		return
	}

	// 构建返回数据
	var result []gin.H
	for _, reward := range rewards {
		result = append(result, gin.H{
			"id":          reward.ID,
			"name":        reward.Name,
			"description": reward.Description,
			"points":      reward.Points,
			"image":       reward.Image,
			"stock":       reward.Stock,
			"is_active":   reward.IsActive,
			"created_by":  reward.CreatedBy,
			"created_at":  reward.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"rewards": result,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	}))
}

// ExchangeRewardRequest 兑换奖励请求
type ExchangeRewardRequest struct {
	RewardID   uint `json:"reward_id" binding:"required"`
	PointsUsed int  `json:"points_used" binding:"required"`
	ChildID    uint `json:"child_id"` // 可选，家长为孩子兑换时需要
}

// ExchangeReward 兑换奖励
func (h *RewardHandler) ExchangeReward(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	var req ExchangeRewardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 确定兑换的用户ID
	var targetUserID uint
	if userRole == "parent" {
		// 家长为孩子兑换
		if req.ChildID == 0 {
			c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Child ID is required for parent"))
			return
		}
		// 验证儿童是否属于当前家长
		var child models.User
		if err := h.db.Where("id = ? AND parent_id = ?", req.ChildID, userID).First(&child).Error; err != nil {
			c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Child not found or permission denied"))
			return
		}
		targetUserID = req.ChildID
	} else {
		// 儿童为自己兑换
		targetUserID = userID.(uint)
	}

	// 获取奖励信息
	var reward models.Reward
	if err := h.db.First(&reward, req.RewardID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "Reward not found"))
		return
	}

	// 检查奖励是否可用
	if !reward.IsActive {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Reward is not active"))
		return
	}

	if reward.Stock <= 0 {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Reward is out of stock"))
		return
	}

	// 获取用户积分
	var userPoints models.UserPoints
	if err := h.db.Where("user_id = ?", targetUserID).First(&userPoints).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "User points not found"))
		return
	}

	// 检查积分是否足够
	if userPoints.AvailablePoints < reward.Points {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Insufficient points"))
		return
	}

	// 开始事务
	tx := h.db.Begin()

	// 扣除积分
	userPoints.AvailablePoints -= reward.Points
	if err := tx.Save(&userPoints).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to update points"))
		return
	}

	// 减少库存
	reward.Stock -= 1
	if err := tx.Save(&reward).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to update stock"))
		return
	}

	// 创建兑换记录
	exchangeRecord := models.ExchangeRecord{
		UserID:      targetUserID,
		RewardID:    req.RewardID,
		PointsUsed:  reward.Points,
		ExchangedAt: time.Now(),
		Status:      "completed",
	}

	if err := tx.Create(&exchangeRecord).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to create exchange record"))
		return
	}

	// 提交事务
	tx.Commit()

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"exchange_id":      exchangeRecord.ID,
		"reward_name":      reward.Name,
		"points":           exchangeRecord.PointsUsed,
		"remaining_points": userPoints.AvailablePoints,
		"exchanged_at":     exchangeRecord.ExchangedAt,
		"status":           exchangeRecord.Status,
	}))
}

// GetExchangeRecords 获取兑换记录
func (h *RewardHandler) GetExchangeRecords(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	childIDParam := c.Query("child_id")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	offset := (page - 1) * limit

	// 构建查询条件
	query := h.db.Model(&models.ExchangeRecord{}).Preload("Reward")

	if userRole == "parent" {
		parentID := userID.(uint)
		if childIDParam != "" {
			childID, err := strconv.ParseUint(childIDParam, 10, 32)
			if err != nil {
				c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid child ID"))
				return
			}
			// 验证儿童是否属于当前家长
			var child models.User
			if err := h.db.Where("id = ? AND parent_id = ?", childID, parentID).First(&child).Error; err != nil {
				c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Child not found or permission denied"))
				return
			}
			query = query.Where("user_id = ?", childID)
		} else {
			// 查询所有孩子的兑换记录
			var childIDs []uint
			h.db.Model(&models.User{}).Where("parent_id = ?", parentID).Pluck("id", &childIDs)
			query = query.Where("user_id IN ?", childIDs)
		}
	} else {
		// 儿童只能查看自己的兑换记录
		query = query.Where("user_id = ?", userID)
	}

	// 获取总数
	var total int64
	query.Count(&total)

	// 获取兑换记录
	var exchanges []models.ExchangeRecord
	if err := query.Order("exchanged_at DESC").Offset(offset).Limit(limit).Find(&exchanges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get exchange records"))
		return
	}

	// 构建返回数据
	var result []gin.H
	for _, exchange := range exchanges {
		var user models.User
		h.db.First(&user, exchange.UserID)

		result = append(result, gin.H{
			"id":           exchange.ID,
			"user_id":      exchange.UserID,
			"user_name":    user.Nickname,
			"reward_id":    exchange.RewardID,
			"reward_name":  exchange.Reward.Name,
			"points":       exchange.PointsUsed,
			"exchanged_at": exchange.ExchangedAt,
			"status":       exchange.Status,
		})
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"exchanges": result,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	}))
}

// UpdateReward 更新奖励信息
func (h *RewardHandler) UpdateReward(c *gin.Context) {
	userRole, _ := c.Get("user_role")

	// 只有家长可以更新奖励
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can update rewards"))
		return
	}

	rewardIDParam := c.Param("reward_id")
	rewardID, err := strconv.ParseUint(rewardIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid reward ID"))
		return
	}

	type UpdateRewardRequest struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Points      int    `json:"points"`
		Image       string `json:"image"`
		Stock       int    `json:"stock"`
		IsActive    *bool  `json:"is_active"`
	}

	var req UpdateRewardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	// 构建更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Points > 0 {
		updates["points"] = req.Points
	}
	if req.Image != "" {
		updates["image"] = req.Image
	}
	if req.Stock >= 0 {
		updates["stock"] = req.Stock
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if err := h.db.Model(&models.Reward{}).Where("id = ?", rewardID).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to update reward"))
		return
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{"message": "Reward updated successfully"}))
}

// DeleteReward 删除奖励
func (h *RewardHandler) DeleteReward(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 只有家长可以删除奖励
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can delete rewards"))
		return
	}

	rewardIDParam := c.Param("reward_id")
	rewardID, err := strconv.ParseUint(rewardIDParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid reward ID"))
		return
	}

	// 获取奖励信息并验证权限
	var reward models.Reward
	if err := h.db.First(&reward, rewardID).Error; err != nil {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "Reward not found"))
		return
	}

	// 验证奖励是否属于当前家长
	if reward.CreatedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Permission denied"))
		return
	}

	// 检查是否有相关的兑换记录
	var exchangeCount int64
	h.db.Model(&models.ExchangeRecord{}).Where("reward_id = ?", rewardID).Count(&exchangeCount)

	if exchangeCount > 0 {
		// 如果有兑换记录，只是将奖励设为不活跃，而不是物理删除
		if err := h.db.Model(&reward).Update("is_active", false).Error; err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to deactivate reward"))
			return
		}
		c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{"message": "Reward deactivated successfully"}))
	} else {
		// 如果没有兑换记录，可以物理删除
		if err := h.db.Delete(&reward).Error; err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to delete reward"))
			return
		}
		c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{"message": "Reward deleted successfully"}))
	}
}
