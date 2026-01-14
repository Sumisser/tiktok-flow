import type { StoryboardItem } from '../types';

/**
 * 解析 Markdown 表格生成分镜列表
 *
 * 核心规则：
 * 1. 镜号 0 视为封面，使用特殊 UI 渲染。
 * 2. 如果 AI 输出中没有镜号 0，会自动生成一个占位封面。
 * 3. 稳健地处理 0 || 1 导致的逻辑错误。
 */
export function parseStoryboardTable(input: string): StoryboardItem[] {
  if (!input) return [];

  let items: StoryboardItem[] = [];
  let isJsonParsed = false;

  // 1. 尝试解析 JSON
  try {
    let jsonStr = input.trim();
    // 尝试提取 JSON 代码块
    const jsonMatch = input.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      // 尝试寻找最外层的 {}
      const firstBrace = input.indexOf('{');
      const lastBrace = input.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = input.substring(firstBrace, lastBrace + 1);
      }
    }

    const data = JSON.parse(jsonStr);
    if (data && Array.isArray(data.storyboard)) {
      items = data.storyboard.map((item: any) => ({
        id: `shot-${item.shot_number}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        shotNumber:
          typeof item.shot_number === 'number'
            ? item.shot_number
            : parseInt(item.shot_number) || 0,
        script: item.script || '',
        imagePrompt: item.image_prompt || '',
        imageUrl: '',
        videoPrompt: item.video_prompt || '',
        videoUrl: '',
      }));
      isJsonParsed = true;
    }
  } catch (e) {
    // JSON 解析失败，静默失败，继续尝试 Markdown 解析
  }

  // 2. 如果 JSON 解析未成功，使用旧版 Markdown 表格解析
  if (!isJsonParsed) {
    const lines = input.split('\n').filter((line) => line.trim());
    const hasTable = lines.some(
      (line) => (line.match(/\|/g) || []).length >= 2,
    );

    if (hasTable) {
      for (const line of lines) {
        const isHeader =
          (line.includes('镜号') || line.includes('Shot')) &&
          !/^\s*\|?\s*\d+/.test(line);
        if (isHeader) continue;
        if (/^[\s|:-]+$/.test(line)) continue;

        const cells = line
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell, index, array) => {
            if (index === 0 && cell === '' && array.length > 2) return false;
            if (index === array.length - 1 && cell === '') return false;
            return true;
          });

        if (cells.length > 0 && cells.every((cell) => /^[-:]+$/.test(cell)))
          continue;

        if (cells.length >= 2) {
          const parsedShot = parseInt(cells[0].replace(/[^0-9]/g, ''));
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
