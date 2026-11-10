import { defineConfig } from 'vitepress'
import { groups } from './sidebars/mysql-how-it-works.mjs'
import { geektimeGroups } from './sidebars/geektime-mysql-shizhan-45.mjs'
import { tokenize } from './search.mjs'

const base = process.env.BASE_PATH || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: '计算机知识学习图鉴',
  description: 'CS Atlas · 收录经典教材与优质文章，按知识主题组织阅读路径，从基础概念走向工程原理。',
  base,
  head: [
    ['meta', { name: 'referrer', content: 'no-referrer' }],
    ['link', { rel: 'icon', type: 'image/x-icon', href: `${base}favicon.ico?v=2` }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg?v=3` }]
  ],
  lastUpdated: true,
  markdown: {
    config(md) {
      md.core.ruler.before('block', 'frontmatter-title', (state) => {
        const { title, layout = 'doc' } = state.env.frontmatter || {}
        if (title && layout === 'doc') {
          state.src = `# ${title}\n\n${state.src}`
        }
      })
    }
  },
  themeConfig: {
    siteTitle: 'CS Atlas · 学习图鉴',
    nav: [
      { text: '首页', link: '/' },
      { text: '教材与专栏', link: '/library/' },
      { text: '学习专题', link: '/topics/' }
    ],
    sidebar: {
      '/topics/': [
        { text: '学习专题', link: '/topics/' },
        {
          text: '数据库',
          items: [{ text: '数据库中的数据结构', link: '/topics/database-data-structures' }]
        }
      ],
      '/geektime-mysql-shizhan-45/': geektimeGroups,
      '/mysql-how-it-works/': [
        { text: '阅读目录', link: '/mysql-how-it-works/' },
        ...groups.map(({ text, items }) => ({
          text,
          collapsed: false,
          items: items.map(({ number, title, link }) => ({
            text: `${String(number).padStart(2, '0')} · ${title.replace(/^第\d+章 /, '').replace(/^.*?-/, '')}`,
            link
          }))
        }))
      ]
    },
    outline: { level: [2, 3], label: '本页目录' },
    search: {
      provider: 'local',
      options: {
        miniSearch: { options: { tokenize } },
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                noResultsText: '没有找到相关内容',
                resetButtonTitle: '清空搜索',
                backButtonTitle: '关闭搜索',
                displayDetails: '显示详细结果',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
              }
            }
          }
        }
      }
    },
    docFooter: { prev: '上一章', next: '下一章' },
    returnToTopLabel: '返回顶部',
    skipToContentLabel: '跳转到正文',
    sidebarMenuLabel: '章节目录',
    darkModeSwitchLabel: '切换深色模式',
    lightModeSwitchTitle: '切换为浅色模式',
    darkModeSwitchTitle: '切换为深色模式',
    lastUpdated: { text: '最后更新', formatOptions: { dateStyle: 'medium' } },
    socialLinks: [{ icon: 'github', link: 'https://github.com/zeevenn/cs-atlas' }]
  }
})
