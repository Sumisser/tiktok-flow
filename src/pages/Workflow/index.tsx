import { useParams, Link } from "react-router-dom";
import { useTasks } from "../../store/hooks";
import Timeline from "../../components/Timeline";
import WorkflowStep from "../../components/WorkflowStep";
import { useState } from "react";

export default function Workflow() {
  const { id } = useParams<{ id: string }>();
  const { getTask, updateTask, updateStep, updateStoryboards } = useTasks();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const task = getTask(id || "");

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    if (task) setTitleInput(task.title);
  }

  if (!task) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 
                      flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-white/60 text-lg mb-4">项目不存在或已被删除</p>
          <Link
            to="/"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const handleTitleSave = () => {
    if (titleInput.trim() && titleInput !== task.title) {
      updateTask(task.id, { title: titleInput.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setTitleInput(task.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            {/* 返回按钮 */}
            <Link
              to="/"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 
                         flex items-center justify-center transition-all"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>

            {/* 标题 */}
            <div className="flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-2xl font-bold bg-transparent text-white w-full
                             focus:outline-none border-b-2 border-purple-500"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-2xl font-bold text-white cursor-pointer hover:text-purple-300 transition-colors"
                  title="点击编辑标题"
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* 进度指示 */}
            <div className="text-right">
              <p className="text-sm text-white/60">
                {task.steps.filter((s) => s.status === "completed").length} /{" "}
                {task.steps.length} 步骤完成
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Timeline>
          {task.steps.map((step, index) => (
            <WorkflowStep
              key={step.id}
              step={step}
              stepNumber={index + 1}
              prevStepOutput={index > 0 ? task.steps[index - 1].output : ""}
              onUpdate={(updates) => updateStep(task.id, step.id, updates)}
              storyboards={task.storyboards || []}
              onUpdateStoryboards={(storyboards) =>
                updateStoryboards(task.id, storyboards)
              }
            />
          ))}
        </Timeline>
      </main>
    </div>
  );
}
