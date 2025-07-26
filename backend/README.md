# 儿童行为管理系统后端 API

这是一个基于 Go 语言开发的儿童行为管理系统后端 API，使用 Gin 框架构建，支持家长和儿童的双模式管理。

## 功能特性

- 🔐 JWT 身份认证
- 👨‍👩‍👧‍👦 家长和儿童双角色管理
- 📊 行为记录和积分系统
- 🎁 奖励管理和兑换
- 📈 数据统计和趋势分析
- 📁 文件上传（头像、图片）
- 🔒 安全的密码加密
- 📝 完整的 API 文档

## 技术栈

- **框架**: Gin (Go Web Framework)
- **数据库**: MariaDB 8.0+
- **ORM**: GORM
- **认证**: JWT (JSON Web Tokens)
- **配置管理**: Viper
- **密码加密**: bcrypt
- **CORS**: gin-contrib/cors

## 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 应用程序入口
├── internal/
│   ├── api/
│   │   ├── handlers/            # API 处理器
│   │   │   ├── auth.go         # 认证相关
│   │   │   ├── user.go         # 用户管理
│   │   │   ├── behavior.go     # 行为管理
│   │   │   ├── reward.go       # 奖励管理
│   │   │   └── upload.go       # 文件上传
│   │   ├── middleware/          # 中间件
│   │   │   └── auth.go         # 认证中间件
│   │   └── routes/             # 路由配置
│   │       └── routes.go
│   ├── models/                 # 数据模型
│   │   └── models.go
│   └── utils/                  # 工具函数
│       ├── utils.go
│       └── config.go
├── configs/
│   └── config.yaml             # 配置文件
├── migrations/
│   └── 001_create_tables.sql   # 数据库迁移
├── uploads/                    # 文件上传目录
├── go.mod
├── go.sum
└── README.md
```

## 快速开始

### 1. 环境要求

- Go 1.19+
- MariaDB 10.3+
- Git

### 2. 安装依赖

```bash
cd backend
go mod tidy
```

### 3. 数据库设置

请参考详细的 [MariaDB 配置指南](docs/mariadb-setup.md) 来设置数据库。

快速设置：

1. 安装并启动 MariaDB
2. 创建数据库：
```sql
CREATE DATABASE child_behavior_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 修改配置文件 `configs/config.yaml`：
```yaml
database:
  host: "localhost"
  port: 3306
  username: "root"
  password: "your_password"
  dbname: "child_behavior_db"
```

> **重要**: 如果遇到 `auth_gssapi_client` 认证插件错误，请查看 [MariaDB 故障排除指南](docs/mariadb-troubleshooting.md) 获取详细的解决方案。

> **注意**: 如果遇到其他认证问题，请查看 [MariaDB 配置指南](docs/mariadb-setup.md) 中的解决方案。

### 4. 环境变量（可选）

你也可以通过环境变量来配置敏感信息：

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=your_username
export DB_PASSWORD=your_password
export DB_NAME=child_behavior_db
export JWT_SECRET=your-jwt-secret-key
export PORT=8080
```

### 5. 运行应用

```bash
go run cmd/server/main.go
```

应用将在 `http://localhost:8080` 启动。

### 6. 数据库迁移

应用启动时会自动执行数据库迁移，创建所需的表结构。如果需要手动执行 SQL 迁移文件：

```bash
mysql -u your_username -p child_behavior_db < migrations/001_create_tables.sql
```

## API 文档

### 基础信息

- **Base URL**: `http://localhost:8080/api/v1`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

### 认证接口

#### 用户注册
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "password123",
  "nickname": "张妈妈",
  "role": "parent"
}
```

#### 用户登录
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "phone": "13800138000",
  "password": "password123"
}
```

### 用户管理

#### 获取用户信息
```http
GET /api/v1/users/profile
Authorization: Bearer <token>
```

#### 创建儿童账户（仅家长）
```http
POST /api/v1/children
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "小明",
  "avatar": "/uploads/avatars/avatar.jpg"
}
```

#### 获取儿童列表（仅家长）
```http
GET /api/v1/children
Authorization: Bearer <token>
```

### 行为管理

#### 记录行为（仅家长）
```http
POST /api/v1/behaviors
Authorization: Bearer <token>
Content-Type: application/json

{
  "child_id": 2,
  "behavior_type": "good",
  "description": "主动完成作业",
  "points": 20
}
```

#### 获取行为记录
```http
GET /api/v1/behaviors?child_id=2&behavior_type=good&page=1&limit=20
Authorization: Bearer <token>
```

#### 获取行为趋势
```http
GET /api/v1/behaviors/trend?child_id=2&days=7
Authorization: Bearer <token>
```

### 奖励管理

#### 创建奖励（仅家长）
```http
POST /api/v1/rewards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "小玩具",
  "description": "精美小玩具一个",
  "points": 50,
  "stock": 10
}
```

#### 获取奖励列表
```http
GET /api/v1/rewards?page=1&limit=20&is_active=true
Authorization: Bearer <token>
```

#### 兑换奖励
```http
POST /api/v1/rewards/exchange
Authorization: Bearer <token>
Content-Type: application/json

{
  "reward_id": 1,
  "child_id": 2
}
```

### 文件上传

#### 上传头像
```http
POST /api/v1/upload/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data

avatar: <file>
```

#### 上传文件
```http
POST /api/v1/upload/file
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
```

## 配置说明

### 配置文件结构

配置文件位于 `configs/config.yaml`，包含以下主要配置项：

- `app`: 应用基础配置
- `database`: 数据库连接配置
- `jwt`: JWT 认证配置
- `upload`: 文件上传配置
- `cors`: 跨域配置
- `log`: 日志配置
- `security`: 安全配置

### 环境变量覆盖

敏感配置可以通过环境变量覆盖：

- `DB_HOST`: 数据库主机
- `DB_PORT`: 数据库端口
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称
- `JWT_SECRET`: JWT 密钥
- `PORT`: 应用端口

## 数据库设计

项目使用MariaDB数据库，包含以下主要表：

### 主要表结构

1. **users**: 用户表（家长和儿童）
2. **behavior_records**: 行为记录表
3. **user_points**: 用户积分表
4. **rewards**: 奖励表
5. **exchange_records**: 兑换记录表

### 关系说明

- 家长可以有多个儿童账户
- 儿童账户通过 `parent_id` 关联到家长
- 行为记录关联儿童和记录者（家长）
- 积分系统自动计算和更新
- 兑换记录追踪奖励使用情况

## 开发指南

### 添加新的 API 端点

1. 在 `internal/api/handlers/` 中创建处理器函数
2. 在 `internal/api/routes/routes.go` 中添加路由
3. 如需要，添加相应的中间件
4. 更新 API 文档

### 数据库迁移

1. 在 `migrations/` 目录下创建新的 SQL 文件
2. 按照命名规范：`002_description.sql`
3. 在应用启动时会自动执行迁移

### 测试

```bash
# 运行所有测试
go test ./...

# 运行特定包的测试
go test ./internal/api/handlers

# 运行测试并显示覆盖率
go test -cover ./...
```

## 部署

### 构建应用

```bash
# 构建 Linux 版本
GOOS=linux GOARCH=amd64 go build -o child-behavior-api cmd/server/main.go

# 构建 Windows 版本
GOOS=windows GOARCH=amd64 go build -o child-behavior-api.exe cmd/server/main.go
```

### 生产环境配置

1. 修改 `configs/config.yaml` 中的 `app.mode` 为 `release`
2. 设置强密码的 JWT 密钥
3. 配置生产数据库连接
4. 设置适当的 CORS 策略
5. 配置日志输出到文件

### 使用 systemd 管理服务

创建服务文件 `/etc/systemd/system/child-behavior-api.service`：

```ini
[Unit]
Description=Child Behavior Management API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/child-behavior-api
ExecStart=/opt/child-behavior-api/child-behavior-api
Restart=always
RestartSec=5
Environment=GIN_MODE=release

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable child-behavior-api
sudo systemctl start child-behavior-api
```

## 故障排除

### 常见问题

1. **MariaDB 认证问题**
   - **错误**: `unknown auth plugin: auth_gssapi_client`
   - **解决方案**: 查看 [MariaDB 故障排除指南](docs/mariadb-troubleshooting.md)
   - **快速修复**: 修改用户认证方式为 `mysql_native_password`
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
   FLUSH PRIVILEGES;
   ```

2. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接配置是否正确
   - 确认数据库用户权限
   - 检查防火墙设置

3. **JWT 认证失败**
   - 检查 JWT 密钥配置
   - 验证 token 是否过期
   - 确认请求头格式正确

4. **文件上传失败**
   - 检查上传目录权限
   - 验证文件大小限制
   - 确认文件类型是否允许

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看系统服务日志
sudo journalctl -u child-behavior-api -f
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 邮箱: your-email@example.com

## 更新日志

### v1.0.0 (2024-01-01)

- 初始版本发布
- 实现基础的用户认证功能
- 支持行为记录和积分管理
- 实现奖励系统和兑换功能
- 添加文件上传支持
- 完整的 API 文档