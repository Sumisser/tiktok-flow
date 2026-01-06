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
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface WorkflowStepProps {
  step: WorkflowStepType;
  stepNumber: number;
  prevStepOutput: string;
  onUpdate: (updates: Partial<WorkflowStepType>) => void;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
}

export default function WorkflowStep({
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

  const getFullPrompt = () => {
    return step.basePrompt + "\n\n" + input;
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

  const handleReset = () => {
    if (confirm("确定要重置当前步骤吗？所有输入和生成结果将被清空。")) {
      setInput("");
      setOutput("");
      onUpdate({ input: "", output: "", status: "pending" });
      setIsExpanded(true);
    }
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
    <div className="relative pl-16 pb-16 last:pb-4 group">
      {/* 时间轴线条 */}
      <div className="absolute left-[19px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent group-last:hidden rounded-full" />

      {/* 时间轴标记 */}
      <div
        className={cn(
          "absolute left-0 top-6 w-10 h-10 rounded-xl border border-border flex items-center justify-center z-10 transition-all duration-700 shadow-lg",
          step.status === "completed"
            ? "bg-primary text-primary-foreground scale-110 shadow-primary/20 text-neon"
            : "bg-card text-muted-foreground"
        )}
      >
        {step.status === "completed" ? (
          <Check className="w-5 h-5" />
        ) : (
          <span className="text-xs font-black tracking-tighter">
            {stepNumber.toString().padStart(2, "0")}
          </span>
        )}
      </div>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Card
          className={cn(
            "transition-all duration-500 overflow-hidden relative",
            isExpanded
              ? "glass-card border-primary/20 ring-1 ring-primary/10"
              : "bg-secondary/30 border-border hover:bg-secondary hover:border-primary/20 shadow-none"
          )}
        >
          {/* AI 扫描线动画 (仅在展开时显示) */}
          {isExpanded && (
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-20 animate-[scan_3s_linear_infinite]" />
          )}

          <CollapsibleTrigger asChild>
            <div className="p-6 cursor-pointer flex items-center justify-between group/header select-none">
              <div className="flex items-center gap-6">
                <span className="text-4xl filter drop-shadow-lg opacity-80 group-hover/header:opacity-100 transition-all duration-500 transform group-hover/header:scale-110">
                  {step.title.split(" ")[0]}
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl font-black flex items-center gap-4">
                    <span
                      className={cn(
                        "truncate transition-colors duration-300",
                        isExpanded
                          ? "text-primary text-neon"
                          : "text-foreground/70 group-hover/header:text-foreground"
                      )}
                    >
                      {step.title.split(" ").slice(1).join(" ")}
                    </span>
                    <Badge
                      variant={
                        step.status === "completed" ? "default" : "outline"
                      }
                      className={cn(
                        "text-[9px] h-5 px-2.5 font-black tracking-[0.2em] uppercase border-border shrink-0 font-mono",
                        step.status === "completed"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {getStatusText(step.status)}
                    </Badge>
                  </h3>
                  {!isExpanded && output && (
                    <p className="text-xs text-muted-foreground/50 line-clamp-1 mt-1.5 font-medium tracking-tight">
                      {output.substring(0, 150)}...
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {step.status === "completed" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
                <div
                  className={cn(
                    "p-2 rounded-xl bg-secondary border border-border transition-all duration-500",
                    isExpanded
                      ? "rotate-0 bg-primary/10 border-primary/20 text-primary"
                      : "-rotate-90"
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="p-8 pt-0 space-y-12 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* 配置部分 */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                        模块-01
                      </span>
                      <p className="text-xs font-bold text-foreground/80">
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

                <div className="relative group/input">
                  <Textarea
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={
                      stepNumber === 1
                        ? "请输入你的想法、剧本主题或原始素材内容..."
                        : "请输入内容或在此基础上进行调整..."
                    }
                    className="min-h-[160px] bg-secondary/50 border-border focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/30 resize-none rounded-2xl p-6 text-sm leading-relaxed font-medium transition-all shadow-inner"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPromptSidebarOpen(true)}
                    className="absolute right-4 bottom-4 h-9 text-[11px] font-black tracking-widest text-muted-foreground hover:text-primary bg-white/80 hover:bg-secondary backdrop-blur-md border border-border rounded-xl px-4 transition-all uppercase"
                  >
                    <ListTodo className="w-4 h-4 mr-2" />
                    提示词引擎
                  </Button>
                </div>

                <Button
                  onClick={handleCopyPrompt}
                  disabled={!input}
                  className={cn(
                    "w-full h-16 rounded-2xl text-[16px] font-black tracking-[0.1em] gap-4 transition-all duration-300 shadow-2xl uppercase",
                    input
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] border-t border-white/20"
                      : "bg-secondary text-muted-foreground/50 pointer-events-none"
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

              {/* AI 交互部分 */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-border/50 pb-4">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent border border-accent/20">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                      模块-02
                    </span>
                    <p className="text-xs font-bold text-foreground/80">
                      AI 执行输出
                    </p>
                  </div>
                </div>

                <Tabs defaultValue="edit" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-secondary border border-border h-11 p-1 rounded-xl">
                      <TabsTrigger
                        value="edit"
                        className="text-xs font-black h-9 px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm decoration-transparent uppercase tracking-wider"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        编辑器
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        className="text-xs font-black h-9 px-6 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm uppercase tracking-wider"
                        disabled={!output}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        预览
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2.5 text-[10px] text-muted-foreground/40 font-black italic tracking-[0.2em] uppercase">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary/20 animate-pulse" />
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
                      className="min-h-[260px] bg-secondary/50 border-border focus:border-accent/50 focus:ring-accent/20 placeholder:text-muted-foreground/30 resize-none font-mono rounded-2xl p-8 text-sm leading-relaxed"
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
              </div>

              {/* 特殊编辑器部分 */}
              {step.type === "script" && output && (
                <div className="space-y-6 pt-10 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                        专用工具
                      </span>
                      <p className="text-xs font-bold text-foreground/80">
                        分镜脚本管理系统
                      </p>
                    </div>
                  </div>
                  <div className="bg-secondary/40 border border-border rounded-[2.5rem] p-8 shadow-inner overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    <StoryboardEditor
                      output={output}
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
    </div>
  );
}
