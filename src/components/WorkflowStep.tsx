import { useState, useEffect } from "react";
import { ai } from "@/lib/gemini";

import type {
  WorkflowStep as WorkflowStepType,
  StoryboardItem,
} from "../types";
import StoryboardEditor from "./StoryboardEditor";
import PromptSidebar from "./PromptSidebar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Check,
  RotateCcw,
  ListTodo,
  Lightbulb,
  Wand2,
  FileCode,
  LayoutGrid,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

  // Sync state
  useEffect(() => {
    setInput(step.input);
    setOutput(step.output);
  }, [step.input, step.output]);

  const handleInputChange = (value: string) => {
    setInput(value);
    onUpdate({ input: value, status: "in-progress" });
  };

  const STYLE_CATEGORIES = [
    {
      name: "🔥 热门推荐",
      styles: [
        {
          id: "anime",
          label: "🎬 写实动漫",
          description:
            "类似新海诚电影的高画质动漫风格。光影细腻、色彩清新、天空唯美，非常适合治愈系、情感类、剧情向的短视频。",
          prompt:
            "Realistic Anime Style, Makoto Shinkai aesthetic, high-quality anime illustration, cinematic lighting, detailed background, vibrant colors, lens flare",
        },
        {
          id: "chinese_ink",
          label: "🖌️ 水墨国风",
          description:
            "中国传统水墨画风格。留白意境、墨色晕染、山水意象，适合历史故事、传统文化、诗词歌赋类内容。",
          prompt:
            "Traditional Chinese Ink Painting, watercolor style, ethereal atmosphere, ink wash, minimalist, zen aesthetics, calligraphy brush strokes, ancient chinese style",
        },
        {
          id: "pixar",
          label: "🧸 皮克斯 3D",
          description:
            "迪士尼/皮克斯动画电影风格。角色生动可爱，材质细腻逼真，暖色调打光，适合亲子教育、叙事故事、轻松娱乐类内容。",
          prompt:
            "Pixar style 3D render, Disney animation style, cute characters, expressive, octane render, volumetric lighting, soft textures, 3d cartoon",
        },
        {
          id: "film",
          label: "📸 电影写实",
          description:
            "好莱坞大片质感。真实摄影风格，强调景深虚化、自然光感和胶片颗粒，适合悬疑、犯罪、纪录片或严肃剧情。",
          prompt:
            "Cinematic realism, photorealistic, 35mm lens, depth of field, natural lighting, film grain, color graded, 8k, movie scene",
        },
      ],
    },
    {
      name: "🎨 插画艺术",
      styles: [
        {
          id: "flat",
          label: "📐 扁平插画",
          description:
            "现代矢量插画风格。线条极简，色块鲜明，无多余细节，非常适合知识科普、商业演示、概念解释类内容。",
          prompt:
            "Flat illustration, vector art, minimalist, bold colors, clean lines, corporate memphis style, geometric shapes, behance style",
        },
        {
          id: "watercolor",
          label: "💧 梦幻水彩",
          description:
            "柔和的水彩晕染效果。色彩淡雅，边缘柔和，具有艺术感和梦幻氛围，适合情感独白、散文诗歌。",
          prompt:
            "Watercolor painting, soft edges, artistic style, wet on wet, pastel colors, dreamy atmosphere, paper texture, hand painted",
        },
        {
          id: "sketch",
          label: "✏️ 铅笔素描",
          description:
            "黑白铅笔手绘风格。朴素自然，有岁月的痕迹，适合回忆录、手账风、怀旧故事。",
          prompt:
            "Pencil sketch, graphite drawing, hand drawn, rough lines, shading, black and white, sketchbook style",
        },
      ],
    },
    {
      name: "🧊 3D与材质",
      styles: [
        {
          id: "clay",
          label: "🧱 黏土动画",
          description:
            "手工黏土定格动画质感。有指纹痕迹和材质感，显得笨拙可爱，适合创意短片、定格动画。",
          prompt:
            "Claymation style, handmade texture, stop-motion aesthetic, soft studio lighting, plasticine material, fingerprint details, aardman style",
        },
        {
          id: "cyber",
          label: "🌆 赛博朋克",
          description:
            "未来科幻风格。高对比度霓虹色（紫/青），雨夜城市，机械元素，适合科技资讯、未来预言、酷炫展示。",
          prompt:
            "Cyberpunk neon, futuristic city, rainy night, violet and teal lighting, high tech, blade runner aesthetic, glow effects, sci-fi",
        },
        {
          id: "origami",
          label: "📄 折纸艺术",
          description:
            "纸张折叠效果。几何切面鲜明，光影硬朗，有一种独特的形式美感，适合寓言故事、创意展示。",
          prompt:
            "Origami style, folded paper textures, sharp creases, clean geometric look, paper craft, 3d render, studio lighting",
        },
      ],
    },
    {
      name: "📷 摄影胶片",
      styles: [
        {
          id: "vintage",
          label: "🎞️ 复古胶片",
          description:
            "90年代老照片质感。色调偏暖，有褪色感和噪点，充满怀旧情绪，适合讲述过去的故事。",
          prompt:
            "Vintage film photography, Kodak Portra 400, warm tones, slight light leak, nostalgic, film grain, retro aesthetic, 90s vibes",
        },
        {
          id: "noir",
          label: "🕵️ 黑色电影",
          description:
            "高反差黑白摄影。光影对比强烈，营造神秘、压抑或悬疑的氛围，适合侦探故事、惊悚片。",
          prompt:
            "Film Noir style, black and white, dramatic shadows, moody lighting, silhouette, mystery, contrast, detective movie",
        },
      ],
    },
  ];

  const [selectedStyle, setSelectedStyle] = useState(
    STYLE_CATEGORIES[0].styles[0].id
  );

  const selectedStyleConfig = STYLE_CATEGORIES.flatMap((c) => c.styles).find(
    (s) => s.id === selectedStyle
  );

  const getFullPrompt = () => {
    let stylePrompt = "";
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
    if (!input.trim()) return "";

    const stylePlaceholder = "[STYLE_INSTRUCTION]";
    if (finalBasePrompt.includes(stylePlaceholder)) {
      // 1. 优先替换专门设置的占位符
      finalBasePrompt = finalBasePrompt.replace(stylePlaceholder, stylePrompt);
    } else {
      // 2. 兜底：直接追加
      finalBasePrompt =
        finalBasePrompt + "\n\n" + `**画面风格要求：**\n${stylePrompt}`;
    }

    // 3. 注入用户输入
    const inputPlaceholder = "[USER_INPUT]";
    if (finalBasePrompt.includes(inputPlaceholder)) {
      finalBasePrompt = finalBasePrompt.replace(inputPlaceholder, input);
    } else {
      // 兜底：如果模板中没有占位符，还是追加在最后
      finalBasePrompt = finalBasePrompt + "\n" + input;
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
      console.error("复制失败:", err);
    }

    // 2. 调用 AI 模型
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: getFullPrompt(),
      });

      // 根据用户提供的示例，直接访问 result.text
      // 注意：这里假设 SDK 返回的结构符合用户提供的示例
      // 如果 SDK 返回的是 standard structure，可能需要 response.response.text()
      // 但根据用户提供的 import { GoogleGenAI } from "@google/genai" (新 SDK)，直接访问 .text 是可能的
      const text = response.text;

      if (text) {
        setOutput(text);
        onUpdate({ output: text, status: "in-progress" });
      }
    } catch (error) {
      console.error("AI 生成失败:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetClick = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    setInput("");
    setOutput("");
    onUpdate({ input: "", output: "", status: "pending" });
    onUpdateStoryboards([]);
    setResetDialogOpen(false);
  };

  // 始终展开，因为是单页面模式
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass-card border-primary/20 ring-1 ring-primary/10 shadow-2xl relative overflow-hidden">
        {/* 顶部装饰 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

        <CardHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">
                创意分镜生成
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                输入你的想法，AI 将自动为你生成分镜脚本、画面提示词和视频提示词
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

            {step.status !== "pending" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetClick}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {/* 1. 创意输入区域 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              输入创意
            </div>
            <Textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="例如：一个年轻人在下雨的城市街道上奔跑，突然回头看到了..."
              className="min-h-[120px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-white/20 resize-none rounded-xl p-5 text-sm leading-relaxed font-medium transition-all shadow-inner text-white"
            />
          </div>

          {/* 2. 风格选择区域 */}
          <div className="space-y-4">
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

              <div className="bg-black/20 border border-white/5 rounded-2xl p-4 mt-4">
                {STYLE_CATEGORIES.map((category) => (
                  <TabsContent
                    key={category.name}
                    value={category.name}
                    className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                  >
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      {category.styles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all duration-300 border uppercase tracking-tighter flex items-center gap-2",
                            selectedStyle === style.id
                              ? "bg-primary/20 text-primary border-primary/50 shadow-lg shadow-primary/5 scale-[1.02]"
                              : "bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white/60"
                          )}
                        >
                          {style.label.includes(" ") ? (
                            <>
                              <span className="text-xs">
                                {style.label.split(" ")[0]}
                              </span>
                              <span>
                                {style.label.split(" ").slice(1).join(" ")}
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
                  <div className="mt-4 px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                    <div className="p-1.5 bg-primary/10 rounded-full mt-0.5">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary">
                          {selectedStyleConfig.label
                            .split(" ")
                            .slice(1)
                            .join(" ")}
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
          <div className="pt-6 border-t border-white/5 w-full">
            <Button
              onClick={handleGenerate}
              disabled={!input.trim() || isGenerating}
              className={cn(
                "w-full h-14 rounded-xl text-sm font-black tracking-widest transition-all duration-300 shadow-lg uppercase relative overflow-hidden group",
                input.trim() && !isGenerating
                  ? "bg-gradient-to-r from-primary to-violet-600 text-white hover:scale-[1.01] hover:shadow-primary/25 border border-white/10"
                  : "bg-muted text-muted-foreground"
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

          {/* 4. 分镜输出区域 */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                分镜结果
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStoryboardRawMode(!isStoryboardRawMode)}
                className={cn(
                  "h-8 px-3 text-[10px] font-bold uppercase tracking-wider transition-all border",
                  isStoryboardRawMode
                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                    : "text-muted-foreground border-transparent hover:bg-white/5 hover:text-foreground"
                )}
              >
                {isStoryboardRawMode ? (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                    预览视图
                  </>
                ) : (
                  <>
                    <FileCode className="w-3.5 h-3.5 mr-2" />
                    源码编辑
                  </>
                )}
              </Button>
            </div>

            {isGenerating ? (
              <div className="h-[400px] w-full rounded-xl border border-white/5 bg-black/20 flex flex-col items-center justify-center gap-6 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent skew-y-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />

                <div className="relative z-10 p-6 rounded-full bg-primary/10 ring-1 ring-primary/20">
                  <Wand2 className="w-10 h-10 text-primary animate-[spin_3s_linear_infinite]" />
                </div>

                <div className="space-y-2 text-center relative z-10">
                  <h3 className="text-base font-bold text-white tracking-wide">
                    正在创作分镜脚本
                  </h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-white/40">分析场景描述...</p>
                    <p className="text-xs text-white/40">构思画面构图...</p>
                    <p className="text-xs text-white/40">生成标准分镜...</p>
                  </div>
                </div>
              </div>
            ) : (
              <StoryboardEditor
                taskId={taskId}
                output={output}
                storyboards={storyboards}
                onUpdateStoryboards={onUpdateStoryboards}
                isRawMode={isStoryboardRawMode}
                setIsRawMode={setIsStoryboardRawMode}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <PromptSidebar
        isOpen={isPromptSidebarOpen}
        onClose={() => setIsPromptSidebarOpen(false)}
        basePrompt={step.basePrompt}
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
