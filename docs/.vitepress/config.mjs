import { defineConfig } from 'vitepress'
import { groups } from './sidebars/mysql-how-it-works.mjs'
import { geektimeGroups } from './sidebars/geektime-mysql-shizhan-45.mjs'
import { tokenize } from './search.mjs'

const base = process.env.BASE_PATH || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'MySQL 学习文档',
  description: '《MySQL 是怎样运行的》与《MySQL 实战 45 讲》，从底层原理到日常实战。',
  base,
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: `${base}favicon.ico?v=2` }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg?v=3` }]
  ],
  lastUpdated: true,
  themeConfig: {
    siteTitle: 'MySQL 学习文档',
    nav: [
      { text: '首页', link: '/' },
      { text: 'MySQL 是怎样运行的', link: '/mysql-how-it-works/' },
      { text: 'MySQL 实战 45 讲', link: '/geektime-mysql-shizhan-45/' }
    ],
    sidebar: {
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
    socialLinks: [{ icon: 'github', link: 'https://github.com/zeevenn/mysql-internals-guide' }]
  }
})
