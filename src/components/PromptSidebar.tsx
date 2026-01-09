import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Cpu, Info, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface PromptSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  basePrompt: string;
  onSave: (newPrompt: string) => void;
}

export default function PromptSidebar({
  isOpen,
  onClose,
  basePrompt,
  onSave,
}: PromptSidebarProps) {
  const [prompt, setPrompt] = useState(basePrompt);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setPrompt(basePrompt);
    setHasChanges(false);
  }, [basePrompt, isOpen]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setHasChanges(e.target.value !== basePrompt);
  };

  const handleSave = () => {
    onSave(prompt);
    setHasChanges(false);
    toast.success('系统提示词已更新');
    onClose();
  };

  const handleReset = () => {
    setPrompt(basePrompt);
    setHasChanges(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        className="w-[90vw] sm:max-w-2xl glass border-l border-border flex flex-col p-0 shadow-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="px-5 py-4 border-b border-border/50 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-black tracking-tighter text-neon">
                提示词引擎
              </SheetTitle>
              <SheetDescription className="text-muted-foreground/50 text-[10px] uppercase tracking-[0.2em] font-black flex items-center gap-2">
                系统级指令配置
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          <ScrollArea className="h-full w-full">
            <div className="p-4 h-full">
              <Textarea
                value={prompt}
                onChange={handlePromptChange}
                className="w-full h-full min-h-[calc(100vh-200px)] font-mono text-sm leading-relaxed bg-secondary/30 border-border/50 focus:border-primary/50 focus:ring-primary/20 p-4 rounded-xl resize-none shadow-inner"
                placeholder="在此输入系统提示词..."
                spellCheck={false}
              />
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="p-4 border-t border-border/50 bg-secondary/10 shrink-0 gap-3 sm:justify-between flex-col sm:flex-row items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto p-2.5 rounded-xl bg-background/50 border border-border/50 backdrop-blur-sm">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-tight">
              修改将绑定至当前任务，影响后续生成结果。
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleReset}
                size="sm"
                className="flex-1 sm:flex-none h-9 rounded-xl"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                复原
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              size="sm"
              className="flex-1 sm:flex-none h-9 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Save className="w-4 h-4 mr-2" />
              保存配置
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
