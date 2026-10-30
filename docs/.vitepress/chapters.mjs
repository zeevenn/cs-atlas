import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const chapterDirectory = fileURLToPath(new URL('../mysql/', import.meta.url))

export const chapters = readdirSync(chapterDirectory)
  .filter((name) => /^\d{2}-.+\.md$/.test(name))
  .sort()
  .map((file) => ({
    file,
    number: Number(file.slice(0, 2)),
    title: readFileSync(`${chapterDirectory}/${file}`, 'utf8').split('\n')[0].replace(/^# /, ''),
    link: `/mysql/${file.replace(/\.md$/, '')}`
  }))

export const groups = [
  { text: '开始阅读', start: 0, end: 3 },
  { text: '记录、数据页与索引', start: 4, end: 9 },
  { text: '查询与优化', start: 10, end: 17 },
  { text: '缓存、事务与日志', start: 18, end: 23 },
  { text: '并发控制与参考资料', start: 24, end: 26 }
].map(({ text, start, end }) => ({
  text,
  items: chapters.filter(({ number }) => number >= start && number <= end)
}))
