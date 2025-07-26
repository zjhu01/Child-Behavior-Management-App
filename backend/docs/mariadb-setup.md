# MariaDB 配置指南

本项目使用 MariaDB 作为数据库。以下是配置 MariaDB 的详细步骤。

## 安装 MariaDB

### Windows
1. 下载 MariaDB 安装包：https://mariadb.org/download/
2. 运行安装程序，按照向导完成安装
3. 在安装过程中设置 root 用户密码

### macOS
```bash
brew install mariadb
brew services start mariadb
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mariadb-server
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

## 配置数据库

### 1. 登录 MariaDB
```bash
mysql -u root -p
```

### 2. 创建数据库
```sql
CREATE DATABASE child_behavior_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 创建用户（可选）
```sql
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON child_behavior_db.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 解决认证插件问题
如果遇到 "unknown auth plugin" 错误，执行以下命令：

```sql
-- 对于 root 用户
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('your_password');

-- 对于自定义用户
ALTER USER 'app_user'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('your_password');

FLUSH PRIVILEGES;
```

## 配置应用

修改 `configs/config.yaml` 文件中的数据库配置：

```yaml
database:
  host: "localhost"
  port: 3306
  username: "root"  # 或者你创建的用户名
  password: "your_password"
  dbname: "child_behavior_db"
  charset: "utf8mb4"
  parse_time: true
  loc: "Local"
```

## 测试连接

启动应用程序：
```bash
go run cmd/server/main.go
```

如果看到 "Successfully connected to MariaDB database" 消息，说明连接成功。

## 常见问题

### 1. 连接被拒绝
- 确保 MariaDB 服务正在运行
- 检查端口 3306 是否被占用
- 验证用户名和密码是否正确

### 2. 认证插件错误
- 使用上述 SQL 命令切换到 mysql_native_password 认证方式

### 3. 数据库不存在
- 确保已创建 child_behavior_db 数据库

### 4. 权限问题
- 确保用户有足够的权限访问数据库
- 使用 GRANT 命令授予必要的权限

## 生产环境建议

1. 创建专用的数据库用户，不要使用 root 用户
2. 设置强密码
3. 限制用户权限，只授予必要的权限
4. 定期备份数据库
5. 启用 SSL 连接（如果需要）

## 备份和恢复

### 备份
```bash
mysqldump -u root -p child_behavior_db > backup.sql
```

### 恢复
```bash
mysql -u root -p child_behavior_db < backup.sql
```