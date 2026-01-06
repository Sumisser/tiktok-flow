import { useState, useEffect } from "react";
import type {
  WorkflowStep as WorkflowStepType,
  StoryboardItem,
} from "../types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StoryboardEditor from "./StoryboardEditor";
import PromptSidebar from "./PromptSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronDown,
  Copy,
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

  // Sync state
  useEffect(() => {
    setInput(step.input);
    setOutput(step.output);
  }, [step.input, step.output]);

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
      name: "热门推荐",
      styles: [
        { id: "anime", label: "🎬 写实动漫", prompt: "Realistic Anime Style, Makoto Shinkai aesthetic, high-quality anime illustration, cinematic lighting" },
        { id: "3d", label: "🧊 3D 渲染", prompt: "3D render, Pixar/Disney style, C4D, Octane render, volumetric lighting, soft shadows" },
        { id: "film", label: "📸 电影写实", prompt: "Cinematic realism, photorealistic, 35mm lens, depth of field, natural lighting, grain" },
        { id: "ghibli", label: "🍃 吉卜力", prompt: "Studio Ghibli style, hand-drawn illustration, lush nature, nostalgic watercolor textures" },
        { id: "cyber", label: "🌆 赛博霓虹", prompt: "Cyberpunk neon, futuristic city, rainy night, violet and teal lighting, high tech" },
      ]
    },
    {
      name: "动画次元",
      styles: [
        { id: "shinkai", label: "✨ 新海诚", prompt: "Makoto Shinkai style, breathtaking sky, cinematic lighting, lens flare, hyper-detailed backgrounds" },
        { id: "niji", label: "🌈 Niji 6", prompt: "Niji style version 6, cute, expressive, stylized anime, vibrant colors, clean lines" },
        { id: "manga", label: "🖋️ 黑白漫画", prompt: "B&W Manga style, pen and ink, high contrast, speed lines, expressive hatching" },
        { id: "disney2d", label: "🏰 迪士尼 2D", prompt: "Classic Disney 2D animation style, hand-drawn, expressive characters, magical atmosphere" },
        { id: "spiderman", label: "🕷️ 蜘蛛侠元宇宙", prompt: "Into the Spider-Verse style, halftone patterns, chromatic aberration, comic book aesthetics" },
        { id: "retro_anime", label: "📺 90s 复古番", prompt: "90s retro anime style, lo-fi aesthetic, VHS grain, muted colors, classic cel shaded" },
      ]
    },
    {
      name: "数字材质",
      styles: [
        { id: "clay", label: "🧸 黏土动画", prompt: "Claymation style, handmade texture, stop-motion aesthetic, soft studio lighting" },
        { id: "ue5", label: "🎮 虚幻引擎", prompt: "Unreal Engine 5 render, ray tracing, cinematic game environment, high fidelity" },
        { id: "voxel", label: "📦 体素艺术", prompt: "Voxel art, Minecraft style, 3D pixel design, vibrant blocky textures" },
        { id: "poly", label: "📐 低多边形", prompt: "Low poly art style, geometric, clean edges, artistic lighting" },
        { id: "paper", label: "✂️ 剪纸拼贴", prompt: "Paper cut art, layered paper texture, handcrafted look, soft shadows, 3D paper craft" },
        { id: "glass", label: "💎 磨砂玻璃", prompt: "Frosted glass aesthetic, glassmorphism, transparent layers, soft refractions, elegant" },
        { id: "origami", label: "� 折纸艺术", prompt: "Origami style, folded paper textures, sharp creases, clean geometric look" },
      ]
    },
    {
      name: "专业摄影",
      styles: [
        { id: "vintage", label: "🎞️ 复古胶片", prompt: "Vintage film photography, Kodak Portra 400, warm tones, slight light leak" },
        { id: "polaroid", label: "🖼️ 拍立得", prompt: "Polaroid photography style, instant film look, washed out colors, vintage border" },
        { id: "noir", label: "� 黑色电影", prompt: "Film Noir style, black and white, dramatic shadows, moody lighting, smoke" },
        { id: "lomo", label: "🎨 Lomo 摄影", prompt: "Lomography style, oversaturated colors, vignette, high contrast, artistic blur" },
        { id: "portra", label: "👤 柔焦人像", prompt: "Professional portrait photography, shallow depth of field, soft skin tones, catching light in eyes" },
        { id: "infra", label: "❄️ 红外摄影", prompt: "Infrared photography, white foliage, dark sky, surreal ethereal landscape" },
      ]
    },
    {
      name: "创意镜头",
      styles: [
        { id: "drone", label: "🚁 航拍视角", prompt: "Aerial photography, drone view, high angle, vast landscape, cinematic scope" },
        { id: "macro", label: "🔍 微距世界", prompt: "Macro photography, extreme detail, blurry background, sharp focus, droplets, textures" },
        { id: "tilt", label: "🧸 移轴摄影", prompt: "Tilt-shift photography, miniature model effect, blurred top and bottom, vibrant colors" },
        { id: "fisheye", label: "👁️ 鱼眼镜头", prompt: "Fisheye lens perspective, distorted wide angle, spherical view, unique artistic look" },
        { id: "long_exp", label: "� 长曝光", prompt: "Long exposure photography, light trails, silky water, motion blur, nighttime city lights" },
        { id: "silhouete", label: "👤 剪影艺术", prompt: "Silhouette photography, dark subject against bright light, high contrast, golden hour" },
      ]
    },
    {
      name: "古典艺术",
      styles: [
        { id: "oil", label: "🎨 古典油画", prompt: "Classic oil painting, thick brushstrokes, impasto, dramatic lighting, Rembrandt aesthetic" },
        { id: "watercolor", label: "🖌️ 柔美水彩", prompt: "Watercolor illustration, soft bleeding colors, paper texture, delicate details" },
        { id: "ink", label: "�️ 水墨意境", prompt: "Traditional Chinese ink wash, minimalist, elegant brushwork, ethereal atmosphere" },
        { id: "ukiyo", label: "🌊 浮世绘", prompt: "Ukiyo-e style, woodblock print, traditional Japanese art, flat colors, bold outlines" },
        { id: "statue", label: "🗿 大理石像", prompt: "Neoclassical marble sculpture style, smooth white texture, dramatic museum lighting" },
        { id: "fresco", label: "⛪ 壁画艺术", prompt: "Ancient fresco painting style, weathered texture, historical aesthetic, mural feel" },
      ]
    },
    {
      name: "绘本插画",
      styles: [
        { id: "pencil", label: "✏️ 铅笔素描", prompt: "Pencil sketch, graphite texture, cross-hatching, artistic hand-drawn look" },
        { id: "gouache", label: "🎨 设色粉彩", prompt: "Gouache painting style, vibrant opaque colors, matte finish, artistic illustration" },
        { id: "crayon", label: "🖍️ 蜡笔涂鸦", prompt: "Crayon drawing, childlike texture, rough strokes, vibrant and playful" },
        { id: "comic", label: "💥 美漫风格", prompt: "Western comic book style, bold ink lines, Ben-Day dots, high action feel" },
        { id: "pop", label: "� 波普艺术", prompt: "Pop art, Andy Warhol style, bold colors, halftone patterns, high contrast" },
        { id: "fairytale", label: "🧚 梦幻绘本", prompt: "Fairytale book illustration, whimsical, soft glow, magical storytelling aesthetic" },
      ]
    },
    {
      name: "科幻潮流",
      styles: [
        { id: "vapor", label: "🌈 蒸汽波", prompt: "Vaporwave aesthetic, 80s retro, pastel colors, glitch art, surreal neon" },
        { id: "synth", label: "🎹 赛博合成", prompt: "Synthwave style, retro-futuristic, wireframe sun, chrome textures, dark purple" },
        { id: "glitch", label: "📺 故障艺术", prompt: "Glitch art, digital noise, chromatic aberration, distorted scanlines" },
        { id: "punk", label: "⚙️ 蒸汽朋克", prompt: "Steampunk aesthetic, brass gears, Victorian era, industrial, sepia tones" },
        { id: "hologram", label: "✨ 全息投影", prompt: "Holographic projection, glowing blue lines, semi-transparent, futuristic interface look" },
        { id: "biopunk", label: "🧬 生物朋克", prompt: "Biopunk aesthetic, organic technology, glowing neon veins, surreal fusion" },
      ]
    },
    {
      name: "极简设计",
      styles: [
        { id: "minimal", label: "⬜ 极简主义", prompt: "Minimalist design, clean lines, simple shapes, monochromatic, significant negative space" },
        { id: "flat", label: "📏 扁平矢量", prompt: "Flat design illustration, vector art, modern corporate style, clean and professional" },
        { id: "ios", label: "🍎 现代移动", prompt: "Modern app interface aesthetic, clean glassmorphism, soft gradients, iOS style" },
        { id: "bauhaus", label: "📐 包豪斯", prompt: "Bauhaus style, geometric shapes, primary colors, architectural composition" },
        { id: "abstract", label: "🌀 抽象表现", prompt: "Abstract expressionism, organic shapes, fluid composition, artistic and conceptual" },
      ]
    }
  ];

  const [selectedStyle, setSelectedStyle] = useState(STYLE_CATEGORIES[0].styles[0].id);

  const getFullPrompt = () => {
    let stylePrompt = "";
    for (const cat of STYLE_CATEGORIES) {
      const found = cat.styles.find(s => s.id === selectedStyle);
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
        finalBasePrompt = finalBasePrompt.replace(placeholder, styleInstruction);
      } else {
        // 2. 兼容逻辑：检测并替换旧版硬编码的“写实动漫”规则块
        const oldStyleBlockRegex = /采用 \*\*写实动漫风格[\s\S]*?(?=\d\. \*\*主提示词)/;
        if (oldStyleBlockRegex.test(finalBasePrompt)) {
          finalBasePrompt = finalBasePrompt.replace(oldStyleBlockRegex, `采用以下指定的画面风格：\n\n${styleInstruction}\n\n`);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "in-progress":
        return "进行中";
      case "pending":
        return "待处理";
      default:
        return status;
    }
  };

  return (
    <div className="relative pb-16 last:pb-4 group">

      <Collapsible
        open={(step.type === "idea" || step.type === "script") ? true : isExpanded}
        onOpenChange={(step.type === "idea" || step.type === "script") ? () => {} : setIsExpanded}
      >
        <Card
          className={cn(
            "transition-all duration-500 overflow-hidden relative",
            (step.type === "idea" || step.type === "script" || isExpanded)
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
                (step.type !== "idea" && step.type !== "script") && "cursor-pointer"
              )}
            >
              <div className="flex items-center gap-5">
                <span className="text-3xl filter drop-shadow-lg opacity-80 group-hover/header:opacity-100 transition-all duration-500 transform group-hover/header:scale-110">
                  {step.title.split(" ")[0]}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-black flex items-center gap-3">
                    <span
                      className={cn(
                        "truncate transition-colors duration-300",
                        (step.type === "idea" || step.type === "script" || isExpanded)
                          ? "text-primary text-neon"
                          : "text-foreground group-hover/header:text-primary transition-colors"
                      )}
                    >
                      {step.title.split(" ").slice(1).join(" ")}
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
                          <span className="text-[10px] font-black uppercase tracking-widest">Done</span>
                        </div>
                      )}
                      {step.status === "in-progress" && (
                        <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                          <CircleDashed className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Doing</span>
                        </div>
                      )}
                      {step.status === "pending" && (
                        <div className="flex items-center gap-1.5 text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md border border-border">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Wait</span>
                        </div>
                      )}
                    </div>
                  </h3>
                  {step.type !== "idea" && step.type !== "script" && !isExpanded && output && (
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
                {(step.type !== "idea" && step.type !== "script") && (
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
            <CardContent className={cn("p-6 pt-0 animate-in fade-in slide-in-from-top-4 duration-500", step.type === "script" ? "space-y-4" : "space-y-8")}>
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

                  <Button
                    onClick={handleCopyPrompt}
                    disabled={step.type === "idea" ? !input : (!input && !prevStepOutput)}
                    className={cn(
                      "w-full rounded-2xl text-[16px] font-black tracking-[0.1em] gap-4 transition-all duration-300 shadow-2xl uppercase",
                      step.type === "idea" ? "h-12" : "h-16",
                      (input || (step.type !== "idea" && prevStepOutput))
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] border-t border-white/20"
                        : "bg-black/20 text-white/20 pointer-events-none border border-white/5"
                    )}
                  >
                    {isCopied ? (
                      <Check className="w-6 h-6 animate-bounce" />
                    ) : (
                      <Copy className="w-6 h-6" />
                    )}
                    {isCopied ? "提示词已就绪" : "生成 AI 提示词"}
                  </Button>
                </div>
              )}

              {/* 第一步或第三步显示 AI 交互部分 */}
              {step.type !== "script" && (
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
                    
                    <Tabs defaultValue={STYLE_CATEGORIES[0].name} className="w-full">
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
                        <TabsContent key={category.name} value={category.name} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
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
                                    <span className="text-xs">{style.label.split(" ")[0]}</span>
                                    <span>{style.label.split(" ").slice(1).join(" ")}</span>
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
                  </div>

                  <Button
                    onClick={handleCopyPrompt}
                    className={cn(
                      "w-full h-12 rounded-xl text-sm font-black tracking-[0.1em] gap-3 transition-all duration-300 shadow-xl uppercase border-t border-white/20",
                      prevStepOutput 
                        ? "bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
                        : "bg-black/20 text-white/20 pointer-events-none border border-white/5"
                    )}
                  >
                    {isCopied ? <Check className="w-5 h-5 animate-bounce" /> : <Copy className="w-5 h-5" />}
                    {isCopied ? "提示词已就绪" : "一键生成提示词"}
                  </Button>

                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-end mb-4">
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
                        className="h-8 text-[11px] font-black text-primary/70 hover:text-primary hover:bg-primary/10 px-4 rounded-xl transition-all uppercase tracking-widest border border-primary/20"
                      >
                        <ClipboardPaste className="w-4 h-4 mr-2" />
                        同步 AI 结果
                      </Button>
                    </div>
                    <StoryboardEditor
                      taskId={taskId}
                      output={output || prevStepOutput}
                      storyboards={storyboards}
                      onUpdateStoryboards={onUpdateStoryboards}
                    />
                  </div>
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
