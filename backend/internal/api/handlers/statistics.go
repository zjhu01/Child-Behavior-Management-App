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

type StatisticsHandler struct {
	db *gorm.DB
}

func NewStatisticsHandler(db *gorm.DB) *StatisticsHandler {
	return &StatisticsHandler{db: db}
}

// GetStatistics 获取统计数据
func (h *StatisticsHandler) GetStatistics(c *gin.Context) {
	userID, _ := c.Get("user_id")
	userRole, _ := c.Get("user_role")

	period := c.DefaultQuery("period", "week")
	childIDParam := c.Query("child_id")

	// 计算时间范围
	var startDate time.Time
	switch period {
	case "week":
		startDate = time.Now().AddDate(0, 0, -7)
	case "month":
		startDate = time.Now().AddDate(0, -1, 0)
	case "quarter":
		startDate = time.Now().AddDate(0, -3, 0)
	case "year":
		startDate = time.Now().AddDate(-1, 0, 0)
	default:
		startDate = time.Now().AddDate(0, 0, -7)
	}

	// 构建查询条件
	query := h.db.Model(&models.BehaviorRecord{}).Where("recorded_at >= ?", startDate)

	// 权限检查和过滤
	var childIDs []uint
	if userRole == "parent" {
		// 获取家长的所有儿童
		var children []models.User
		if err := h.db.Where("parent_id = ?", userID).Find(&children).Error; err != nil {
			c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to get children"))
			return
		}

		for _, child := range children {
			childIDs = append(childIDs, child.ID)
		}

		if len(childIDs) == 0 {
			// 家长没有儿童，返回空数据
			h.returnEmptyStatistics(c, period)
			return
		}

		// 如果指定了特定儿童
		if childIDParam != "" {
			childID, err := strconv.ParseUint(childIDParam, 10, 32)
			if err != nil {
				c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid child ID"))
				return
			}

			// 验证儿童是否属于当前家长
			found := false
			for _, id := range childIDs {
				if id == uint(childID) {
					found = true
					break
				}
			}
			if !found {
				c.JSON(http.StatusForbidden, utils.ErrorResponse(403, "Child not found or permission denied"))
				return
			}

			childIDs = []uint{uint(childID)}
		}

		query = query.Where("user_id IN ?", childIDs)
	} else {
		// 儿童只能查看自己的数据
		childIDs = []uint{userID.(uint)}
		query = query.Where("user_id = ?", userID)
	}

	// 获取每日统计数据
	dailyStats := h.getDailyStats(query, startDate, period)

	// 获取分类统计数据
	categoryStats := h.getCategoryStats(query)

	// 获取儿童统计数据
	childrenStats := h.getChildrenStats(childIDs, startDate)

	// 获取总体统计数据
	overallStats := h.getOverallStats(query, childIDs)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"daily_stats":    dailyStats,
		"category_stats": categoryStats,
		"children_stats": childrenStats,
		"overall_stats":  overallStats,
	}))
}

// returnEmptyStatistics 返回空统计数据
func (h *StatisticsHandler) returnEmptyStatistics(c *gin.Context, period string) {
	var days int
	switch period {
	case "week":
		days = 7
	case "month":
		days = 30
	case "quarter":
		days = 90
	case "year":
		days = 365
	default:
		days = 7
	}

	var emptyDailyStats []gin.H
	for i := 0; i < days; i++ {
		date := time.Now().AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")
		emptyDailyStats = append([]gin.H{{
			"date":               dateStr,
			"positive_behaviors": 0,
			"negative_behaviors": 0,
			"total_points":       0,
		}}, emptyDailyStats...)
	}

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"daily_stats":    emptyDailyStats,
		"category_stats": []gin.H{},
		"children_stats": []gin.H{},
		"overall_stats": gin.H{
			"total_behaviors": 0,
			"positive_rate":   0,
			"total_points":    0,
			"active_children": 0,
		},
	}))
}

// getDailyStats 获取每日统计数据
func (h *StatisticsHandler) getDailyStats(baseQuery *gorm.DB, startDate time.Time, period string) []gin.H {
	var days int
	switch period {
	case "week":
		days = 7
	case "month":
		days = 30
	case "quarter":
		days = 90
	case "year":
		days = 365
	default:
		days = 7
	}

	var dailyStats []gin.H
	for i := 0; i < days; i++ {
		date := time.Now().AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")

		var positiveCount int64
		var negativeCount int64
		var totalPoints int64

		// 创建当日查询条件，继承基础查询的条件
		dayQuery := h.db.Model(&models.BehaviorRecord{}).Where("DATE(recorded_at) = ?", dateStr)

		// 如果有用户过滤条件，需要添加
		if baseQuery != nil {
			// 获取基础查询的用户ID条件
			var userIDs []uint
			var tempBehaviors []models.BehaviorRecord
			baseQuery.Select("DISTINCT user_id").Find(&tempBehaviors)
			for _, b := range tempBehaviors {
				userIDs = append(userIDs, b.ChildID)
			}
			if len(userIDs) > 0 {
				dayQuery = dayQuery.Where("user_id IN ?", userIDs)
			}
		}

		// 统计积极行为数量
		dayQuery.Where("behavior_type = ?", "good").Count(&positiveCount)

		// 统计消极行为数量
		dayQuery.Where("behavior_type = ?", "bad").Count(&negativeCount)

		// 统计总积分变化
		var behaviors []models.BehaviorRecord
		dayQuery.Find(&behaviors)
		for _, behavior := range behaviors {
			totalPoints += int64(behavior.ScoreChange)
		}

		dailyStats = append([]gin.H{{
			"date":               dateStr,
			"positive_behaviors": int(positiveCount),
			"negative_behaviors": int(negativeCount),
			"total_points":       int(totalPoints),
		}}, dailyStats...)
	}

	return dailyStats
}

// getCategoryStats 获取分类统计数据
func (h *StatisticsHandler) getCategoryStats(baseQuery *gorm.DB) []gin.H {
	// 行为分类映射
	categoryMap := map[string]string{
		"learning": "学习",
		"life":     "生活",
		"social":   "社交",
		"emotion":  "情感",
		"exercise": "运动",
		"eating":   "饮食",
	}

	categoryColors := map[string]string{
		"learning": "#3B82F6",
		"life":     "#10B981",
		"social":   "#8B5CF6",
		"emotion":  "#EC4899",
		"exercise": "#F59E0B",
		"eating":   "#EF4444",
	}

	var categoryStats []gin.H

	// 获取基础查询的用户ID条件
	var userIDs []uint
	if baseQuery != nil {
		var tempBehaviors []models.BehaviorRecord
		baseQuery.Select("DISTINCT user_id").Find(&tempBehaviors)
		for _, b := range tempBehaviors {
			userIDs = append(userIDs, b.ChildID)
		}
	}

	// 由于当前数据库中没有存储行为分类，我们暂时基于行为描述进行简单分类
	// 这里可以根据实际需求进行更复杂的分类逻辑
	for category, name := range categoryMap {
		var behaviors []models.BehaviorRecord
		var count int64
		var totalPoints int64

		// 创建分类查询
		categoryQuery := h.db.Model(&models.BehaviorRecord{})

		// 添加用户过滤条件
		if len(userIDs) > 0 {
			categoryQuery = categoryQuery.Where("user_id IN ?", userIDs)
		}

		// 简单的关键词匹配分类（实际项目中应该有更好的分类方法）
		switch category {
		case "learning":
			categoryQuery.Where("behavior_desc LIKE ? OR behavior_desc LIKE ? OR behavior_desc LIKE ?",
				"%学习%", "%作业%", "%读书%").Find(&behaviors)
		case "life":
			categoryQuery.Where("behavior_desc LIKE ? OR behavior_desc LIKE ? OR behavior_desc LIKE ?",
				"%整理%", "%卫生%", "%生活%").Find(&behaviors)
		case "social":
			categoryQuery.Where("behavior_desc LIKE ? OR behavior_desc LIKE ? OR behavior_desc LIKE ?",
				"%朋友%", "%分享%", "%合作%").Find(&behaviors)
		case "emotion":
			categoryQuery.Where("behavior_desc LIKE ? OR behavior_desc LIKE ? OR behavior_desc LIKE ?",
				"%情绪%", "%开心%", "%生气%").Find(&behaviors)
		case "exercise":
			categoryQuery.Where("behavior_desc LIKE ? OR behavior_desc LIKE ? OR behavior_desc LIKE ?",
				"%运动%", "%跑步%", "%锻炼%").Find(&behaviors)
		case "eating":
			categoryQuery.Where("behavior_desc LIKE ? OR behavior_desc LIKE ? OR behavior_desc LIKE ?",
				"%吃饭%", "%饮食%", "%挑食%").Find(&behaviors)
		}

		count = int64(len(behaviors))
		for _, behavior := range behaviors {
			totalPoints += int64(behavior.ScoreChange)
		}

		if count > 0 {
			categoryStats = append(categoryStats, gin.H{
				"category": name,
				"count":    int(count),
				"points":   int(totalPoints),
				"color":    categoryColors[category],
			})
		}
	}

	return categoryStats
}

// getChildrenStats 获取儿童统计数据
func (h *StatisticsHandler) getChildrenStats(childIDs []uint, startDate time.Time) []gin.H {
	var childrenStats []gin.H

	for _, childID := range childIDs {
		// 获取儿童信息
		var child models.User
		if err := h.db.First(&child, childID).Error; err != nil {
			continue
		}

		// 获取儿童积分信息
		var userPoints models.UserPoints
		h.db.Where("user_id = ?", childID).First(&userPoints)

		// 统计行为数据
		var totalBehaviors int64
		var positiveBehaviors int64
		h.db.Model(&models.BehaviorRecord{}).Where("user_id = ? AND recorded_at >= ?", childID, startDate).Count(&totalBehaviors)
		h.db.Model(&models.BehaviorRecord{}).Where("user_id = ? AND recorded_at >= ? AND behavior_type = ?", childID, startDate, "good").Count(&positiveBehaviors)

		// 计算积极率
		var positiveRate float64
		if totalBehaviors > 0 {
			positiveRate = float64(positiveBehaviors) / float64(totalBehaviors) * 100
		}

		// 计算等级（基于总积分）
		level := 1
		if userPoints.TotalPoints >= 500 {
			level = 5
		} else if userPoints.TotalPoints >= 300 {
			level = 4
		} else if userPoints.TotalPoints >= 150 {
			level = 3
		} else if userPoints.TotalPoints >= 50 {
			level = 2
		}

		childrenStats = append(childrenStats, gin.H{
			"child_id":        childID,
			"child_name":      child.Nickname,
			"total_behaviors": int(totalBehaviors),
			"positive_rate":   int(positiveRate),
			"total_points":    userPoints.TotalPoints,
			"level":           level,
		})
	}

	return childrenStats
}

// getOverallStats 获取总体统计数据
func (h *StatisticsHandler) getOverallStats(query *gorm.DB, childIDs []uint) gin.H {
	var totalBehaviors int64
	var positiveBehaviors int64
	var totalPoints int64

	// 统计总行为数量
	query.Count(&totalBehaviors)

	// 统计积极行为数量 - 需要使用相同的过滤条件
	positiveQuery := h.db.Model(&models.BehaviorRecord{}).Where("behavior_type = ?", "good")
	if len(childIDs) > 0 {
		positiveQuery = positiveQuery.Where("user_id IN ?", childIDs)
	}
	positiveQuery.Count(&positiveBehaviors)

	// 计算积极率
	var positiveRate float64
	if totalBehaviors > 0 {
		positiveRate = float64(positiveBehaviors) / float64(totalBehaviors) * 100
	}

	// 统计总积分
	var behaviors []models.BehaviorRecord
	query.Find(&behaviors)
	for _, behavior := range behaviors {
		totalPoints += int64(behavior.ScoreChange)
	}

	return gin.H{
		"total_behaviors": int(totalBehaviors),
		"positive_rate":   int(positiveRate),
		"total_points":    int(totalPoints),
		"active_children": len(childIDs),
	}
}
