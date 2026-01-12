import { useState, useEffect } from 'react';
import { ai } from '@/lib/gemini';

import type {
  WorkflowStep as WorkflowStepType,
  StoryboardItem,
} from '../types';

// 解析 Markdown 表格生成分镜列表
function parseMarkdownTable(markdown: string): StoryboardItem[] {
  const lines = markdown.split('\n').filter((line) => line.trim());
  const hasTable = lines.some((line) => (line.match(/\|/g) || []).length >= 2);
  const items: StoryboardItem[] = [];

  if (hasTable) {
    for (const line of lines) {
      if (line.includes('镜号')) continue;
      if (/^[\s|:-]+$/.test(line)) continue;
      const cells = line
        .split('|')
        .map((cell) => cell.trim())
        .filter(Boolean);
      if (cells.length > 0 && cells.every((cell) => /^[-:]+$/.test(cell)))
        continue;
      if (cells.length >= 3) {
        const shotNumber = parseInt(cells[0]) || items.length + 1;
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
  return items;
}
import StoryboardEditor from './StoryboardEditor';
import PromptSidebar from './PromptSidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, ListTodo, Lightbulb, Wand2, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface WorkflowStepProps {
  taskId: string;
  step: WorkflowStepType;
  stepNumber: number;
  prevStepOutput: string;
  onUpdate: (updates: Partial<WorkflowStepType>) => void;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
}

export default function WorkflowStep({
  taskId,
  step,
  onUpdate,
  storyboards,
  onUpdateStoryboards,
}: WorkflowStepProps) {
  const [input, setInput] = useState(step.input);
  const [output, setOutput] = useState(step.output);
  const [isCopied, setIsCopied] = useState(false);
  const [isPromptSidebarOpen, setIsPromptSidebarOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isStoryboardRawMode, setIsStoryboardRawMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 视图切换：有分镜内容时默认显示结果视图
  const [showResultView, setShowResultView] = useState(storyboards.length > 0);

  // Sync state
  useEffect(() => {
    setInput(step.input);
    setOutput(step.output);
  }, [step.input, step.output]);

  const handleInputChange = (value: string) => {
    setInput(value);
    onUpdate({ input: value, status: 'in-progress' });
  };

  const STYLE_CATEGORIES = [
    {
      name: '✨ 精选风格',
      styles: [
        {
          id: 'film_cinematic',
          label: '🎬 电影质感',
          description:
            '好莱坞电影级画面。真实摄影，强烈的景深、自然光感和胶片颗粒，适合剧情、悬疑、纪录片。',
          prompt:
            'Cinematic realism, photorealistic, 35mm lens, depth of field, natural lighting, film grain, color graded, 8k, movie scene',
        },
        {
          id: 'anime_shinkai',
          label: '🌤️ 新海诚风',
          description:
            '唯美治愈的日系动漫风格。强调光影、天空 render、细腻的云层和清新的色彩，适合治愈、情感、青春类内容。',
          prompt:
            'Makoto Shinkai style, high-quality anime art, vibrant sky, clouds, cinematic lighting, lens flare, emotional atmosphere, detailed background',
        },
        {
          id: 'pixar_3d',
          label: '🧸 皮克斯 3D',
          description:
            '迪士尼/皮克斯动画电影质感。角色圆润可爱，材质细腻，暖色调打光，适合亲子、叙事、轻松娱乐类。',
          prompt:
            'Pixar style 3D render, Disney animation style, cute characters, expressive, octane render, volumetric lighting, soft textures, 3d cartoon',
        },
        {
          id: 'epic_impasto',
          label: '🖌️ 史诗厚涂',
          description:
            '结合3D结构与2D手绘质感。笔触厚重，光影戏剧性强，画面极具史诗感和故事张力，类似顶级欧美动画剧集。',
          prompt:
            'Semi-realistic 3D animation style, hand-painted textures, thick brushstrokes, dramatic cinematic lighting, epic atmosphere, stylized realism, oil painting aesthetics, volumetric fog, high fidelity, arcane style aesthetic',
        },
        {
          id: 'cel_shading',
          label: '🎨 赛璐璐风',
          description:
            '鲜明的色块，清晰的轮廓线，高饱和度色彩，典型的日系二次元插画风格，适合活力、明快的内容。',
          prompt:
            'Cel shading, anime style, flat color, clean outlines, vibrant colors, hard shadows, 2D animation style, high quality illustration, japanese anime aesthetics',
        },
        {
          id: 'unreal_engine',
          label: '🎮 3A 游戏大作',
          description:
            '超写实游戏画面。极致的物理材质、光线追踪、动态天气，适合史诗、奇幻、动作类。',
          prompt:
            'Unreal Engine 5 render, AAA game screenshot, hyperrealistic, ray tracing, global illumination, detailed textures, 8k resolution, epic fantasy',
        },
        {
          id: 'tech_commercial',
          label: '📱 科技广告',
          description:
            '苹果/大疆风格产品广告。极简干净背景，冷色调，强调产品细节和高级感，适合数码、评测、科技资讯。',
          prompt:
            'High-tech commercial style, Apple aesthetic, clean background, studio lighting, sharp focus, minimalist, product photography, sleek design, 8k',
        },
        {
          id: 'documentary',
          label: '📹 纪实摄影',
          description:
            '真实新闻/纪录片风格。自然光，手持摄影感，强调真实性和临场感，适合新闻资讯、生活记录、Vlog。',
          prompt:
            'Documentary photography, raw style, natural lighting, shot on 35mm, candid moments, slight motion blur, street photography style',
        },
        {
          id: 'fashion_studio',
          label: '💃 时尚大片',
          description:
            '高端商业摄影。影棚布光，高对比度，干净利落，强调主体质感，适合美妆、时尚、产品展示。',
          prompt:
            'High fashion photography, studio lighting, clean background, sharp focus, professional color grading, vogue style, commercial advertisement',
        },
        {
          id: 'anime_retro',
          label: '📼 90s 复古动漫',
          description:
            '90年代赛璐璐风格。线条硬朗，赛博朋克或粉彩配色，适合怀旧、蒸汽波、情绪类内容。',
          prompt:
            '90s retro anime style, cel shading, vhs glitch effect, neon colors, sailor moon aesthetic, evangelion style, lo-fi vibes',
        },
        {
          id: 'chinese_ink',
          label: '🖌️ 水墨国风',
          description:
            '中国传统水墨画意境。留白、墨色晕染、山水意象，适合历史、古风、文化传播类。',
          prompt:
            'Traditional Chinese Ink Painting, watercolor style, ethereal atmosphere, ink wash, minimalist, zen aesthetics, calligraphy brush strokes',
        },
        {
          id: 'cyberpunk',
          label: '🌆 赛博朋克',
          description:
            '未来科幻。高对比度霓虹色（紫/青），雨夜城市，机械元素，适合科技、游戏、未来话题。',
          prompt:
            'Cyberpunk neon, futuristic city, rainy night, violet and teal lighting, high tech, blade runner aesthetic, glow effects, sci-fi concept art',
        },
        {
          id: 'claymation',
          label: '🧱 黏土动画',
          description:
            '手工黏土定格动画。有指纹痕迹和材质感，笨拙可爱，适合创意短片、手工DIY内容。',
          prompt:
            'Claymation style, handmade texture, stop-motion aesthetic, soft studio lighting, plasticine material, fingerprint details, aardman style',
        },
      ],
    },
  ];

  const [selectedStyle, setSelectedStyle] = useState(
    STYLE_CATEGORIES[0].styles[0].id,
  );

  const selectedStyleConfig = STYLE_CATEGORIES.flatMap((c) => c.styles).find(
    (s) => s.id === selectedStyle,
  );

  const getFullPrompt = () => {
    let stylePrompt = '';
    for (const cat of STYLE_CATEGORIES) {
      const found = cat.styles.find((s) => s.id === selectedStyle);
      if (found) {
        stylePrompt = found.prompt;
        break;
      }
    }

    // 生成风格指令区块
    // const styleInstruction = `**重要：请强制采用以下画面风格进行创作：**\n${stylePrompt}`;

    let finalBasePrompt = step.basePrompt;

    // 如果没有输入，直接返回空或基础提示词
    if (!input.trim()) return '';

    const stylePlaceholder = '[STYLE_INSTRUCTION]';
    if (finalBasePrompt.includes(stylePlaceholder)) {
      // 1. 优先替换专门设置的占位符
      finalBasePrompt = finalBasePrompt.replace(stylePlaceholder, stylePrompt);
    } else {
      // 2. 兜底：直接追加
      finalBasePrompt =
        finalBasePrompt + '\n\n' + `**画面风格要求：**\n${stylePrompt}`;
    }

    // 3. 注入用户输入
    const inputPlaceholder = '[USER_INPUT]';
    if (finalBasePrompt.includes(inputPlaceholder)) {
      finalBasePrompt = finalBasePrompt.replace(inputPlaceholder, input);
    } else {
      // 兜底：如果模板中没有占位符，还是追加在最后
      finalBasePrompt = finalBasePrompt + '\n' + input;
    }

    return finalBasePrompt.trim();
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    // 1. 复制提示词
    try {
      await navigator.clipboard.writeText(getFullPrompt());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }

    // 2. 调用 AI 模型
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: getFullPrompt(),
      });

      // 根据用户提供的示例，直接访问 result.text
      // 注意：这里假设 SDK 返回的结构符合用户提供的示例
      // 如果 SDK 返回的是 standard structure，可能需要 response.response.text()
      // 但根据用户提供的 import { GoogleGenAI } from "@google/genai" (新 SDK)，直接访问 .text 是可能的
      const text = response.text;

      if (text) {
        setOutput(text);
        onUpdate({ output: text, status: 'in-progress' });

        // 解析 AI 返回的分镜表格并更新 storyboards
        const parsedStoryboards = parseMarkdownTable(text);
        if (parsedStoryboards.length > 0) {
          onUpdateStoryboards(parsedStoryboards);
        }

        // 生成成功后自动切换到结果视图
        setShowResultView(true);
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetClick = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    setInput('');
    setOutput('');
    onUpdate({ input: '', output: '', status: 'pending' });
    onUpdateStoryboards([]);
    setResetDialogOpen(false);
    setShowResultView(false);
  };

  // 生成视图 - 创意输入 + 风格选择 + 生成按钮

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isGenerating ? (
        <div className="relative min-h-[500px] flex flex-col items-center justify-center animate-in fade-in duration-700">
          {/* 装饰性漂浮粒子 - 增加亮度与对比度 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/30 rounded-full blur-[140px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent/30 rounded-full blur-[160px] animate-pulse-slow" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-12">
            {/* 核心动画图标组 */}
            <div className="relative">
              <div className="absolute inset-[-40px] rounded-full border border-primary/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
              <div className="absolute inset-[-20px] rounded-full border border-primary/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />

              <div className="p-10 rounded-full bg-white/10 ring-1 ring-white/20 shadow-[0_0_80px_rgba(var(--primary),0.4)] relative backdrop-blur-md">
                <Wand2 className="w-16 h-16 text-white animate-[bounce_2s_infinite] drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/50 blur-3xl animate-pulse rounded-full" />
              </div>
            </div>

            {/* 动态内容描述区 */}
            <div className="text-center space-y-6 max-w-[450px]">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
                  正在捕捉灵感细节
                </h3>
                <p className="text-[14px] text-white/70 uppercase tracking-[0.4em] font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  AI Creative Director is active
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                {/* 极简发光进度条 */}
                <div className="w-56 h-[3px] bg-white/10 rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-[shimmer_2s_infinite] w-[50%]" />
                </div>

                {/* 纯文字状态轮播 - 强投影确保可读性 */}
                <div className="h-8 overflow-hidden relative w-full px-4">
                  <div className="animate-[slide-up_8s_infinite] flex flex-col items-center gap-0">
                    <span className="h-8 text-lg text-white font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                      正在尝试感知您的创意初衷...
                    </span>
                    <span className="h-8 text-lg text-white font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                      在生活碎片中寻找镜头共鸣...
                    </span>
                    <span className="h-8 text-lg text-white font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                      正在以同理心打磨角色对白...
                    </span>
                    <span className="h-8 text-lg text-white font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                      将真实的温度融入画面构图...
                    </span>
                    <span className="h-8 text-lg text-white font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                      为您生成触及人心的视觉分镜...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部微小提示 */}
          <div className="absolute bottom-12 left-0 w-full text-center">
            <span className="text-[12px] text-white/50 font-bold italic tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              "Great stories take a few seconds to breathe..."
            </span>
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes slide-up {
              0%, 15% { transform: translateY(0); }
              20%, 35% { transform: translateY(-32px); }
              40%, 55% { transform: translateY(-64px); }
              60%, 75% { transform: translateY(-96px); }
              80%, 95% { transform: translateY(-128px); }
              100% { transform: translateY(0); }
            }
            @keyframes shimmer {
              0% { transform: translateX(-150%); }
              100% { transform: translateX(250%); }
            }
          `,
            }}
          />
        </div>
      ) : showResultView && storyboards.length > 0 ? (
        <div className="relative w-full">
          <StoryboardEditor
            taskId={taskId}
            output={output}
            storyboards={storyboards}
            onUpdateStoryboards={onUpdateStoryboards}
            isRawMode={isStoryboardRawMode}
            setIsRawMode={setIsStoryboardRawMode}
            onBack={() => setShowResultView(false)}
            onReset={handleResetClick}
          />
        </div>
      ) : (
        <Card className="glass-card border-primary/20 ring-1 ring-primary/10 shadow-2xl relative overflow-hidden gap-0 py-0">
          {/* 顶部装饰 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          <CardHeader className="px-5 py-4 border-b border-white/5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-wide">
                  创意分镜生成
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                  输入想法，AI 自动生成分镜脚本、画面提示词和视频提示词
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {storyboards.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResultView(true)}
                  className="h-8 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 hover:bg-primary/10 rounded-lg px-3 transition-all"
                >
                  查看结果
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPromptSidebarOpen(true);
                }}
                className="h-8 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg px-3 transition-all"
              >
                <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                查看 System Prompt
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-6 space-y-6">
            {/* 1. 创意输入区域 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                输入创意
              </div>
              <Textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="例如：一个年轻人在下雨的城市街道上奔跑，突然回头看到了..."
                className="min-h-[140px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-white/20 resize-none rounded-xl p-4 text-sm leading-relaxed font-medium transition-all shadow-inner text-white"
              />
            </div>

            {/* 2. 风格选择区域 */}
            <div className="space-y-3">
              <Tabs defaultValue={STYLE_CATEGORIES[0].name} className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    选择风格
                  </div>

                  <TabsList className="h-9 bg-black/30 border border-white/5 p-1 rounded-xl flex justify-start overflow-x-auto no-scrollbar w-auto ml-4">
                    {STYLE_CATEGORIES.map((category) => (
                      <TabsTrigger
                        key={category.name}
                        value={category.name}
                        className="px-4 py-1.5 text-[10px] font-black rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 whitespace-nowrap"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-xl p-3 mt-3">
                  {STYLE_CATEGORIES.map((category) => (
                    <TabsContent
                      key={category.name}
                      value={category.name}
                      className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                    >
                      <div className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                        {category.styles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={cn(
                              'px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 border uppercase tracking-tighter flex items-center gap-1.5',
                              selectedStyle === style.id
                                ? 'bg-primary/20 text-primary border-primary/50 shadow-lg shadow-primary/5 scale-[1.02]'
                                : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white/60',
                            )}
                          >
                            {style.label.includes(' ') ? (
                              <>
                                <span className="text-xs">
                                  {style.label.split(' ')[0]}
                                </span>
                                <span>
                                  {style.label.split(' ').slice(1).join(' ')}
                                </span>
                              </>
                            ) : (
                              style.label
                            )}
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}

                  {/* 风格描述信息展示 */}
                  {selectedStyleConfig && (
                    <div className="mt-3 px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                      <div className="p-1.5 bg-primary/10 rounded-full mt-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-primary">
                            {selectedStyleConfig.label
                              .split(' ')
                              .slice(1)
                              .join(' ')}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-black/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Style Preview
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/70 leading-relaxed">
                          {selectedStyleConfig.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>

            {/* 3. 生成按钮区域 */}
            <div className="pt-4 border-t border-white/5 w-full">
              <Button
                onClick={handleGenerate}
                disabled={!input.trim() || isGenerating}
                className={cn(
                  'w-full h-14 rounded-xl text-sm font-black tracking-widest transition-all duration-300 shadow-lg uppercase relative overflow-hidden group',
                  input.trim() && !isGenerating
                    ? 'bg-gradient-to-r from-primary to-violet-600 text-white hover:scale-[1.01] hover:shadow-primary/25 border border-white/10'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isGenerating ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                      </span>
                      <span>正在进行 AI 创意构思...</span>
                    </div>
                  </>
                ) : isCopied ? (
                  <>
                    <Check className="w-5 h-5 mr-3" />
                    已复制提示词 (即将开始)
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-3" />✨ AI 一键生成影片分镜
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <PromptSidebar
        isOpen={isPromptSidebarOpen}
        onClose={() => setIsPromptSidebarOpen(false)}
        basePrompt={step.basePrompt}
        onSave={(newPrompt) => onUpdate({ basePrompt: newPrompt })}
      />

      {/* 重置确认对话框 */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重置</AlertDialogTitle>
            <AlertDialogDescription>
              确定要重置当前步骤吗？所有输入和生成结果将被清空。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              重置
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
