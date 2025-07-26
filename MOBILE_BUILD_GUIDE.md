# 移动端APP构建指南

## 概述
本项目已配置为使用 Capacitor 将 React Web 应用打包成原生移动应用。

## 前置要求

### Android 开发
1. **安装 Android Studio**
   - 下载并安装 [Android Studio](https://developer.android.com/studio)
   - 安装 Android SDK (API 33 或更高版本)
   - 配置 Android SDK 环境变量

2. **安装 Java JDK**
   - 安装 JDK 17 或更高版本
   - 配置 JAVA_HOME 环境变量

### iOS 开发 (仅限 macOS)
1. **安装 Xcode**
   - 从 App Store 安装 Xcode
   - 安装 Xcode Command Line Tools: `xcode-select --install`

2. **安装 CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

## 构建步骤

### 1. 构建 Web 应用
```bash
npm run build
```

### 2. 同步到移动平台
```bash
npm run sync
```

### 3. Android 构建

#### 开发模式
```bash
# 打开 Android Studio
npm run android

# 或者直接构建 APK
npx cap run android
```

#### 生产构建
```bash
# 构建 APK
npx cap build android

# 构建 AAB (推荐用于 Google Play)
npx cap build android --prod
```

### 4. iOS 构建 (仅限 macOS)

#### 开发模式
```bash
# 打开 Xcode
npm run ios

# 或者直接运行
npx cap run ios
```

#### 生产构建
```bash
npx cap build ios --prod
```

## 配置文件

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yixue.app',
  appName: 'yixue',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run build:mobile` | 构建 Web 应用并同步到移动平台 |
| `npm run android` | 打开 Android Studio |
| `npm run ios` | 打开 Xcode |
| `npm run sync` | 同步 Web 资源到移动平台 |
| `npx cap doctor` | 检查开发环境配置 |

## 添加原生功能

### 安装插件
```bash
# 相机功能
npm install @capacitor/camera

# 设备信息
npm install @capacitor/device

# 文件系统
npm install @capacitor/filesystem

# 推送通知
npm install @capacitor/push-notifications
```

### 同步插件
```bash
npx cap sync
```

## 调试

### Android 调试
1. 在 Android Studio 中打开项目
2. 连接 Android 设备或启动模拟器
3. 点击运行按钮

### iOS 调试
1. 在 Xcode 中打开项目
2. 连接 iOS 设备或启动模拟器
3. 点击运行按钮

### Web 调试
```bash
npm run dev
```

## 发布

### Android 发布
1. 在 Android Studio 中生成签名的 APK 或 AAB
2. 上传到 Google Play Console

### iOS 发布
1. 在 Xcode 中 Archive 项目
2. 通过 Xcode 上传到 App Store Connect

## 故障排除

### 常见问题
1. **构建失败**: 运行 `npx cap doctor` 检查环境配置
2. **插件问题**: 确保运行了 `npx cap sync`
3. **Android 构建错误**: 检查 Android SDK 和 JDK 版本
4. **iOS 构建错误**: 确保 Xcode 和 CocoaPods 正确安装

### 清理缓存
```bash
# 清理 npm 缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新同步
npx cap sync
```

## 注意事项

1. **API 调用**: 确保后端 API 支持 HTTPS 和 CORS
2. **图标和启动画面**: 在 `android/app/src/main/res` 和 iOS 项目中配置
3. **权限**: 在 `android/app/src/main/AndroidManifest.xml` 和 iOS `Info.plist` 中配置所需权限
4. **版本管理**: 更新 `android/app/build.gradle` 和 iOS 项目中的版本号