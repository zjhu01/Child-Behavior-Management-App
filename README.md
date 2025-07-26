# 儿童行为管理APP

一个基于React + TypeScript + Vite构建的儿童行为管理应用，支持Web端和移动端。

## 🚀 功能特性

- 📱 **跨平台支持** - Web端和移动端(Android/iOS)
- 👨‍👩‍👧‍👦 **多角色管理** - 家长端和儿童端
- 📊 **行为评分系统** - 记录和评估儿童行为
- 🎁 **奖励商店** - 积分兑换奖励机制
- 📈 **数据报告** - 可视化行为数据分析
- 🔐 **生物识别认证** - 安全的身份验证
- 🌙 **主题切换** - 支持明暗主题

## 🛠️ 技术栈

### 前端
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的JavaScript
- **Vite** - 快速构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **Zustand** - 轻量级状态管理
- **React Router** - 路由管理
- **Recharts** - 数据可视化
- **Capacitor** - 跨平台移动应用开发

### 后端
- **Go** - 后端服务语言
- **MariaDB** - 数据库

## 📦 安装和运行

### 前置要求
- Node.js 18+
- npm 或 yarn
- Go 1.19+ (后端开发)

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务器 (在backend目录下)
cd backend
go run main.go
```

### 构建生产版本
```bash
# 构建Web应用
npm run build

# 构建移动端应用
npm run build:mobile
```

## 📱 移动端开发

### Android
```bash
# 打开Android Studio
npm run android

# 或直接运行
npx cap run android
```

### iOS (仅限macOS)
```bash
# 添加iOS平台
npx cap add ios

# 打开Xcode
npm run ios
```

详细的移动端构建指南请参考 [MOBILE_BUILD_GUIDE.md](./MOBILE_BUILD_GUIDE.md)

## 📁 项目结构

```
├── src/
│   ├── components/     # 可复用组件
│   ├── pages/         # 页面组件
│   ├── hooks/         # 自定义Hooks
│   ├── services/      # API服务
│   ├── store/         # 状态管理
│   ├── lib/           # 工具函数
│   └── router/        # 路由配置
├── backend/           # Go后端服务
├── android/           # Android原生项目
├── public/            # 静态资源
└── docs/              # 文档
```

## 🔧 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run build:mobile` | 构建并同步到移动平台 |
| `npm run android` | 打开Android Studio |
| `npm run ios` | 打开Xcode |
| `npm run lint` | 代码检查 |
| `npm run preview` | 预览生产构建 |

## 🌟 主要页面

- **登录页面** - 用户身份验证
- **家长首页** - 家长控制面板
- **儿童首页** - 儿童互动界面
- **行为评分** - 行为记录和评分
- **奖励商店** - 积分兑换系统
- **数据报告** - 行为数据分析
- **设置页面** - 应用配置

## 🔐 安全特性

- 生物识别认证
- 家长权限验证
- 数据加密传输
- 隐私保护机制

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件

---

**注意**: 这是一个教育用途的示例项目，请根据实际需求进行调整和完善。
