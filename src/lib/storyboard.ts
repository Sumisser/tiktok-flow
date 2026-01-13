import type { StoryboardItem } from '../types';

/**
 * 解析 Markdown 表格生成分镜列表
 *
 * 核心规则：
 * 1. 镜号 0 视为封面，使用特殊 UI 渲染。
 * 2. 如果 AI 输出中没有镜号 0，会自动生成一个占位封面。
 * 3. 稳健地处理 0 || 1 导致的逻辑错误。
 */
export function parseStoryboardTable(markdown: string): StoryboardItem[] {
  if (!markdown) return [];

  const lines = markdown.split('\n').filter((line) => line.trim());
  const hasTable = lines.some((line) => (line.match(/\|/g) || []).length >= 2);
  const items: StoryboardItem[] = [];

  if (hasTable) {
    for (const line of lines) {
      // 检查是否是标题行：包含关键字且不以数字开头（分镜行通常以数字或 | 数字开头）
      const isHeader =
        (line.includes('镜号') || line.includes('Shot')) &&
        !/^\s*\|?\s*\d+/.test(line);
      if (isHeader) continue;
      if (/^[\s|:-]+$/.test(line)) continue;

      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell, index, array) => {
          // 只有首尾如果是空的才过滤掉（处理 | 0 | 1 | 这种格式）
          if (index === 0 && cell === '' && array.length > 2) return false;
          if (index === array.length - 1 && cell === '') return false;
          return true;
        });

      if (cells.length > 0 && cells.every((cell) => /^[-:]+$/.test(cell)))
        continue;

      if (cells.length >= 2) {
        // 尝试从第一列解析镜号
        const parsedShot = parseInt(cells[0].replace(/[^0-9]/g, ''));
        // 关键修复：显式判断 isNaN，确保 0 不会被 || 转为 1
        const shotNumber = isNaN(parsedShot) ? items.length + 1 : parsedShot;

        items.push({
          id: `shot-${shotNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          shotNumber,
          script: cells[1] || '',
          imagePrompt: cells[2] || '',
          imageUrl: '',
          videoPrompt: cells[3] || '',
          videoUrl: '',
        });
      }
    }
  } else {
    // 兜底策略：如果不是表格，按行解析
    lines.forEach((line, index) => {
      items.push({
        id: `shot-${index + 1}-${Date.now()}`,
        shotNumber: index + 1,
        script: line,
        imagePrompt: '',
        imageUrl: '',
        videoPrompt: '',
        videoUrl: '',
      });
    });
  }

  // 封面自动补全逻辑
  const hasCover = items.some((item) => item.shotNumber === 0);
  if (!hasCover && items.length > 0) {
    items.unshift({
      id: `shot-0-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shotNumber: 0,
      script: '[封面]',
      imagePrompt:
        'Cinematic cover image for this video, dramatic lighting, high quality',
      imageUrl: '',
      videoPrompt: '-',
      videoUrl: '',
    });
  }

  return items;
}

/**
 * 将分镜列表转回 Markdown 表格
 */
export function stringifyStoryboardTable(
  items: StoryboardItem[],
  fullScript: string = '',
): string {
  let markdown = '';

  if (fullScript) {
    markdown += `### 1. 完整口播文稿\n\n${fullScript}\n\n`;
  }

  markdown += `### 2. 视觉分镜表\n\n`;
  markdown += `| 镜号 | 脚本文案 | 画面生成提示词 (Image Prompt) | 视频生成提示词 (Video Prompt) |\n`;
  markdown += `|------|----------|-------------------------------|------------------------------|\n`;

  items.forEach((item) => {
    markdown += `| ${item.shotNumber} | ${item.script} | ${item.imagePrompt} | ${item.videoPrompt || '-'} |\n`;
  });

  return markdown;
}
