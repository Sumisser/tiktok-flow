import { useState, useEffect } from "react";
import type {
  WorkflowStep as WorkflowStepType,
  StoryboardItem,
} from "../types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StoryboardEditor from "./StoryboardEditor";
import VideoGenerationView from "./VideoGenerationView";
import PromptSidebar from "./PromptSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronDown,
  Check,
  RotateCcw,
  ArrowLeftRight,
  FileText,
  Bot,
  Eye,
  Edit2,
  ListTodo,
  ClipboardPaste,
  CheckCircle2,
  CircleDashed,
  Clock,
  Lightbulb,
  Image as ImageIcon,
  Wand2,
  FileCode,
  LayoutGrid,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  stepNumber,
  prevStepOutput,
  onUpdate,
  storyboards,
  onUpdateStoryboards,
}: WorkflowStepProps) {
  const [input, setInput] = useState(step.input);
  const [output, setOutput] = useState(step.output);
  const [isExpanded, setIsExpanded] = useState(step.status !== "completed");
  const [isCopied, setIsCopied] = useState(false);
  const [isPromptSidebarOpen, setIsPromptSidebarOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isStoryboardRawMode, setIsStoryboardRawMode] = useState(false);

  // Sync state
  useEffect(() => {
    setInput(step.input);
    setOutput(step.output);
  }, [step.input, step.output]);

  // 自动填充上一步的输出作为当前步骤的输入
  useEffect(() => {
    if (prevStepOutput && !input && stepNumber > 1) {
      handleInputChange(prevStepOutput);
    }
  }, [prevStepOutput]);

  const handleInputChange = (value: string) => {
    setInput(value);
    onUpdate({ input: value, status: "in-progress" });
  };

  const handleOutputChange = (value: string) => {
    setOutput(value);
    onUpdate({ output: value, status: value ? "completed" : "in-progress" });
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
    const styleInstruction = `**重要：请强制采用以下画面风格进行创作：**\n${stylePrompt}`;

    if (step.type === "script") {
      let finalBasePrompt = step.basePrompt;

      const placeholder = "**[画面风格指令将在此处由引擎自动注入]**";
      if (finalBasePrompt.includes(placeholder)) {
        // 1. 优先替换专门设置的占位符
        finalBasePrompt = finalBasePrompt.replace(
          placeholder,
          styleInstruction
        );
      } else {
        // 2. 兼容逻辑：检测并替换旧版硬编码的“写实动漫”规则块
        const oldStyleBlockRegex =
          /采用 \*\*写实动漫风格[\s\S]*?(?=\d\. \*\*主提示词)/;
        if (oldStyleBlockRegex.test(finalBasePrompt)) {
          finalBasePrompt = finalBasePrompt.replace(
            oldStyleBlockRegex,
            `采用以下指定的画面风格：\n\n${styleInstruction}\n\n`
          );
        } else {
          // 3. 兜底：如果既没有占位符也不是旧版，则直接追加
          finalBasePrompt = finalBasePrompt + "\n\n" + styleInstruction;
        }
      }

      // 只依赖于上一步输出 + 已经融合了风格的 BasePrompt
      return (finalBasePrompt + "\n\n" + (prevStepOutput || "")).trim();
    }
    const currentInput = input || "";
    return (step.basePrompt + "\n\n" + currentInput).trim();
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(getFullPrompt());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleMarkComplete = () => {
    if (output) {
      onUpdate({ status: "completed" });
      setIsExpanded(false);
    }
  };

  const handleResetClick = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    setInput("");
    setOutput("");
    onUpdate({ input: "", output: "", status: "pending" });
    setIsExpanded(true);
    setResetDialogOpen(false);
  };

  return (
    <div className="relative pb-16 last:pb-4 group">
      <Collapsible
        open={
          step.type === "idea" || step.type === "script" ? true : isExpanded
        }
        onOpenChange={
          step.type === "idea" || step.type === "script"
            ? () => {}
            : setIsExpanded
        }
      >
        <Card
          className={cn(
            "transition-all duration-500 overflow-hidden relative",
            step.type === "idea" || step.type === "script" || isExpanded
              ? "glass-card border-primary/20 ring-1 ring-primary/10 shadow-2xl"
              : "bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 shadow-sm"
          )}
        >
          {/* AI 扫描线动画 (仅在展开时显示) */}
          {(step.type === "idea" || step.type === "script" || isExpanded) && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-20 animate-[scan_3s_linear_infinite]" />
          )}

          <CollapsibleTrigger asChild>
            <div
              className={cn(
                "p-5 flex items-center justify-between group/header select-none",
                step.type !== "idea" &&
                  step.type !== "script" &&
                  "cursor-pointer"
              )}
            >
              <div className="flex items-center gap-5">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                    step.type === "idea" || step.type === "script" || isExpanded
                      ? "bg-primary text-primary-foreground shadow-primary/25 scale-110"
                      : "bg-white/5 text-white/40 group-hover/header:bg-white/10 group-hover/header:text-white/60"
                  )}
                >
                  {step.type === "idea" && <Lightbulb className="w-6 h-6" />}
                  {step.type === "script" && <FileText className="w-6 h-6" />}
                  {step.type === "storyboard" && (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-black flex items-center gap-3">
                    <span
                      className={cn(
                        "truncate transition-colors duration-300",
                        step.type === "idea" ||
                          step.type === "script" ||
                          isExpanded
                          ? "text-primary text-neon"
                          : "text-foreground group-hover/header:text-primary transition-colors"
                      )}
                    >
                      {step.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPromptSidebarOpen(true);
                      }}
                      className="h-7 text-[10px] font-black tracking-widest text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg px-2.5 transition-all uppercase"
                    >
                      <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                      引擎
                    </Button>
                    <div className="flex items-center">
                      {step.status === "completed" && (
                        <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Done
                          </span>
                        </div>
                      )}
                      {step.status === "in-progress" && (
                        <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                          <CircleDashed className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Doing
                          </span>
                        </div>
                      )}
                      {step.status === "pending" && (
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            Wait
                          </span>
                        </div>
                      )}
                    </div>
                  </h3>
                  {step.type !== "idea" &&
                    step.type !== "script" &&
                    !isExpanded &&
                    output && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-medium tracking-tight">
                        {output.substring(0, 150)}...
                      </p>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {step.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetClick();
                    }}
                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
                {step.type !== "idea" && step.type !== "script" && (
                  <div
                    className={cn(
                      "p-1.5 rounded-xl bg-black/20 border border-white/10 transition-all duration-500",
                      isExpanded
                        ? "rotate-0 bg-primary/10 border-primary/20 text-primary"
                        : "-rotate-90"
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent
              className={cn(
                "p-6 pt-0 animate-in fade-in slide-in-from-top-4 duration-500",
                step.type === "script" ? "space-y-4" : "space-y-8"
              )}
            >
              {/* 第一步或第三步显示配置部分 */}
              {step.type !== "script" && (
                <div className="space-y-6">
                  {step.type !== "idea" && (
                    <div className="flex items-center justify-between border-b border-border/50 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                          <Edit2 className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em]">
                            模块-01
                          </span>
                          <p className="text-xs font-bold text-foreground">
                            输入参数
                          </p>
                        </div>
                      </div>
                      {prevStepOutput && !input && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInputChange(prevStepOutput)}
                          className="h-9 text-[11px] font-bold text-primary border-primary/30 hover:bg-primary/10 rounded-xl px-4 transition-all shadow-lg shadow-primary/5"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5 mr-2" />
                          连接上一步输出
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="relative group/input">
                    <Textarea
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={
                        stepNumber === 1
                          ? "请输入你的想法、剧本主题或原始素材内容..."
                          : "请输入内容或在此基础上进行调整..."
                      }
                      className={cn(
                        "bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-white/30 resize-none rounded-2xl p-6 text-sm leading-relaxed font-medium transition-all shadow-inner text-white",
                        step.type === "idea" ? "min-h-[100px]" : "min-h-[160px]"
                      )}
                    />
                  </div>

                  {/* 动作栏：生成提示词 */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleCopyPrompt}
                      disabled={
                        step.type === "idea"
                          ? !input
                          : !input && !prevStepOutput
                      }
                      className={cn(
                        "h-10 px-6 rounded-xl text-xs font-black tracking-widest transition-all duration-300 shadow-lg uppercase",
                        input || (step.type !== "idea" && prevStepOutput)
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          生成 AI 提示词
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* 第一步或第三步显示 AI 交互部分 */}
              {step.type === "idea" && (
                <div className="space-y-6">
                  {step.type !== "idea" ? (
                    <>
                      <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                        <div className="p-2 rounded-lg bg-accent/10 text-accent border border-accent/20">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black text-primary/70 uppercase tracking-[0.3em]">
                            模块-02
                          </span>
                          <p className="text-xs font-bold text-foreground">
                            AI 执行输出
                          </p>
                        </div>
                      </div>

                      <Tabs defaultValue="edit" className="w-full">
                        <div className="flex items-center justify-between mb-4">
                          <TabsList className="bg-black/20 border border-white/10 h-11 p-1 rounded-xl">
                            <TabsTrigger
                              value="edit"
                              className="text-xs font-black h-9 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm decoration-transparent uppercase tracking-wider transition-all"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              编辑器
                            </TabsTrigger>
                            <TabsTrigger
                              value="preview"
                              className="text-xs font-black h-9 px-6 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm uppercase tracking-wider text-white/40 data-[state=active]:text-white"
                              disabled={!output}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              预览
                            </TabsTrigger>
                          </TabsList>

                          <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground font-black italic tracking-[0.2em] uppercase">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary),0.5)]" />
                            实时 AI 同步中
                          </div>
                        </div>

                        <TabsContent
                          value="edit"
                          className="mt-0 ring-offset-background outline-none"
                        >
                          <Textarea
                            value={output}
                            onChange={(e) => handleOutputChange(e.target.value)}
                            placeholder="在此粘贴 AI 的响应内容..."
                            className="min-h-[260px] bg-black/20 border-white/10 focus:border-accent/50 focus:ring-accent/20 placeholder:text-white/30 resize-none font-mono rounded-2xl p-8 text-sm leading-relaxed text-white"
                          />
                        </TabsContent>

                        <TabsContent value="preview" className="mt-0">
                          <div className="w-full min-h-[260px] p-10 bg-white rounded-2xl border border-border shadow-inner overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                              <Bot className="w-40 h-40" />
                            </div>
                            <div className="prose prose-sm max-w-none relative z-10">
                              <Markdown remarkPlugins={[remarkGfm]}>
                                {output}
                              </Markdown>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                          AI 响应数据
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) handleOutputChange(text);
                            } catch (err) {
                              console.error("Paste failed", err);
                            }
                          }}
                          className="h-6 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/10 px-3 rounded-lg transition-all"
                        >
                          <ClipboardPaste className="w-3 h-3 mr-1.5" />
                          {output ? "覆盖粘贴" : "粘贴内容"}
                        </Button>
                      </div>

                      <div className="h-24 bg-black/20 border border-white/5 rounded-lg p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                        {output ? (
                          <p className="text-xs font-mono text-white/70 whitespace-pre-wrap leading-relaxed break-all">
                            {output}
                          </p>
                        ) : (
                          <p className="text-xs text-white/20 italic select-none flex items-center h-full justify-center">
                            等待粘贴 AI 响应内容...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 第二步专属布局 */}
              {step.type === "script" && (
                <div className="space-y-4 pt-2">
                  {/* 风格选择标签 - 使用 Tab 切换 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black text-primary/70 uppercase tracking-[0.2em]">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        视觉风格定制
                      </div>
                      <div className="text-[9px] font-bold text-white/20 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-md">
                        {STYLE_CATEGORIES.length} 个分类
                      </div>
                    </div>

                    <Tabs
                      defaultValue={STYLE_CATEGORIES[0].name}
                      className="w-full"
                    >
                      <div className="relative mb-4">
                        <TabsList className="w-full h-9 bg-black/40 border border-white/5 p-1 rounded-xl flex justify-start overflow-x-auto no-scrollbar mask-fade-right">
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
                                    : "bg-black/20 text-white/30 border-white/5 hover:border-white/10 hover:text-white/60"
                                )}
                              >
                                {style.label.includes(" ") ? (
                                  <>
                                    <span className="text-xs">
                                      {style.label.split(" ")[0]}
                                    </span>
                                    <span>
                                      {style.label
                                        .split(" ")
                                        .slice(1)
                                        .join(" ")}
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
                    </Tabs>
                    {/* 风格描述信息展示 */}
                    {selectedStyleConfig && (
                      <div className="mt-3 px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
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

                  {/* 动作栏：视图切换 & 一键生成 */}
                  <div className="flex justify-between items-center pt-2">
                    {/* 左侧：视图切换 */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setIsStoryboardRawMode(!isStoryboardRawMode)
                        }
                        className={cn(
                          "h-9 px-3 text-xs font-bold uppercase tracking-wider transition-all border",
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

                    {/* 右侧：一键生成 */}
                    <Button
                      onClick={handleCopyPrompt}
                      className={cn(
                        "h-10 px-6 rounded-xl text-xs font-black tracking-widest transition-all duration-300 shadow-lg uppercase",
                        prevStepOutput
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Wand2 className="w-4 h-4 mr-2" />
                      )}
                      {isCopied ? "已生成" : "一键生成提示词"}
                    </Button>
                  </div>

                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <StoryboardEditor
                      taskId={taskId}
                      output={output || prevStepOutput}
                      storyboards={storyboards}
                      onUpdateStoryboards={onUpdateStoryboards}
                      isRawMode={isStoryboardRawMode}
                      setIsRawMode={setIsStoryboardRawMode}
                    />
                  </div>
                </div>
              )}

              {/* 第三步专属布局 (Video Generation) */}
              {step.type === "storyboard" && (
                <div className="pt-2">
                  <VideoGenerationView
                    storyboards={storyboards}
                    onUpdateStoryboards={onUpdateStoryboards}
                  />
                </div>
              )}

              {/* 操作按钮部分 */}
              {output && step.status !== "completed" && (
                <div className="pt-8 transition-all animate-in slide-in-from-bottom-4">
                  <Button
                    onClick={handleMarkComplete}
                    className="w-full h-16 rounded-2xl text-[16px] font-black shadow-xl shadow-primary/20 bg-gradient-to-r from-primary via-primary to-accent hover:shadow-primary/30 transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] gap-4 uppercase border-t border-white/20"
                  >
                    <Check className="w-6 h-6 border-2 border-primary-foreground rounded-full p-0.5" />
                    存入工作流
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
