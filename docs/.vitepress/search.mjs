export function tokenize(text) {
  return Array.from(
    new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(text),
    ({ segment, isWordLike }) => isWordLike ? segment : ''
  ).filter(Boolean)
}
