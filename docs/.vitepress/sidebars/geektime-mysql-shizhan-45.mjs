import { readdirSync } from 'node:fs'
import { readTitle } from './read-title.mjs'

export const geektimeGroups = [
  ...[
    { text: '基础架构、索引与事务', directory: '01-foundations' },
    { text: '索引优化、查询与锁', directory: '02-query-and-locks' },
    { text: '日志、主备与运维', directory: '03-replication-and-operations' },
    { text: '查询实践、引擎与自增 ID', directory: '04-advanced-practice' },
    { text: '补充阅读', directory: '05-supplement' }
  ].map(({ text, directory }) => ({
    text,
    collapsed: false,
    items: readdirSync(new URL(`../../geektime-mysql-shizhan-45/${directory}/`, import.meta.url))
      .filter((file) => file.endsWith('.md'))
      .sort()
      .map((file) => ({
        text: readTitle(new URL(`../../geektime-mysql-shizhan-45/${directory}/${file}`, import.meta.url)),
        link: `/geektime-mysql-shizhan-45/${directory}/${file.replace(/\.md$/, '')}`
      }))
  }))
]
