# 面试练习室

用 Python 准备算法机试和 AI 工程实现面试。工作台可以写代码、运行用例、查看参考解、按题复习，教程会关联到可以立即动手的练习。[打开面试练习室](https://xuanqi2004.github.io/ai-interview-practice/)

| 想做的事 | 入口 |
| --- | --- |
| 按原题单顺序刷题，查看答案和提交记录 | [算法题单](https://xuanqi2004.github.io/ai-interview-practice/#catalog) |
| 练习 attention、训练、推理、检索与 Agent 工程 | [专题工作台](https://xuanqi2004.github.io/ai-interview-practice/#home) |
| 结合博客、课程和开源实现学习 | [教程库](https://xuanqi2004.github.io/ai-interview-practice/#tutorials) |
| 根据求职方向选材料，找手算例子 | [资源调研](docs/survey.md) · [练习讲解](docs/practice-guide.md) |
| 在另一台电脑继续上次的进度 | [进度备份](https://xuanqi2004.github.io/ai-interview-practice/#sync) |

四份算法题单为 LeetCode 75、Top Interview 150、Hot 100 和牛客面试 TOP101。保留各题单的题序、原站入口和重复收录关系，去重后共 335 道。站内提供自行编写的练习说明、Python 接口、参考解和用例。另有 89 道专题练习，其中 67 道为 AI 工程实现题。41 篇中文教程关联 114 条去重后的原文资料。

## 网页版和本机版

| 功能 | GitHub Pages 网页版 | 本机版 |
| --- | --- | --- |
| 题目与教程 | 查看全部 424 道练习、题解和教程 | 相同题库 |
| Python 判题 | 407 道可直接提交，首次评测按需下载本站的 Python 运行时；NumPy 也按需加载 | 通过本机 Python 运行。安装 PyTorch 后可评测全部 424 道 |
| 教程、题目和代码讨论 | 在当前题目或教程打开本机版，可手动复制代码或问题 | 使用本机已登录的 Codex CLI；在教程内可选择来源和引用片段 |
| 进度 | 自动保存在当前浏览器，支持 JSON 导出和合并导入 | 默认保存在项目内的 .interview-data，支持 JSON 迁移和专用 GitHub 私库同步 |

网页提交在独立的浏览器 Worker 中运行，平台只下载教材、脚本和解释器。草稿、答案和讨论记录由当前设备保存。GitHub 提供静态文件托管；浏览器按站点来源管理存储，平台按项目目录命名数据库。使用自己编写或信任的 Python 代码。清理浏览器站点数据或切换浏览器配置前，可在「进度备份」导出 JSON；该文件包含完整代码和已保存的讨论。

## 启动本机版

安装 Node.js 22 或以上版本以及 Python 3，然后运行以下命令。程序仅监听本机回环地址。

```sh
git clone https://github.com/XuanQi2004/ai-interview-practice.git
cd ai-interview-practice
npm run open
```

也可以用 `npm start` 在前台运行服务并打开 [本机练习室](http://127.0.0.1:4174/)。默认端口为 4174，使用 `PORT` 环境变量可选择其他端口。网页中的本机入口使用默认端口；在自选端口打开相同的题目或教程地址即可继续学习。

在 macOS 或 Linux 上，以下命令为当前项目安装 NumPy 和 PyTorch。应用会自动使用项目中的虚拟环境，也可将 `INTERVIEW_PYTHON` 设为已有解释器的路径。

```sh
python3 -m venv .venv
.venv/bin/python -m pip install numpy torch
```

Windows 可通过 `py -m venv .venv` 创建环境，并用 `.venv\Scripts\python.exe -m pip install numpy torch` 安装依赖。在希望讨论题目或教程的电脑上安装 Codex CLI，运行 `codex login` 完成登录，再在本机版点「讨论」。提问时，CLI 将当前题目或教程、选中的片段、当前作答及相应的对话上下文发送至模型服务。账号凭据由本机 CLI 管理。

## 在电脑之间迁移或同步

- **在浏览器之间迁移。** 在「进度备份」导出 JSON，通过自己的文件夹或云盘传到另一台电脑，再导入。相同事件会自动去重，保留两边新增的练习记录。
- **在网页和本机之间迁移。** 从来源版本导出，在目标版本导入。本机版的入口位于「记录同步」。
- **同步到自己的 GitHub 私库。** 在两台电脑上登录 GitHub CLI，为进度指定同一个私有仓库。下面的 OWNER 替换为自己的 GitHub 用户名，创建仓库仅需执行一次。

```sh
gh auth login --hostname github.com
gh repo create OWNER/interview-progress --private
node server/configure-sync.cjs OWNER/interview-progress
```

在本机版点「立即同步」。程序向所选私库的 interview-progress 分支合并草稿、提交、阅读状态和讨论，每次推送都会核实目标的私有状态。可用 `node server/configure-sync.cjs --off` 关闭。两台设备各自都可先离线练习，再合并记录。

## 开发与发布

`npm test` 运行本机功能测试。安装 PyTorch 和 NumPy 后，`npm run check:answers` 会按题运行全部参考解。[开发记录](docs/development.md)

`npm run build:pages` 从显式列出的界面文件和教材生成 dist 目录；Python 和 NumPy 来自固定版本的发行文件，发布时附上来源和许可。可用 `python3 -m http.server --bind 127.0.0.1 --directory dist 8000` 在浏览器预览。

维护者提交 main 分支的源码后运行 `npm run publish:pages`。命令在新的临时目录构建，向 gh-pages 分支提交生成的静态文件。GitHub Pages 从该分支根目录发布。[GitHub Pages 发布源说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
