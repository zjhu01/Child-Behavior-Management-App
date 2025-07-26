# MariaDB 连接问题解决指南

## 问题描述

当启动后端服务时，出现以下错误：
```
[mysql] auth.go:294: unknown auth plugin:auth_gssapi_client
this authentication plugin is not supported
```

## 问题原因

这个错误是由于 MariaDB 服务器配置了 `auth_gssapi_client` 认证插件，而 Go 的 MySQL 驱动不支持此插件导致的。

## 解决方案

### 方案一：修改 MariaDB 用户认证方式（推荐）

1. **连接到 MariaDB 服务器**：
   ```sql
   mysql -u root -p
   ```

2. **检查当前认证插件**：
   ```sql
   -- 查看当前用户的认证插件
   SELECT user, host, plugin FROM mysql.user WHERE user = 'root';
   ```

3. **创建数据库**：
   ```sql
   CREATE DATABASE IF NOT EXISTS child_behavior_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **修改用户认证方式**：
   ```sql
   -- 方法1：修改现有用户的认证插件
   ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
   
   -- 方法2：删除并重新创建用户
   DROP USER IF EXISTS 'root'@'localhost';
   CREATE USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
   
   -- 或者创建专用的应用用户
   CREATE USER 'child_app'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('your_password');
   
   -- 授予权限
   GRANT ALL PRIVILEGES ON child_behavior_db.* TO 'root'@'localhost';
   -- 或者
   GRANT ALL PRIVILEGES ON child_behavior_db.* TO 'child_app'@'localhost';
   
   -- 刷新权限
   FLUSH PRIVILEGES;
   
   -- 验证修改结果
   SELECT user, host, plugin FROM mysql.user WHERE user = 'root';
   ```

4. **更新应用配置**：
   如果创建了专用用户，请更新 `configs/config.yaml` 中的数据库配置：
   ```yaml
   database:
     username: "child_app"
     password: "your_password"
   ```

### 方案二：修改 MariaDB 服务器配置

1. **编辑 MariaDB 配置文件** (`my.cnf` 或 `my.ini`)：
   ```ini
   [mysqld]
   default-authentication-plugin=mysql_native_password
   ```

2. **重启 MariaDB 服务**：
   ```bash
   # Linux/macOS
   sudo systemctl restart mariadb
   
   # Windows
   net stop mariadb
   net start mariadb
   ```

### 方案三：检查MariaDB版本和配置

某些MariaDB版本可能默认启用了不兼容的认证插件：

```bash
# 检查MariaDB版本
mysql --version

# 或者在MariaDB中执行
SELECT VERSION();
```

如果使用的是MariaDB 10.4+，可能需要禁用某些认证插件：

```sql
-- 检查已安装的认证插件
SHOW PLUGINS WHERE Type = 'AUTHENTICATION';

-- 如果看到 auth_gssapi_client，可以尝试卸载它
UNINSTALL PLUGIN auth_gssapi_client;
```

### 方案四：使用环境变量配置

设置环境变量来覆盖默认配置：
```bash
# Windows PowerShell
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_USER="your_username"
$env:DB_PASSWORD="your_password"
$env:DB_NAME="child_behavior_db"

# Linux/macOS
export DB_HOST="localhost"
export DB_PORT="3306"
export DB_USER="your_username"
export DB_PASSWORD="your_password"
export DB_NAME="child_behavior_db"
```

## 临时解决方案：使用SQLite

如果MariaDB问题无法立即解决，可以临时切换到SQLite：

1. **安装SQLite驱动**：
```bash
go get gorm.io/driver/sqlite
```

2. **修改数据库初始化代码**（`internal/models/models.go`）：
```go
// 临时注释掉MariaDB代码，使用SQLite
// db, err := gorm.Open(mysql.Open(config.Database.GetDSN()), &gorm.Config{})
db, err := gorm.Open(sqlite.Open("child_behavior.db"), &gorm.Config{})
```

3. **重新启动服务**：
```bash
go run cmd/server/main.go
```

> **注意**：这只是临时解决方案，生产环境建议使用MariaDB。

## 验证连接

1. **测试数据库连接**：
   ```bash
   mysql -u root -p -h localhost -P 3306 child_behavior_db
   ```

2. **启动应用服务**：
   ```bash
   cd backend
   go run cmd/server/main.go
   ```

## 常见问题

### Q: 如何检查当前用户的认证插件？
A: 执行以下 SQL 查询：
```sql
SELECT user, host, plugin FROM mysql.user WHERE user = 'root';
```

### Q: 如何重置 root 用户密码？
A: 
```sql
-- 使用 mysql_native_password 插件
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
FLUSH PRIVILEGES;
```

### Q: 应用仍然无法连接怎么办？
A: 
1. 确认 MariaDB 服务正在运行
2. 检查防火墙设置
3. 验证数据库名称和用户权限
4. 查看 MariaDB 错误日志

## 安全建议

1. **生产环境**：
   - 使用强密码
   - 创建专用的应用用户而不是使用 root
   - 限制用户权限到最小必要范围
   - 启用 SSL/TLS 连接

2. **开发环境**：
   - 可以使用空密码的 root 用户
   - 确保数据库不暴露在公网

## 相关链接

- [MariaDB 认证插件文档](https://mariadb.com/kb/en/authentication-plugins/)
- [Go MySQL 驱动文档](https://github.com/go-sql-driver/mysql)
- [GORM MariaDB 配置](https://gorm.io/docs/connecting_to_the_database.html#MySQL)