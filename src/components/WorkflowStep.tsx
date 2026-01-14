import { useState, useEffect } from 'react';
import { domesticOpenai } from '@/lib/ai';

import type {
  WorkflowStep as WorkflowStepType,
  StoryboardItem,
} from '../types';

import { parseStoryboardTable } from '../lib/storyboard';
import StoryboardEditor from './StoryboardEditor';
import PromptSidebar from './PromptSidebar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { Check, ListTodo, Wand2, ArrowRight } from 'lucide-react';
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
import { MODELS, STYLE_CATEGORIES } from '../constants/workflow';
import GeneratingView from './Workflow/GeneratingView';
import StyleSelector from './Workflow/StyleSelector';
import ModelSelector from './Workflow/ModelSelector';

interface WorkflowStepProps {
  taskId: string;
  step: WorkflowStepType;
  stepNumber: number;
  prevStepOutput: string;
  onUpdate: (updates: Partial<WorkflowStepType>) => void;
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
  ttsAudioUrl?: string;
  onUpdateTtsAudioUrl?: (url: string) => void;
  taskTitle: string;
}

export default function WorkflowStep({
  taskId,
  step,
  onUpdate,
  storyboards,
  onUpdateStoryboards,
  ttsAudioUrl,
  onUpdateTtsAudioUrl,
  taskTitle,
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

  const [selectedModel, setSelectedModel] = useState(MODELS[1].id); // 默认 DeepSeek
  const [streamingText, setStreamingText] = useState(''); // 新增：用于展示流式文本

  // Sync state
  useEffect(() => {
    setInput(step.input);
    setOutput(step.output);
  }, [step.input, step.output]);

  const handleInputChange = (value: string) => {
    setInput(value);
    onUpdate({ input: value, status: 'in-progress' });
  };

  const [selectedStyle, setSelectedStyle] = useState(
    STYLE_CATEGORIES[0].styles[0].id,
  );

  const selectedStyleConfig = STYLE_CATEGORIES.flatMap((c) => c.styles).find(
    (s) => s.id === selectedStyle,
  );

  const getFullPrompt = () => {
    const stylePrompt = selectedStyleConfig?.prompt || '';
    let finalBasePrompt = step.basePrompt;

    if (!input.trim()) return '';

    const stylePlaceholder = '[STYLE_INSTRUCTION]';
    if (finalBasePrompt.includes(stylePlaceholder)) {
      finalBasePrompt = finalBasePrompt.replace(stylePlaceholder, stylePrompt);
    } else {
      finalBasePrompt =
        finalBasePrompt + '\n\n' + `**画面风格要求：**\n${stylePrompt}`;
    }

    const inputPlaceholder = '[USER_INPUT]';
    if (finalBasePrompt.includes(inputPlaceholder)) {
      finalBasePrompt = finalBasePrompt.replace(inputPlaceholder, input);
    } else {
      finalBasePrompt = finalBasePrompt + '\n' + input;
    }

    return finalBasePrompt.trim();
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    try {
      await navigator.clipboard.writeText(getFullPrompt());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }

    setIsGenerating(true);
    setStreamingText('');
    try {
      const stream = await domesticOpenai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: getFullPrompt(),
          },
        ],
        temperature: 0.7,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          setStreamingText(fullText);
        }
      }

      const text = fullText;

      if (text) {
        const stylePrefix = selectedStyleConfig?.prompt || '';
        setOutput(text);
        onUpdate({ output: text, status: 'in-progress' });

        const rawStoryboards = parseStoryboardTable(text);
        const styledStoryboards = rawStoryboards.map((item) => {
          const cleanedPrompt = item.imagePrompt.trim();
          return {
            ...item,
            imagePrompt: cleanedPrompt,
            stylePrompt: stylePrefix,
          };
        });

        if (styledStoryboards.length > 0) {
          onUpdateStoryboards(styledStoryboards);
        }
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isGenerating ? (
        <GeneratingView streamingText={streamingText} />
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
            ttsAudioUrl={ttsAudioUrl}
            onUpdateTtsAudioUrl={onUpdateTtsAudioUrl}
            taskTitle={taskTitle}
          />
        </div>
      ) : (
        <Card className="glass-card border-primary/20 ring-1 ring-primary/10 shadow-2xl relative overflow-hidden gap-0 py-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

          <CardHeader className="px-5 py-4 border-b border-white/5 flex flex-row items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <ListTodo className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-wide leading-tight">
                  创意分镜生成
                </h2>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  输入想法，AI 自动生成视觉分镜与提示词
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

          <CardContent className="px-5 py-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-primary" />
                创意描述
              </div>
              <Textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="例如：一个年轻人在下雨的城市街道上奔跑，突然回头看到了..."
                className="min-h-[100px] bg-black/20 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-white/10 resize-none rounded-xl p-3 text-xs leading-relaxed font-medium transition-all shadow-inner text-white"
              />
            </div>

            <StyleSelector
              selectedStyle={selectedStyle}
              onStyleSelect={setSelectedStyle}
            />

            <div className="pt-3 border-t border-white/5 w-full space-y-3">
              <ModelSelector
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
              />

              <Button
                onClick={handleGenerate}
                disabled={!input.trim() || isGenerating}
                className={cn(
                  'w-full h-12 rounded-xl text-xs font-black tracking-widest transition-all duration-300 shadow-lg uppercase relative overflow-hidden group',
                  input.trim() && !isGenerating
                    ? 'bg-gradient-to-r from-primary to-violet-600 text-white hover:scale-[1.01] hover:shadow-primary/25 border border-white/10'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isGenerating ? (
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span>正在进行 AI 创意构思...</span>
                  </div>
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
