import { useState } from 'react';
import type { StoryboardItem } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Play,
  Wand2,
  Copy,
  Check,
  Video,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoGenerationViewProps {
  storyboards: StoryboardItem[];
  onUpdateStoryboards: (storyboards: StoryboardItem[]) => void;
}

export default function VideoGenerationView({
  storyboards,
  onUpdateStoryboards,
}: VideoGenerationViewProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleUpdatePrompt = (id: string, prompt: string) => {
    const updated = storyboards.map((item) =>
      item.id === id ? { ...item, videoPrompt: prompt } : item,
    );
    onUpdateStoryboards(updated);
  };

  const handleGenerateVideo = async (id: string) => {
    setGeneratingId(id);
    // Simulate generation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // In a real app, this would call an API and update videoUrl
    const updated = storyboards.map((item) =>
      item.id === id
        ? { ...item, videoUrl: 'https://example.com/video.mp4' } // Mock URL
        : item,
    );
    onUpdateStoryboards(updated);
    setGeneratingId(null);
    toast.success('视频生成请求已提交');
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('复制失败');
    }
  };

  if (storyboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl border-dashed">
        <Video className="w-12 h-12 text-white/20 mb-4" />
        <p className="text-white/50 text-sm font-medium">
          暂无分镜数据，请先在“剧本生成”步骤完成分镜设计
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            视频生成控制台
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            为每个分镜生成视频提示词并创建视频
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-1 rounded">
            {storyboards.length} SHOTS
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {storyboards.map((item) => (
          <div
            key={item.id}
            className="group relative bg-black/20 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/20 transition-all duration-500"
          >
            <div className="flex flex-col md:flex-row h-full">
              {/* Preview Section */}
              <div className="w-full md:w-64 h-48 md:h-auto relative bg-black/40 flex-shrink-0 border-b md:border-b-0 md:border-r border-white/5">
                {item.imageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <span className="text-xs font-bold uppercase tracking-widest">
                      No Image
                    </span>
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 text-[10px] font-black text-white/80 uppercase tracking-widest">
                  Shot {item.shotNumber}
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 p-5 space-y-4">
                {/* Script */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                      分镜脚本
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed font-medium">
                    {item.script}
                  </p>
                </div>

                {/* Video Prompt Input */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">
                      视频提示词
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(item.videoPrompt || '', item.id)
                      }
                      className="h-5 px-2 text-[9px] hover:bg-white/5 text-white/40 hover:text-white"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copiedId === item.id ? 'COPIED' : 'COPY PROMPT'}
                    </Button>
                  </div>
                  <Textarea
                    value={item.videoPrompt || ''}
                    onChange={(e) =>
                      handleUpdatePrompt(item.id, e.target.value)
                    }
                    placeholder="输入视频生成提示词，描述画面运动、光影、氛围..."
                    className="bg-black/20 border-white/10 focus:border-primary/30 min-h-[80px] text-xs font-mono resize-none rounded-xl placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Actions Section */}
              <div className="w-full md:w-48 bg-white/2 border-t md:border-t-0 md:border-l border-white/5 p-4 flex flex-col justify-center gap-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-bold border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-white/60"
                >
                  <Wand2 className="w-3.5 h-3.5 mr-2 opacity-70" />
                  AI 优化提示词
                </Button>

                <Button
                  onClick={() => handleGenerateVideo(item.id)}
                  disabled={generatingId === item.id}
                  className={cn(
                    'w-full justify-start text-xs font-bold transition-all duration-300',
                    generatingId === item.id
                      ? 'bg-primary/20 text-primary border-primary/20'
                      : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105',
                  )}
                >
                  {generatingId === item.id ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 mr-2 fill-current" />
                  )}
                  {generatingId === item.id ? '生成中...' : '生成视频'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
