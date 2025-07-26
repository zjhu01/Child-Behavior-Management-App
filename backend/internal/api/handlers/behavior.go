package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"child-behavior-app/internal/models"
	"child-behavior-app/internal/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BehaviorHandler struct {
	db *gorm.DB
}

func NewBehaviorHandler(db *gorm.DB) *BehaviorHandler {
	return &BehaviorHandler{db: db}
}

// RecordBehaviorRequest 记录行为请求
type RecordBehaviorRequest struct {
	ChildID      uint   `json:"child_id" binding:"required"`
	BehaviorType string `json:"behavior_type" binding:"required"` // 前端发送的分类，如learning, life等
	BehaviorDesc string `json:"behavior_desc" binding:"required"`
	ScoreChange  int    `json:"score_change" binding:"required"`
	ImageURL     string `json:"image_url"`
}

// RecordBehavior 记录行为
func (h *BehaviorHandler) RecordBehavior(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 只有家长可以记录行为
	if userRole != "parent" {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Only parents can record behaviors"))
		return
	}

	var req RecordBehaviorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, err.Error()))
		return
	}

	parentID := userID.(uint)

	// 验证儿童是否属于当前家长
	var child models.User
	if err := h.db.Where("id = ? AND parent_id = ?", req.ChildID, parentID).First(&child).Error; err != nil {
		c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Child not found or permission denied"))
		return
	}

	// 根据积分正负确定行为类型
	var behaviorType string
	if req.ScoreChange > 0 {
		behaviorType = "good"
	} else {
		behaviorType = "bad"
	}

	// 创建行为记录
	behaviorRecord := models.BehaviorRecord{
		ChildID:      req.ChildID,
		RecorderID:   parentID,
		BehaviorType: behaviorType,
		BehaviorDesc: req.BehaviorDesc,
		ScoreChange:  req.ScoreChange,
		ImageURL:     req.ImageURL,
		RecordedAt:   time.Now(),
	}

	if err := h.db.Create(&behaviorRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to record behavior"))
		return
	}

	// 更新用户积分
	var userPoints models.UserPoints
	if err := h.db.Where("user_id = ?", req.ChildID).First(&userPoints).Error; err != nil {
		// 如果积分记录不存在，创建一个
		userPoints = models.UserPoints{
			UserID:          req.ChildID,
			TotalPoints:     0,
			AvailablePoints: 0,
		}
		h.db.Create(&userPoints)
	}

	// 根据行为类型更新积分
	if behaviorType == "good" {
		userPoints.TotalPoints += req.ScoreChange
		userPoints.AvailablePoints += req.ScoreChange
	} else {
		// 不良行为扣除积分（ScoreChange应该是负数）
		userPoints.TotalPoints += req.ScoreChange // 总积分记录所有变化
		userPoints.AvailablePoints += req.ScoreChange
		if userPoints.AvailablePoints < 0 {
			userPoints.AvailablePoints = 0
		}
	}

	h.db.Save(&userPoints)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"id":            behaviorRecord.ID,
		"child_id":      behaviorRecord.ChildID,
		"recorder_id":   behaviorRecord.RecorderID,
		"behavior_type": behaviorRecord.BehaviorType,
		"behavior_desc": behaviorRecord.BehaviorDesc,
		"score_change":  behaviorRecord.ScoreChange,
		"image_url":     behaviorRecord.ImageURL,
		"recorded_at":   behaviorRecord.RecordedAt,
	}))
}

// GetBehaviors 获取行为记录
func (h *BehaviorHandler) GetBehaviors(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	// 获取查询参数
	childIDParam := c.Query("child_id")
	behaviorType := c.Query("behavior_type")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "20")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	offset := (page - 1) * limit

	// 构建查询条件
	query := h.db.Model(&models.BehaviorRecord{})

	if userRole == "parent" {
		// 家长可以查看自己孩子的行为记录
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
			// 查询所有孩子的行为记录
			var childIDs []uint
			if err := h.db.Model(&models.User{}).Where("parent_id = ?", parentID).Pluck("id", &childIDs).Error; err != nil {
				fmt.Printf("Error getting child IDs: %v\n", err)
				c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get children list"))
				return
			}

			// 如果家长没有儿童，返回空结果
			if len(childIDs) == 0 {
				c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
					"behaviors": []gin.H{},
					"pagination": gin.H{
						"page":  page,
						"limit": limit,
						"total": 0,
					},
				}))
				return
			}

			query = query.Where("user_id IN ?", childIDs)
		}
	} else {
		// 儿童只能查看自己的行为记录
		query = query.Where("user_id = ?", userID)
	}

	// 添加其他过滤条件
	if behaviorType != "" {
		query = query.Where("behavior_type = ?", behaviorType)
	}

	if startDate != "" {
		if start, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("recorded_at >= ?", start)
		}
	}

	if endDate != "" {
		if end, err := time.Parse("2006-01-02", endDate); err == nil {
			query = query.Where("recorded_at <= ?", end.Add(24*time.Hour))
		}
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		fmt.Printf("Error counting behavior records: %v\n", err)
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to count behavior records"))
		return
	}

	// 获取行为记录
	var behaviors []models.BehaviorRecord
	if err := query.Order("recorded_at DESC").Offset(offset).Limit(limit).Find(&behaviors).Error; err != nil {
		fmt.Printf("Error getting behavior records: %v\n", err)
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get behavior records"))
		return
	}

	// 如果没有行为记录，直接返回空结果
	if len(behaviors) == 0 {
		c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
			"behaviors": []gin.H{},
			"pagination": gin.H{
				"page":  page,
				"limit": limit,
				"total": total,
			},
		}))
		return
	}

	// 批量获取用户信息以提高性能
	var userIDs []uint
	var recorderIDs []uint
	for _, behavior := range behaviors {
		userIDs = append(userIDs, behavior.ChildID)
		recorderIDs = append(recorderIDs, behavior.RecorderID)
	}

	// 去重
	userIDMap := make(map[uint]bool)
	var allUserIDs []uint
	for _, id := range userIDs {
		if !userIDMap[id] {
			userIDMap[id] = true
			allUserIDs = append(allUserIDs, id)
		}
	}
	for _, id := range recorderIDs {
		if !userIDMap[id] {
			userIDMap[id] = true
			allUserIDs = append(allUserIDs, id)
		}
	}

	// 批量查询用户信息
	var users []models.User
	if err := h.db.Where("id IN ?", allUserIDs).Find(&users).Error; err != nil {
		fmt.Printf("Error getting user information: %v\n", err)
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get user information"))
		return
	}

	// 创建用户信息映射
	userMap := make(map[uint]models.User)
	for _, user := range users {
		userMap[user.ID] = user
	}

	// 构建结果
	var result []gin.H
	for _, behavior := range behaviors {
		childName := "未知用户"
		recorderName := "未知用户"

		if user, exists := userMap[behavior.ChildID]; exists {
			childName = user.Nickname
		}
		if recorder, exists := userMap[behavior.RecorderID]; exists {
			recorderName = recorder.Nickname
		}

		result = append(result, gin.H{
			"id":            behavior.ID,
			"child_id":      behavior.ChildID,
			"child_name":    childName,
			"recorder_id":   behavior.RecorderID,
			"recorder_name": recorderName,
			"behavior_type": behavior.BehaviorType,
			"behavior_desc": behavior.BehaviorDesc,
			"score_change":  behavior.ScoreChange,
			"image_url":     behavior.ImageURL,
			"recorded_at":   behavior.RecordedAt,
		})
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"behaviors": result,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	}))
}

// GetBehaviorTrend 获取行为趋势统计
func (h *BehaviorHandler) GetBehaviorTrend(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	childIDParam := c.Query("child_id")
	days := c.DefaultQuery("days", "7")

	daysInt, _ := strconv.Atoi(days)
	startDate := time.Now().AddDate(0, 0, -daysInt)

	// 构建查询条件
	query := h.db.Model(&models.BehaviorRecord{}).Where("recorded_at >= ?", startDate)

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
			// 查询所有孩子的行为记录
			var childIDs []uint
			if err := h.db.Model(&models.User{}).Where("parent_id = ?", parentID).Pluck("id", &childIDs).Error; err != nil {
				fmt.Printf("Error getting child IDs for trend: %v\n", err)
				c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get children list"))
				return
			}

			// 如果家长没有儿童，返回空趋势数据
			if len(childIDs) == 0 {
				var emptyTrendData []gin.H
				for i := 0; i < daysInt; i++ {
					date := time.Now().AddDate(0, 0, -i)
					dateStr := date.Format("2006-01-02")
					emptyTrendData = append([]gin.H{{
						"date":       dateStr,
						"good_count": 0,
						"bad_count":  0,
					}}, emptyTrendData...)
				}
				c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
					"trend_data": emptyTrendData,
					"period":     fmt.Sprintf("%d days", daysInt),
				}))
				return
			}

			query = query.Where("user_id IN ?", childIDs)
		}
	} else {
		// 儿童只能查看自己的行为记录
		query = query.Where("user_id = ?", userID)
	}

	// 统计好行为和坏行为的数量
	type TrendData struct {
		Date      string `json:"date"`
		GoodCount int    `json:"good_count"`
		BadCount  int    `json:"bad_count"`
	}

	var trendData []TrendData
	for i := 0; i < daysInt; i++ {
		date := time.Now().AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")

		var goodCount int64
		var badCount int64

		query.Where("DATE(recorded_at) = ? AND behavior_type = ?", dateStr, "good").Count(&goodCount)
		query.Where("DATE(recorded_at) = ? AND behavior_type = ?", dateStr, "bad").Count(&badCount)

		trendData = append([]TrendData{{
			Date:      dateStr,
			GoodCount: int(goodCount),
			BadCount:  int(badCount),
		}}, trendData...)
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"trend_data": trendData,
		"period":     fmt.Sprintf("%d days", daysInt),
	}))
}
