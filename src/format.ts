import type { ImageResult } from './types'

export function renderImages(images: ImageResult[], showTags: boolean): string {
  return images
    .map((image, index) => {
      const lines = [
        images.length > 1
          ? `### ${index + 1}. ${image.title || image.id}`
          : `### ${image.title || image.id}`,
        `![${image.title || image.id}](${image.url})`,
        `- 图源：${image.source}`,
        `- ID：${image.id}`,
        `- 作者：${image.author || '未知'}`,
        `- 原图：[打开链接](${image.originalUrl})`,
        `- R18：${image.r18 ? '是' : '否'}`
      ]
      if (image.page !== undefined) lines.push(`- 页码：${image.page}`)
      if (image.pageCount !== undefined) lines.push(`- 总页数：${image.pageCount}`)
      if (showTags && image.tags.length)
        lines.push(`- 标签：${image.tags.map((tag) => `#${tag}`).join(' ')}`)
      return lines.join('\n')
    })
    .join('\n\n')
}
