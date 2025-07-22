# 房屋检查管理系统

基于 Next.js 和 MongoDB 的房屋检查任务管理应用。

## 功能特性

- **检查安排管理**: 创建、查看和管理房屋检查任务
- **状态跟踪**: 自动推进检查状态（需约时间 → 等待检查 → 检查完毕 → 上传完毕 → 完成）
- **历史记录**: 查看已完成的检查记录和统计数据

## 技术栈

- **前端**: Next.js 15, Ant Design, TypeScript
- **数据库**: MongoDB Atlas, Mongoose
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### 3. 启动应用

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 4. 初始化数据

首次使用时，访问 `/test` 页面创建示例数据。

## 页面功能

- **首页** (`/`) - 检查任务列表和状态管理
- **添加页面** (`/add`) - 创建新的检查任务
- **历史记录** (`/history`) - 已完成任务的记录和统计
- **测试页面** (`/test`) - 数据库连接测试和示例数据创建

## 部署

推荐部署到 Vercel：

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目  
3. 添加环境变量 `MONGODB_URI`
4. 部署完成
