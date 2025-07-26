package routes

import (
	"child-behavior-app/internal/api/handlers"
	"child-behavior-app/internal/api/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes 设置所有路由
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// 创建处理器实例
	authHandler := handlers.NewAuthHandler(db)
	userHandler := handlers.NewUserHandler(db)
	behaviorHandler := handlers.NewBehaviorHandler(db)
	rewardHandler := handlers.NewRewardHandler(db)
	statisticsHandler := handlers.NewStatisticsHandler(db)
	uploadHandler := handlers.NewUploadHandler()

	// 添加全局中间件
	r.Use(middleware.LoggerMiddleware())

	// API版本分组
	v1 := r.Group("/api")

	// 公开路由（不需要认证）
	public := v1.Group("/")
	{
		// 认证相关
		auth := public.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
		}

		// 文件服务
		public.GET("/uploads/:filename", uploadHandler.ServeFile)
		public.GET("/uploads/avatars/:filename", uploadHandler.ServeAvatar)
	}

	// 需要认证的路由
	protected := v1.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// 认证验证
		protected.GET("/auth/verify", authHandler.VerifyToken)
		protected.POST("/auth/verify-password", authHandler.VerifyPassword)
		protected.PUT("/auth/password", authHandler.ChangePassword)
		// 用户相关
		users := protected.Group("/users")
		{
			users.GET("/profile", userHandler.GetUserProfile)
			users.PUT("/profile", userHandler.UpdateUserProfile)
			users.GET("/:user_id/points", userHandler.GetUserPoints)
		}

		// 儿童管理（仅家长）
		children := protected.Group("/children")
		children.Use(middleware.RoleMiddleware("parent"))
		{
			children.POST("/", userHandler.CreateChild)
			children.GET("/", userHandler.GetChildren)
			children.PUT("/:child_id", userHandler.UpdateChild)
			children.DELETE("/:child_id", userHandler.DeleteChild)
		}

		// 行为管理
		behaviors := protected.Group("/behaviors")
		{
			behaviors.GET("/", behaviorHandler.GetBehaviors)
			behaviors.GET("/trend", behaviorHandler.GetBehaviorTrend)
			// 记录行为（仅家长）
			behaviors.POST("/", middleware.RoleMiddleware("parent"), behaviorHandler.RecordBehavior)
		}

		// 统计报告
		statistics := protected.Group("/statistics")
		{
			statistics.GET("/", statisticsHandler.GetStatistics)
		}

		// 奖励管理
		rewards := protected.Group("/rewards")
		{
			rewards.GET("/", rewardHandler.GetRewards)
			rewards.POST("/exchange", rewardHandler.ExchangeReward)
			rewards.GET("/exchanges", rewardHandler.GetExchangeRecords)
			// 创建和更新奖励（仅家长）
			rewards.POST("/", middleware.RoleMiddleware("parent"), rewardHandler.CreateReward)
			rewards.PUT("/:reward_id", middleware.RoleMiddleware("parent"), rewardHandler.UpdateReward)
			rewards.DELETE("/:reward_id", middleware.RoleMiddleware("parent"), rewardHandler.DeleteReward)
		}

		// 文件上传
		uploads := protected.Group("/upload")
		{
			uploads.POST("/file", uploadHandler.UploadFile)
			uploads.POST("/avatar", uploadHandler.UploadAvatar)
		}
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Child Behavior Management API is running",
		})
	})

	// API文档路由
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"name":        "Child Behavior Management API",
			"version":     "1.0.0",
			"description": "API for managing children's behavior and rewards",
			"endpoints": gin.H{
				"auth": gin.H{
					"register": "POST /api/auth/register",
					"login":    "POST /api/auth/login",
				},
				"users": gin.H{
					"profile": "GET/PUT /api/users/profile",
					"points":  "GET /api/users/:user_id/points",
				},
				"children": gin.H{
					"list":   "GET /api/children",
					"create": "POST /api/children",
					"update": "PUT /api/children/:child_id",
					"delete": "DELETE /api/children/:child_id",
				},
				"behaviors": gin.H{
					"list":   "GET /api/behaviors",
					"record": "POST /api/behaviors",
					"trend":  "GET /api/behaviors/trend",
				},
				"rewards": gin.H{
					"list":      "GET /api/rewards",
					"create":    "POST /api/rewards",
					"update":    "PUT /api/rewards/:reward_id",
					"exchange":  "POST /api/rewards/exchange",
					"exchanges": "GET /api/rewards/exchanges",
				},
				"upload": gin.H{
					"file":   "POST /api/upload/file",
					"avatar": "POST /api/upload/avatar",
				},
			},
		})
	})
}
