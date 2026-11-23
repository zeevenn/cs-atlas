import { readdirSync } from 'node:fs'
import { readTitle } from './read-title.mjs'

export const noteMysqlGroups = [
  ...[
    { text: '基础篇', directory: '01-basics' },
    { text: '进阶篇', directory: '02-advanced' },
    { text: '运维篇', directory: '03-operations' }
  ].map(({ text, directory }) => ({
    text,
    collapsed: false,
    items: readdirSync(new URL(`../../note-mysql/${directory}/`, import.meta.url))
      .filter((file) => file.endsWith('.md'))
      .sort()
      .map((file) => ({
        text: readTitle(new URL(`../../note-mysql/${directory}/${file}`, import.meta.url)),
        link: `/note-mysql/${directory}/${file.replace(/\.md$/, '')}`
      }))
  })),
]
