import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import config from '../config.mjs'

test('教材侧边栏显示章节标题并指向现有页面', () => {
  const sidebar = config.themeConfig.sidebar
  const mysql = sidebar['/mysql-how-it-works/'].flatMap((group) => group.items || [])
  const geektime = sidebar['/geektime-mysql-shizhan-45/'].flatMap((group) => group.items || [])

  assert.equal(mysql.length, 27)
  assert.equal(mysql[0].text, '00 · 如何愉快的阅读本小册')
  assert.equal(geektime[0].text, '01 基础架构：一条SQL查询语句是如何执行的？')
  for (const { text, link } of [...mysql, ...geektime]) {
    assert.match(text, /[\p{L}]/u, link)
    assert.ok(existsSync(new URL(`../..${link}.md`, import.meta.url)), link)
  }
})
