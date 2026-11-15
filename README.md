# pm-6-word-step
ProjectMind: ワードステップ

## 本地运行

```bash
npm install
npm run build
npx serve public
```

未配置数据库时会自动使用项目根目录的 `local.db`（该文件已加入忽略列表）。本地静态预览只负责页面展示；注册、登录和数据接口需要通过 Vercel 或支持 `api/` 的开发环境运行。

部署到 Vercel 时，将 `DATABASE_URL` 和对应的 `DATABASE_AUTH_TOKEN` 配置为环境变量，不要写入仓库。数据库迁移会在 `npm run build` 的第一步执行；生产环境的单词和测试结果按账户隔离。
