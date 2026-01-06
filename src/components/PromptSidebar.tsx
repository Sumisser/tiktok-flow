import { useEffect } from "react";

interface PromptSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  basePrompt: string;
  onSave?: (prompt: string) => void;
}

export default function PromptSidebar({
  isOpen,
  onClose,
  basePrompt,
}: PromptSidebarProps) {
  // 按 ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* 侧边栏 */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-900/95 border-l border-white/10 
                   shadow-2xl z-50 flex flex-col animate-slide-in-right"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">📋 基础提示词</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-white/60 
                       hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4">
          <pre className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {basePrompt}
          </pre>
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-xs text-white/40">
            提示词模板由系统预设，更新后自动应用到所有任务
          </p>
        </div>
      </div>
    </>
  );
}
