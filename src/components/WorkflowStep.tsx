import { useState } from "react";
import type {
  WorkflowStep as WorkflowStepType,
  StoryboardItem,
} from "../types";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import StoryboardEditor from "./StoryboardEditor";
import PromptSidebar from "./PromptSidebar";

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isPromptSidebarOpen, setIsPromptSidebarOpen] = useState(false);

  // 自动填充上一步的输出
  const [prevStepOutputVal, setPrevStepOutputVal] = useState(prevStepOutput);
  if (prevStepOutput !== prevStepOutputVal) {
    setPrevStepOutputVal(prevStepOutput);
    if (prevStepOutput && !input) {
      setInput(prevStepOutput);
    }
  }

  // 同步状态
  const [prevStepInput, setPrevStepInput] = useState(step.input);
  const [prevStepOutputState, setPrevStepOutputState] = useState(step.output);
  if (step.input !== prevStepInput || step.output !== prevStepOutputState) {
    setPrevStepInput(step.input);
    setPrevStepOutputState(step.output);
    setInput(step.input);
    setOutput(step.output);
  }

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
    setInput("");
    setOutput("");
    onUpdate({ input: "", output: "", status: "pending" });
    setIsExpanded(true);
  };

  // 状态指示颜色
  const statusColors = {
    pending: "bg-white/20 border-white/30",
    "in-progress": "bg-yellow-500/20 border-yellow-500/50 animate-pulse",
    completed: "bg-green-500/20 border-green-500/50",
  };

  const statusDotColors = {
    pending: "bg-white/40",
    "in-progress": "bg-yellow-500",
    completed: "bg-green-500",
  };

  return (
    <div className="relative pl-20">
      {/* 时间轴节点 */}
      <div className="absolute left-5 top-6 z-10">
        <div
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center
                         ${
                           statusColors[step.status]
                         } backdrop-blur-sm transition-all duration-300`}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              statusDotColors[step.status]
            } transition-all duration-300`}
          />
        </div>
      </div>

      {/* 卡片 */}
      <div
        className={`rounded-2xl border backdrop-blur-xl transition-all duration-500
                       ${
                         step.status === "completed"
                           ? "bg-green-500/5 border-green-500/20"
                           : "bg-white/5 border-white/10 hover:border-purple-500/30"
                       }`}
      >
        {/* 标题栏 */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between p-5 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{step.title.split(" ")[0]}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">
                第 {stepNumber} 步：{step.title.split(" ").slice(1).join(" ")}
              </h3>
              <p className="text-sm text-white/50">
                {step.status === "completed"
                  ? "已完成"
                  : step.status === "in-progress"
                  ? "进行中"
                  : "待开始"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step.status === "completed" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="px-3 py-1.5 text-sm text-white/60 hover:text-white 
                           bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                重置
              </button>
            )}
            <svg
              className={`w-5 h-5 text-white/60 transition-transform duration-300 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* 展开内容 */}
        {isExpanded && (
          <div className="px-5 pb-5 space-y-5 border-t border-white/10 pt-5">
            {/* 预设提示词 - 折叠按钮 */}
            <div className="space-y-2">
              <button
                onClick={() => setIsPromptSidebarOpen(true)}
                className="flex items-center gap-2 px-4 py-3 w-full bg-black/20 rounded-xl
                           border border-white/10 hover:border-purple-500/50 hover:bg-black/30
                           transition-all group"
              >
                <span className="text-lg">📋</span>
                <span className="text-sm font-medium text-white/70 group-hover:text-white/90">
                  查看基础提示词
                </span>
                <svg
                  className="w-4 h-4 text-white/40 group-hover:text-purple-400 ml-auto transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* 侧边栏 */}
            <PromptSidebar
              isOpen={isPromptSidebarOpen}
              onClose={() => setIsPromptSidebarOpen(false)}
              basePrompt={step.basePrompt}
            />

            {/* 用户输入 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                <span>✏️</span> 你的输入
                {prevStepOutput && !input && (
                  <button
                    onClick={() => handleInputChange(prevStepOutput)}
                    className="text-xs text-purple-400 hover:text-purple-300 ml-2"
                  >
                    ← 使用上一步结果
                  </button>
                )}
              </label>
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  stepNumber === 1
                    ? "输入你的想法或主题..."
                    : "输入内容或使用上一步的结果..."
                }
                className="w-full h-32 p-4 bg-black/30 rounded-xl text-white placeholder-white/40
                           border border-white/10 focus:border-purple-500/50 focus:outline-none
                           resize-none transition-all"
              />
            </div>

            {/* 复制完整提示词按钮 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyPrompt}
                disabled={!input}
                className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                           ${
                             input
                               ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                               : "bg-white/10 text-white/40 cursor-not-allowed"
                           }`}
              >
                {isCopied ? (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    已复制到剪贴板
                  </>
                ) : (
                  <>
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    复制完整提示词（发送给 AI）
                  </>
                )}
              </button>
            </div>

            {/* AI 输出结果 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <span>🤖</span> AI 生成结果
                  <span className="text-xs text-white/40">
                    （将 AI 回复粘贴到这里）
                  </span>
                </label>
              </div>
              {/* 第二步（分镜）不需要预览模式 */}
              {(step.type as string) === "script" ? (
                <textarea
                  value={output}
                  onChange={(e) => handleOutputChange(e.target.value)}
                  placeholder="粘贴 AI 生成的分镜表格..."
                  className="w-full h-32 p-4 bg-black/30 rounded-xl text-white placeholder-white/40
                             border border-white/10 focus:border-green-500/50 focus:outline-none
                             resize-none transition-all text-sm font-mono"
                />
              ) : isPreviewMode && output ? (
                <div
                  className="w-full min-h-48 p-4 bg-black/30 rounded-xl text-white
                             border border-white/10 overflow-auto prose prose-invert prose-sm max-w-none
                             prose-table:border-collapse prose-th:border prose-th:border-white/20 prose-th:p-2 prose-th:bg-white/10
                             prose-td:border prose-td:border-white/20 prose-td:p-2"
                >
                  <Markdown remarkPlugins={[remarkGfm]}>{output}</Markdown>
                </div>
              ) : (
                <>
                  {output && step.type !== "script" && (
                    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 mb-2 w-fit">
                      <button
                        onClick={() => setIsPreviewMode(false)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          !isPreviewMode
                            ? "bg-purple-500 text-white"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => setIsPreviewMode(true)}
                        className={`px-3 py-1 text-xs rounded-md transition-all ${
                          isPreviewMode
                            ? "bg-purple-500 text-white"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        预览
                      </button>
                    </div>
                  )}
                  <textarea
                    value={output}
                    onChange={(e) => handleOutputChange(e.target.value)}
                    placeholder="粘贴 AI 生成的结果..."
                    className="w-full h-48 p-4 bg-black/30 rounded-xl text-white placeholder-white/40
                               border border-white/10 focus:border-green-500/50 focus:outline-none
                               resize-none transition-all"
                  />
                </>
              )}
            </div>

            {/* 分镜编辑器 - 仅对第二步显示 */}
            {step.type === "script" && output && (
              <div className="border-t border-white/10 pt-5">
                <StoryboardEditor
                  output={output}
                  storyboards={storyboards}
                  onUpdateStoryboards={onUpdateStoryboards}
                />
              </div>
            )}

            {/* 完成按钮 */}
            {output && step.status !== "completed" && (
              <button
                onClick={handleMarkComplete}
                className="w-full py-3 rounded-xl font-medium transition-all
                           bg-gradient-to-r from-green-500 to-emerald-500 text-white 
                           hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/25
                           flex items-center justify-center gap-2"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                标记为完成，继续下一步
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
