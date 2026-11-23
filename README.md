# 中国科学院生物考研智能百宝箱（全栈数据隐藏版）

本项目已完成**前后端完全分离架构改造**，可直接托管至你的 **GitHub 私有仓库（Private Repository）**，并部署生成公开访问链接。访客仅能通过网页使用功能，无法在浏览器前端源码中下载全量数据库或核心算法实现。

---

## 一、已完成的“数据与算法前端隐藏”改造

1. **全量核心数据集仅驻留服务端（`server/api.ts`）**
   - 62 所生命科学培养单位档案、11 个联培专项计划
   - 241 条初试科目与招生方向目录
   - 714 条三年（2024–2026）官方复试总分线与报录记录
   - 3,089 位生物导师语料及名录、371 个三级研究方向节点与匹配规则、官方考纲教材库
2. **核心算法仅在服务端运行（前端 `dist/assets/*.js` 零打包）**
   - 五档难度四区间划分算法（`computeZoneBoundaries` / `calculateScoreSafetyMetrics` / `evaluateScoreAgainstZones`）
   - 分数区间定位筛选、三级级联图谱加权排序、全库关键词检索与导师分页检索
3. **安全与防爬基础防护**
   - 分数线接口（`/api/risks`）与导师名录接口（`/api/advisors`）强制服务端分页上限
   - 内置轻量级单 IP 请求频率限制与 `Cache-Control: no-store` 响应头
   - 前端组件（`App.tsx` 与 `Module1`–`Module5`）已彻底移除对 `src/data/*` 与 `src/utils/casFilters.ts` 的引用

---

## 二、推送至你的 GitHub 私有仓库

> 务必在 GitHub 创建仓库时勾选 **Private（私有）**，确保他人无法直接查看服务端源码与数据文件。

```bash
# 1. 在项目根目录初始化 Git（如已初始化可跳过）
git init

# 2. 添加并提交代码（node_modules、dist、.env 已被 .gitignore 自动排除）
git add .
git commit -m "feat: full-stack API isolation for CAS biology toolbox"

# 3. 关联你在 GitHub 新建的 Private 仓库并推送
git branch -M main
git remote add origin https://github.com/<你的GitHub用户名>/<你的私有仓库名>.git
git push -u origin main
```

---

## 三、生成公开访问链接（两种零运维方案任选其一）

### 方案 A：使用 Vercel 部署（推荐，内置 `vercel.json`、`server/vercelApp.ts` 与编译产物 `api/index.mjs`）
1. 登录 [Vercel](https://vercel.com/) 并使用你的 GitHub 账号授权（允许访问该 Private 仓库）。
2. 点击 **Add New Project** → 选择你的私有仓库 → 点击 **Import**。
3. 无需额外修改构建配置（仓库根目录已提供 `vercel.json`，会自动运行 `npm run build:vercel` 打包前端 `dist/` 并生成单文件 ESM 服务端函数 `api/index.mjs`，将 `/api/*` 自动路由至 Serverless 服务端）。
4. 点击 **Deploy**，约 1 分钟即可获得公开访问链接（如 `https://your-app.vercel.app`），也可绑定自定义域名。

### 方案 B：使用 Render / Railway / 自有容器部署（内置 `render.yaml` 与 `Dockerfile`）
1. 登录 [Render](https://render.com/)，选择 **New → Blueprint** 或 **Web Service**，关联你的 GitHub 私有仓库。
2. 构建命令：`npm ci && npm run build`
3. 启动命令：`NODE_ENV=production npx tsx server.ts`
4. 健康检查路径：`/api/health`
5. 若使用自有云服务器（Docker）：
   ```bash
   docker build -t cas-bio-toolbox .
   docker run -d -p 3000:3000 --restart unless-stopped cas-bio-toolbox
   ```

---

## 四、本地开发与验证命令

```bash
# 安装依赖
npm install

# 启动全栈开发服务器（前端 Vite + 服务端 /api/*，默认端口 3000）
npm run dev

# 运行全量单元测试（含前端数据/算法零泄漏隔离校验）
npm test

# 构建前端静态产物并检查 TypeScript 类型
npm run build && npm run lint
```
