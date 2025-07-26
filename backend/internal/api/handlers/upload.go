package handlers

import (
	"crypto/md5"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"child-behavior-app/internal/utils"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	uploadDir string
}

func NewUploadHandler() *UploadHandler {
	uploadDir := "uploads"
	// 确保上传目录存在
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		fmt.Printf("Failed to create upload directory: %v\n", err)
	}
	return &UploadHandler{uploadDir: uploadDir}
}

// UploadFile 上传文件
func (h *UploadHandler) UploadFile(c *gin.Context) {
	// 获取上传的文件
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "No file uploaded"))
		return
	}
	defer file.Close()

	// 检查文件大小 (限制为5MB)
	const maxFileSize = 5 * 1024 * 1024
	if header.Size > maxFileSize {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "File size exceeds 5MB limit"))
		return
	}

	// 检查文件类型
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid file type. Only images are allowed"))
		return
	}

	// 生成唯一文件名
	ext := filepath.Ext(header.Filename)
	filename := h.generateUniqueFilename(header.Filename, ext)

	// 创建文件路径
	filePath := filepath.Join(h.uploadDir, filename)

	// 保存文件
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to save file"))
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to save file"))
		return
	}

	// 生成文件URL
	fileURL := fmt.Sprintf("/uploads/%s", filename)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"filename":     filename,
		"original_name": header.Filename,
		"size":         header.Size,
		"content_type": contentType,
		"url":          fileURL,
		"uploaded_at":  time.Now(),
	}))
}

// UploadAvatar 上传头像
func (h *UploadHandler) UploadAvatar(c *gin.Context) {
	// 获取上传的文件
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "No avatar file uploaded"))
		return
	}
	defer file.Close()

	// 检查文件大小 (限制为2MB)
	const maxAvatarSize = 2 * 1024 * 1024
	if header.Size > maxAvatarSize {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Avatar size exceeds 2MB limit"))
		return
	}

	// 检查文件类型
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}

	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		c.JSON(http.StatusBadRequest, utils.ErrorResponse(400, "Invalid avatar type. Only JPEG, PNG, and WebP are allowed"))
		return
	}

	// 创建头像目录
	avatarDir := filepath.Join(h.uploadDir, "avatars")
	if err := os.MkdirAll(avatarDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to create avatar directory"))
		return
	}

	// 生成唯一文件名
	ext := filepath.Ext(header.Filename)
	filename := h.generateUniqueFilename(header.Filename, ext)

	// 创建文件路径
	filePath := filepath.Join(avatarDir, filename)

	// 保存文件
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to save avatar"))
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, utils.ErrorResponse(500, "Failed to save avatar"))
		return
	}

	// 生成文件URL
	avatarURL := fmt.Sprintf("/uploads/avatars/%s", filename)

	c.JSON(http.StatusOK, utils.SuccessResponse(gin.H{
		"filename":     filename,
		"original_name": header.Filename,
		"size":         header.Size,
		"content_type": contentType,
		"url":          avatarURL,
		"uploaded_at":  time.Now(),
	}))
}

// generateUniqueFilename 生成唯一文件名
func (h *UploadHandler) generateUniqueFilename(originalName, ext string) string {
	// 使用时间戳和MD5哈希生成唯一文件名
	timestamp := time.Now().Unix()
	hash := md5.Sum([]byte(fmt.Sprintf("%s_%d", originalName, timestamp)))
	hashStr := fmt.Sprintf("%x", hash)

	// 取哈希的前12位
	uniqueID := hashStr[:12]

	// 清理扩展名
	ext = strings.ToLower(ext)
	if ext == "" {
		ext = ".jpg" // 默认扩展名
	}

	return fmt.Sprintf("%d_%s%s", timestamp, uniqueID, ext)
}

// ServeFile 提供文件服务
func (h *UploadHandler) ServeFile(c *gin.Context) {
	filename := c.Param("filename")
	filePath := filepath.Join(h.uploadDir, filename)

	// 检查文件是否存在
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "File not found"))
		return
	}

	// 设置适当的Content-Type
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		c.Header("Content-Type", "image/jpeg")
	case ".png":
		c.Header("Content-Type", "image/png")
	case ".gif":
		c.Header("Content-Type", "image/gif")
	case ".webp":
		c.Header("Content-Type", "image/webp")
	default:
		c.Header("Content-Type", "application/octet-stream")
	}

	// 设置缓存头
	c.Header("Cache-Control", "public, max-age=31536000") // 1年缓存

	// 提供文件
	c.File(filePath)
}

// ServeAvatar 提供头像文件服务
func (h *UploadHandler) ServeAvatar(c *gin.Context) {
	filename := c.Param("filename")
	avatarPath := filepath.Join(h.uploadDir, "avatars", filename)

	// 检查文件是否存在
	if _, err := os.Stat(avatarPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, utils.ErrorResponse(404, "Avatar not found"))
		return
	}

	// 设置适当的Content-Type
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		c.Header("Content-Type", "image/jpeg")
	case ".png":
		c.Header("Content-Type", "image/png")
	case ".webp":
		c.Header("Content-Type", "image/webp")
	default:
		c.Header("Content-Type", "application/octet-stream")
	}

	// 设置缓存头
	c.Header("Cache-Control", "public, max-age=31536000") // 1年缓存

	// 提供文件
	c.File(avatarPath)
}