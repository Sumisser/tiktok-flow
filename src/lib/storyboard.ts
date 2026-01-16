import type { StoryboardItem } from '../types';

/**
 * 从可能包含 Markdown 代码块或 Markdown 表格的文本中提取并转换为纯 JSON 字符串
 *
 * 处理以下情况：
 * 1. 包含 ```json ... ``` 或 ```markdown ... ``` 代码块
 * 2. 包含 ``` ... ``` 代码块（无语言标识）
 * 3. Markdown 格式：包含 "### 1. 完整口播文稿" 和表格
 * 4. 纯文本中嵌入的 JSON 对象
 * 5. 已经是纯 JSON 字符串
 *
 * @returns 纯 JSON 字符串，如果无法提取则返回原始输入
 */
export function extractJsonFromMarkdown(input: string): string {
  if (!input || typeof input !== 'string') return input;

  const trimmed = input.trim();

  // 1. 如果输入已经是有效 JSON 且包含 storyboard，直接返回
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && parsed.storyboard) {
      return trimmed;
    }
  } catch {
    // 不是有效 JSON，继续处理
  }

  // 2. 尝试提取 ```json ... ``` 代码块
  const jsonCodeBlockMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonCodeBlockMatch) {
    const extracted = jsonCodeBlockMatch[1].trim();
    try {
      const parsed = JSON.parse(extracted);
      if (parsed && parsed.storyboard) {
        return extracted;
      }
    } catch {
      // 提取失败，继续尝试其他方式
    }
  }

  // 3. 尝试提取 ``` ... ``` 代码块（可能是 ```markdown 或无标识）
  const codeBlockMatch = trimmed.match(/```(?:markdown)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    // 先尝试作为 JSON 解析
    try {
      const parsed = JSON.parse(extracted);
      if (parsed && parsed.storyboard) {
        return extracted;
      }
    } catch {
      // 不是 JSON，尝试作为 Markdown 解析
      const jsonResult = convertMarkdownToJson(extracted);
      if (jsonResult) {
        return jsonResult;
      }
    }
  }

  // 4. 尝试寻找最外层的 {} 作为 JSON 对象
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(extracted);
      if (parsed && parsed.storyboard) {
        return extracted;
      }
    } catch {
      // 提取失败
    }
  }

  // 5. 检测是否为 Markdown 格式（包含标题或表格）
  if (isMarkdownFormat(trimmed)) {
    const jsonResult = convertMarkdownToJson(trimmed);
    if (jsonResult) {
      return jsonResult;
    }
  }

  return input;
}

/**
 * 检测文本是否为 Markdown 格式
 */
function isMarkdownFormat(text: string): boolean {
  // 检查是否包含 Markdown 标题或表格
  return (
    text.includes('### ') ||
    text.includes('## ') ||
    text.includes('完整口播文稿') ||
    text.includes('视觉分镜表') ||
    (text.includes('|') && text.includes('镜号'))
  );
}

/**
 * 将 Markdown 格式转换为 JSON 字符串
 */
function convertMarkdownToJson(markdown: string): string | null {
  try {
    let fullScript = '';
    const storyboard: Array<{
      shot_number: number;
      script: string;
      image_prompt: string;
      video_prompt: string;
      style_prompt: string;
    }> = [];

    // 提取完整口播文稿
    // 匹配 "### 1. 完整口播文稿" 或类似标题后的内容，直到下一个 ### 或表格开始
    const scriptMatch = markdown.match(
      /###?\s*\d*\.?\s*完整口播文稿\s*\n+([\s\S]*?)(?=\n###|\n\||\n##|$)/i,
    );
    if (scriptMatch) {
      fullScript = scriptMatch[1].trim();
    }

    // 解析表格
    const lines = markdown.split('\n');
    let inTable = false;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // 检测表格开始（表头行）
      if (
        trimmedLine.includes('|') &&
        (trimmedLine.includes('镜号') || trimmedLine.includes('Shot'))
      ) {
        inTable = true;
        continue;
      }

      // 跳过分隔行
      if (/^[\s|:-]+$/.test(trimmedLine)) {
        continue;
      }

      // 解析表格数据行
      if (inTable && trimmedLine.includes('|')) {
        const cells = trimmedLine
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell, index, array) => {
            // 移除首尾空单元格
            if (index === 0 && cell === '' && array.length > 2) return false;
            if (index === array.length - 1 && cell === '') return false;
            return true;
          });

        // 跳过全是分隔符的行
        if (cells.length > 0 && cells.every((cell) => /^[-:]+$/.test(cell))) {
          continue;
        }

        if (cells.length >= 2) {
          const parsedShot = parseInt(cells[0].replace(/[^0-9]/g, ''));
          const shotNumber = isNaN(parsedShot) ? storyboard.length : parsedShot;

          storyboard.push({
            shot_number: shotNumber,
            script: cells[1] || '',
            image_prompt: cells[2] || '',
            video_prompt: cells[3] || '-',
            style_prompt: '', // Will be hydrated later
          });
        }
      }
    }

    // 如果成功解析到分镜数据，返回 JSON
    if (storyboard.length > 0 || fullScript) {
      const result = {
        full_script: fullScript,
        storyboard: storyboard,
      };
      return JSON.stringify(result, null, 2);
    }

    return null;
  } catch (e) {
    console.error('Markdown to JSON conversion failed:', e);
    return null;
  }
}

/**
 * 解析 Markdown 表格生成分镜列表
 *
 * 核心规则：
 * 1. 镜号 0 视为封面，使用特殊 UI 渲染。
 * 2. 如果 AI 输出中没有镜号 0，会自动生成一个占位封面。
 * 3. 稳健地处理 0 || 1 导致的逻辑错误。
 */
export function parseStoryboardTable(
  input: string,
  defaultStylePrompt?: string,
): StoryboardItem[] {
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
        stylePrompt: item.style_prompt || defaultStylePrompt || '',
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
            stylePrompt: defaultStylePrompt || '',
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
          stylePrompt: defaultStylePrompt || '',
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
      stylePrompt: defaultStylePrompt || '',
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

/**
 * 将风格提示词注入到 JSON 字符串中
 */
export function injectStyleIntoJson(
  jsonStr: string,
  stylePrompt: string,
): string {
  if (!jsonStr || !stylePrompt) return jsonStr;

  try {
    // 检查是否看起来像 JSON
    const trimmed = jsonStr.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return jsonStr;

    const data = JSON.parse(trimmed);

    // 处理 { storyboard: [...] } 格式
    if (data && Array.isArray(data.storyboard)) {
      data.storyboard = data.storyboard.map((item: any) => ({
        ...item,
        style_prompt: item.style_prompt || stylePrompt,
      }));
      return JSON.stringify(data, null, 2);
    }

    // 处理数组格式 [...]
    if (Array.isArray(data)) {
      const updated = data.map((item: any) => ({
        ...item,
        style_prompt: item.style_prompt || stylePrompt,
      }));
      return JSON.stringify(updated, null, 2);
    }
  } catch (e) {
    // 忽略解析错误，可能不是 JSON 或者格式不对
  }

  return jsonStr;
}
