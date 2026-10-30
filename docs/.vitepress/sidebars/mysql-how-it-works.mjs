import { readdirSync, readFileSync } from 'node:fs'

export const groups = [
  { text: '开始阅读', directory: '01-basics' },
  { text: '记录、数据页与索引', directory: '02-storage-and-indexes' },
  { text: '查询与优化', directory: '03-query-optimization' },
  { text: '缓存、事务与日志', directory: '04-transactions-and-logs' },
  { text: '并发控制与参考资料', directory: '05-concurrency-and-references' }
].map(({ text, directory }) => ({
  text,
  items: readdirSync(new URL(`../../mysql-how-it-works/${directory}/`, import.meta.url))
    .filter((file) => /^\d{2}-.+\.md$/.test(file))
    .sort()
    .map((file) => ({
      number: Number(file.slice(0, 2)),
      title: readFileSync(new URL(`../../mysql-how-it-works/${directory}/${file}`, import.meta.url), 'utf8').split('\n')[0].replace(/^# /, ''),
      link: `/mysql-how-it-works/${directory}/${file.replace(/\.md$/, '')}`
    }))
}))
