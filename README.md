# Eval Studio Copy

一个用于本地完整测试的评测工作台。当前版本默认走本地免登录模式，不依赖 Firebase Auth、Google 登录或线上 Firestore；项目、数据集、模板、任务、投票与分析结果会保存在浏览器 `localStorage` 中。

## 功能概览

- 本地固定测试用户，无需登录即可使用。
- 支持项目工作台、数据集、模板、任务创建与任务执行。
- 支持 GSB / MOS / Arena / Arena-rank 等评测范式。
- Arena-rank 支持逐 case prompt 展示、逐排名视频预览、CSV 导出视频链接。
- Analysis 支持平台本地结果导入、外部 CSV 上传汇总、分析 CSV 导出。

## 环境要求

- Node.js 20 LTS 或较新的 Node.js 18 版本
- npm
- 推荐浏览器：Chrome / Edge

## 快速启动

克隆仓库后进入项目目录：

```powershell
git clone https://github.com/bread-lxy/eval_studio_copy.git
cd eval_studio_copy
npm install
```

### Windows 推荐入口

双击项目根目录里的：

```text
start-local.cmd
```

它会自动启动本地服务，并在可访问后打开浏览器。

也可以用命令：

```powershell
npm.cmd run local:start
```

访问地址：

```text
http://localhost:3000/
```

### macOS / Linux / 通用入口

```bash
npm install
npm run dev
```

然后打开：

```text
http://localhost:3000/
```

## 本地服务检查与停止

Windows 下可使用：

```powershell
npm.cmd run local:check
npm.cmd run local:stop
```

也可以双击：

```text
stop-local.cmd
```

更详细的 localhost 启动、重启电脑后的恢复、开机入口配置见：

```text
docs/local-backend.md
```

## 可选环境变量

普通本地评测流程不需要配置线上服务。若后续启用 Gemini 相关能力，可复制 `.env.example` 为 `.env.local` 并填写：

```text
GEMINI_API_KEY="your_api_key"
```

`.env.local` 不会被提交到 Git。

## 验证项目

提交或使用前可以运行：

```powershell
npm.cmd run lint
npm.cmd run build
```

如果不是 Windows，也可以用：

```bash
npm run lint
npm run build
```

## 常见问题

- `localhost:3000 refused to connect`：本地服务没启动。Windows 下双击 `start-local.cmd`，或运行 `npm run dev`。
- 重启电脑后无法访问：这是正常现象，本地 Vite 服务不会自动随系统恢复；按上面的 Windows 推荐入口重新启动即可。
- 页面数据消失：数据保存在当前浏览器的 `localStorage`，更换浏览器、清理站点数据或隐身模式都会看到新的空环境。
- 视频能新标签页打开但页面内加载慢：评测页已经做了视频加载兜底，结果页的视频预览使用 `metadata` 预加载以避免一次性下载全部视频。

## 线上恢复说明

当前仓库是本地免登录测试版。若未来要恢复 Firebase / Google 登录 / Firestore 线上部署能力，应基于 Git 历史重新接回线上数据层与权限配置。
