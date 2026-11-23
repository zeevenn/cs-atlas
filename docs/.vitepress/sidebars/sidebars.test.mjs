import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import config from '../config.mjs'

test('教材侧边栏显示章节标题并指向现有页面', () => {
  const sidebar = config.themeConfig.sidebar
  const mysql = sidebar['/mysql-how-it-works/'].flatMap((group) => group.items || [])
  const geektime = sidebar['/geektime-mysql-shizhan-45/'].flatMap((group) => group.items || [])

  assert.equal(mysql.length, 27)
  assert.equal(mysql[0].text, '00 · 如何愉快的阅读本小册')
  assert.equal(mysql.at(-1).text, '26 · 写作本书时用到的一些重要的参考资料')
  assert.equal(geektime[0].text, '01 基础架构：一条 SQL 查询语句是如何执行的？')
  for (const { text, link } of [...mysql, ...geektime]) {
    assert.match(text, /[\p{L}]/u, link)
    assert.ok(existsSync(new URL(`../..${link}.md`, import.meta.url)), link)
  }
})

test('MySQL 学习笔记按原顺序收录全部章节与本地配图', () => {
  const groups = config.themeConfig.sidebar['/note-mysql/'].filter((group) => group.items)
  assert.deepEqual(groups.map(({ text, items }) => [text, items.length]), [
    ['基础篇', 7], ['进阶篇', 6], ['运维篇', 3]
  ])
  const chapters = groups.flatMap(({ items }) => items)
  assert.deepEqual(groups[0].items.map(({ text, link }) => [text, link]), [
    ['1. MySQL 概述', '/note-mysql/01-basics/01-overview'],
    ['2. SQL', '/note-mysql/01-basics/02-sql'],
    ['3. 函数', '/note-mysql/01-basics/03-functions'],
    ['4. 约束', '/note-mysql/01-basics/04-constraints'],
    ['5. 多表查询', '/note-mysql/01-basics/05-multi-table-queries'],
    ['6. 事务', '/note-mysql/01-basics/06-transactions'],
    ['MySQL 基础速查', '/note-mysql/01-basics/07-cheatsheet']
  ])
  assert.equal(chapters.at(-1).text, '3. 分库分表')
  const index = readFileSync(new URL('../../note-mysql/index.md', import.meta.url), 'utf8')
  let imageCount = 0
  for (const { link } of chapters) {
    assert.match(link, /^\/note-mysql\/[a-z0-9/-]+$/, link)
    const page = new URL(`../..${link}.md`, import.meta.url)
    const source = readFileSync(page, 'utf8')
    assert.ok(index.includes(`${link.replace('/note-mysql/', '')}.md`), link)
    if (link.includes('/01-basics/')) {
      assert.match(source, /https:\/\/dev\.mysql\.com\/doc\/refman\/8\.4\/en\//, link)
      assert.doesNotMatch(source, /^## 自查问题\s*$/m, link)
    }
    assert.doesNotMatch(source, /!\[[^\]]*\]\(https?:/, link)
    for (const [, image] of source.matchAll(/!\[[^\]]*\]\((\/note-mysql\/assets\/[^)]+)\)/g)) {
      assert.ok(existsSync(new URL(`../../public${image}`, import.meta.url)), image)
      imageCount++
    }
  }
  assert.equal(imageCount, 119)
})
