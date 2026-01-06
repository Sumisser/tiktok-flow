import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListTodo, Info } from "lucide-react";

interface PromptSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  basePrompt: string;
}

export default function PromptSidebar({
  isOpen,
  onClose,
  basePrompt,
}: PromptSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[90vw] sm:max-w-2xl glass border-l border-border flex flex-col p-0 shadow-2xl">
        <SheetHeader className="p-8 border-b border-border/50 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-black tracking-tighter text-neon">
                提示词引擎
              </SheetTitle>
              <SheetDescription className="text-muted-foreground/50 text-[10px] uppercase tracking-[0.3em] font-black flex items-center gap-2 mt-1">
                AI System Prompt Architecture
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-8">
          <div className="relative group">
            <div className="absolute -left-5 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 via-primary/5 to-transparent rounded-full font-black" />
            <pre className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed font-mono pl-8 bg-secondary/50 p-8 rounded-[2.5rem] border border-border shadow-inner">
              {basePrompt}
            </pre>
          </div>
        </ScrollArea>

        <div className="p-8 border-t border-border/50 bg-secondary/20">
          <div className="flex items-start gap-4 p-5 rounded-[1.5rem] bg-white border border-border relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Info className="w-12 h-12" />
            </div>
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black text-primary uppercase tracking-widest">
                Protocol Intelligence
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                当前显示的是系统预设协议。它定义了 AI
                的行为逻辑、输出精度以及结构化要求。在生成过程中，本协议将作为全局约束条件。
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
