# MySQL 学习笔记

基于 VitePress 的《MySQL 是怎样运行的：从根儿上理解 MySQL》学习文档，包含第 0–26 章、技术配图。

## 本地阅读

需要 Node.js 20 或更高版本。

```sh
npm ci
npm run docs:dev
```

## 构建

```sh
npm run docs:build
npm run docs:preview
```

输出目录为 `docs/.vitepress/dist`。站点配置位于 `docs/.vitepress/config.mjs`，首页位于 `docs/index.md`。

## GitHub Pages

在线阅读：[MySQL 学习笔记](https://zeevenn.github.io/mysql-internals-guide/)。

推送到 `main` 分支后，GitHub Actions 自动构建并部署。仓库的 Settings → Pages → Source 使用 GitHub Actions。

本地构建相同的部署路径：

```sh
BASE_PATH=/mysql-internals-guide/ npm run docs:build
```
