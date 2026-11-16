import { readFileSync } from 'node:fs'

export function readTitle(file) {
  const source = readFileSync(file, 'utf8')
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
  // shortcut: 现有标题均为单行 JSON 字符串，使用其他 YAML 写法时改用 YAML 解析器。
  const title = JSON.parse(frontmatter?.match(/^title: (.+)\r?$/m)?.[1] ?? 'null')
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error(`Missing frontmatter title: ${file}`)
  }
  return title
}
