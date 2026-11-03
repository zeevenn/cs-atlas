# CS Atlas · 计算机知识学习图鉴

收录经典教材与优质文章，按知识主题组织计算机知识的学习路径。既可以沿着完整教材系统学习，也可以通过多篇文章组成的专题深入一个问题。

在线阅读：[计算机知识学习图鉴](https://zeevenn.github.io/cs-atlas/)。

## 内容组织

- **教材与专栏**：保留原有章节结构与阅读顺序，适合系统学习。
- **学习专题**：围绕一个主题选取教材章节或独立文章，补充学习目标、前置知识、推荐顺序与自查问题。

目前从数据库领域开始，逐步扩展到数据结构与算法、操作系统、计算机网络、编程语言和分布式系统。

### 已有内容

| 类型 | 内容 | 范围 |
| --- | --- | --- |
| 完整教材 | [MySQL 是怎样运行的](docs/mysql-how-it-works/index.md) | 第 0–26 章 |
| 完整专栏 | [MySQL 实战 45 讲](docs/geektime-mysql-shizhan-45/index.md) | 45 讲正文与 2 篇补充文章 |
| 学习专题 | [数据库中的数据结构](docs/topics/database-data-structures.md) | 记录、数据页、B+ 树、哈希表与缓存链表 |

### 收录约定

- 优先选择讲解清晰、内容准确、能帮助建立原理认识的资料；不以链接数量作为目标。
- 完整教材保留原有脉络；专题按学习问题组织，可以组合多个来源，无需凑成一本书。
- 每份资料标注标题、作者、来源与适用版本；专题说明每篇选文的作用，并保留原文入口。
- 新增全文前确认许可或授权；不适合全文收录的资料，以原文链接和原创导读组织。
- 同一篇内容只维护一份正文，专题通过链接复用已有章节，避免重复复制。

## 目录结构

```text
docs/
├── index.md                    # 学习图鉴首页
├── library/index.md            # 教材与专栏目录
├── topics/                     # 专题索引与阅读路径
├── mysql-how-it-works/          # 完整教材及配图
├── geektime-mysql-shizhan-45/   # 完整专栏及配图
└── .vitepress/                 # 站点配置、主题与侧边栏
```

新增教材或专栏时，在 `docs/` 下建立独立目录，在 `docs/library/index.md` 登记，并在 `docs/.vitepress/config.mjs` 配置对应侧边栏。新增专题时，在 `docs/topics/` 编写导读，并更新专题索引及侧边栏。

## 本地阅读

需要 Node.js 20 或更高版本，以及 pnpm 10.30.3。

```sh
pnpm install --frozen-lockfile
pnpm run docs:dev
```

## 构建

```sh
pnpm run docs:build
pnpm run docs:preview
```

Markdown 检查：`pnpm run lint:md`。

输出目录为 `docs/.vitepress/dist`。站点配置位于 `docs/.vitepress/config.mjs`，首页位于 `docs/index.md`。

## GitHub Pages

推送到 `main` 分支后，GitHub Actions 自动构建并部署。仓库的 Settings → Pages → Source 使用 GitHub Actions。

本地构建相同的部署路径：

```sh
BASE_PATH=/cs-atlas/ pnpm run docs:build
```
