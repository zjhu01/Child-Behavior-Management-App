package main

import (
	"fmt"
	"log"

	"child-behavior-app/internal/api/routes"
	"child-behavior-app/internal/models"
	"child-behavior-app/internal/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	appConfig, err := utils.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 初始化MariaDB数据库（使用配置文件）
	db := models.InitDB()
	models.AutoMigrate(db)

	// 初始化JWT
	if err := utils.InitJWT(); err != nil {
		log.Fatalf("Failed to initialize JWT: %v", err)
	}

	// 初始化缓存
	utils.InitCache()

	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)

	// 创建Gin引擎
	r := gin.Default()

	// 配置CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// 设置路由
	routes.SetupRoutes(r, db)

	// 启动服务器
	port := fmt.Sprintf(":%d", appConfig.App.Port)
	log.Printf("Server starting on %s", port)
	log.Fatal(r.Run(port))
}
