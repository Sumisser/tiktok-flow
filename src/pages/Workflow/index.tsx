import { useParams, Link } from 'react-router-dom';
import { useTasks } from '../../store/hooks';

import WorkflowStep from '../../components/WorkflowStep';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Edit3, Check, X, Home, Tag } from 'lucide-react';

export default function Workflow() {
  const { id } = useParams<{ id: string }>();
  const {
    getTask,
    updateTask,
    updateStep,
    updateStoryboards,
    isLoading,
    wallpaperUrl,
  } = useTasks();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // 视图与生成状态关联
  const [showResultView, setShowResultView] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const task = getTask(id || '');

  useEffect(() => {
    if (task) {
      setTitleInput(task.title);
      // 如果有分镜数据且不是正在生成，默认显示结果
      if (task.storyboards && task.storyboards.length > 0 && !isGenerating) {
        setShowResultView(true);
      }
    }
  }, [task?.id]);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="space-y-8 text-center animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-primary/10 border-t-primary rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-12 h-12 border-4 border-primary/5 border-t-primary/60 rounded-full animate-spin"
                style={{
                  animationDirection: 'reverse',
                  animationDuration: '1s',
                }}
              />
            </div>
          </div>
          <p className="text-lg font-black tracking-widest uppercase text-muted-foreground">
            正在加载项目...
          </p>
        </div>
      </div>
    );
  }

  // 项目不存在
  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="w-24 h-24 bg-destructive/10 rounded-[2.5rem] mx-auto flex items-center justify-center border border-destructive/20 relative z-10">
              <X className="w-12 h-12 text-destructive" />
            </div>
            <div className="absolute -inset-8 bg-destructive/10 blur-[60px] opacity-40 -z-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">项目不存在</h2>
            <p className="text-muted-foreground">
              该项目可能已被删除，或链接地址有误。
            </p>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-2xl px-8 h-12 border-border hover:bg-secondary shadow-sm"
          >
            <Link to="/" className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              返回首页
            </Link>
          </Button>
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
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTitleInput(task.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden relative text-white">
      {/* 背景图片 */}
      {wallpaperUrl && (
        <>
          <div
            className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${wallpaperUrl})`,
            }}
          />
          {/* 遮罩层 */}
          <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
        </>
      )}

      {/* 头部 */}
      <header className="fixed top-0 left-0 right-0 border-b border-primary/20 py-3 px-4 md:px-12 lg:px-24 overflow-hidden z-20 bg-black/40 backdrop-blur-xl">
        {/* 头部装饰背景 */}
        <div className="absolute top-0 left-1/4 w-64 h-full bg-primary/5 blur-[100px] -z-10 animate-pulse" />

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          {/* 左侧：首页和标题 */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-white/5 shrink-0 h-10 w-10 border border-white/10 group transition-all"
            >
              <Link to="/">
                <Home className="w-5 h-5 group-hover:scale-110 transition-transform text-white/70" />
              </Link>
            </Button>

            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                  <Input
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    className="text-xl font-black bg-black/40 border-primary/20 h-10 px-4 rounded-xl text-white"
                  />
                  <Button
                    size="sm"
                    onClick={handleTitleSave}
                    className="h-10 rounded-xl px-4"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group max-w-full">
                  <h1 className="text-xl font-black tracking-tight truncate text-white/90">
                    {task.title}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditingTitle(true)}
                    className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-white/5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-white/40" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：标签管理与视图切换 */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex flex-wrap items-center justify-end gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
              {task.tags?.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-1 pl-2.5 pr-1.5 py-0.5 h-6 text-[10px] bg-white/5 text-white/60 border-white/10 hover:bg-white/10 transition-colors"
                >
                  {tag}
                  <button
                    onClick={() => {
                      const newTags = task.tags?.filter((_, i) => i !== index);
                      updateTask(task.id, { tags: newTags });
                    }}
                    className="ml-1 hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3 text-white/30" />
                  </button>
                </Badge>
              ))}

              <div className="relative mr-2">
                {isAddingTag ? (
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        const newTags = [...(task.tags || []), tagInput.trim()];
                        updateTask(task.id, { tags: newTags });
                        setTagInput('');
                        setIsAddingTag(false);
                      } else if (e.key === 'Escape') {
                        setIsAddingTag(false);
                      }
                    }}
                    autoFocus
                    onBlur={() => {
                      if (!tagInput.trim()) setIsAddingTag(false);
                    }}
                    className="h-6 w-24 text-[10px] bg-black/20 border-white/10 px-2 rounded-lg"
                    placeholder="标签名称..."
                  />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingTag(true)}
                    className="h-6 px-3 text-[10px] font-black text-white/40 hover:text-white/80 hover:bg-white/5 border border-white/5 rounded-lg uppercase tracking-widest"
                  >
                    <Tag className="w-3 h-3 mr-1.5" />
                    添加标签
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="w-full pt-20 h-screen overflow-y-auto">
        {/* <div className="flex-1 w-full flex flex-col items-center"> */}
        {/* <div className="w-full flex-1 flex flex-col items-center"> */}
        <WorkflowStep
          key={task.steps[0].id}
          taskId={task.id}
          step={task.steps[0]}
          stepNumber={1}
          prevStepOutput=""
          onUpdate={(updates) => updateStep(task.id, task.steps[0].id, updates)}
          storyboards={task.storyboards || []}
          onUpdateStoryboards={(storyboards) =>
            updateStoryboards(task.id, storyboards)
          }
          ttsAudioUrl={task.ttsAudioUrl}
          onUpdateTtsAudioUrl={(url) =>
            updateTask(task.id, { ttsAudioUrl: url })
          }
          taskTitle={task.title}
          showResultView={showResultView}
          setShowResultView={setShowResultView}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
        {/* </div> */}
        {/* </div> */}
      </main>
    </div>
  );
}
