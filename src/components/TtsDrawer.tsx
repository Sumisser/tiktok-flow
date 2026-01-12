import { useState, useRef, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { generateMinimaxTts, fetchMinimaxVoices } from '@/lib/tts';
import { Mic, Download, Loader2, Play, RotateCcw, Music } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface TtsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fullScript: string;
}

export default function TtsDrawer({
  isOpen,
  onClose,
  fullScript,
}: TtsDrawerProps) {
  const [voices, setVoices] = useState<
    { id: string; name: string; desc: string; type: string }[]
  >([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化获取音色
  useEffect(() => {
    async function initVoices() {
      setIsLoadingVoices(true);
      try {
        const list = await fetchMinimaxVoices();
        setVoices(list);
        if (list.length > 0) setSelectedVoice(list[0].id);
      } finally {
        setIsLoadingVoices(false);
      }
    }
    if (isOpen) initVoices();
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!fullScript.trim()) {
      toast.error('脚本内容为空');
      return;
    }

    setIsGenerating(true);
    try {
      const url = await generateMinimaxTts({
        text: fullScript,
        voice_id: selectedVoice,
      });
      setAudioUrl(url);
      toast.success('语音合成成功');
    } catch (error: any) {
      console.error('TTS Error:', error);
      toast.error(error.message || '语音合成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.load(); // 强制重新加载以确保源有效
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error('播放失败:', err);
        toast.error('音频播放失败，请尝试重新生成');
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-black/90 backdrop-blur-2xl border-white/10 text-white w-[400px] sm:max-w-[400px] flex flex-col p-0 overflow-hidden">
        <SheetHeader className="p-6 border-b border-white/5 space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/20">
              <Mic className="w-5 h-5" />
            </div>
            <SheetTitle className="text-xl font-black tracking-tight text-white">
              AI 语音合成
            </SheetTitle>
          </div>
          <SheetDescription className="text-white/40 text-[10px] uppercase tracking-widest font-bold">
            Powered by MiniMax Speech-2.6-HD
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
          {/* 脚本预览 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-white/50">
              <span>脚本内容预览</span>
              <span className="text-primary/60">{fullScript.length} 字</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-[160px] overflow-y-auto no-scrollbar scroll-smooth">
              <p className="text-[11px] leading-relaxed text-white/40 font-mono italic">
                {fullScript}
              </p>
            </div>
          </div>

          {/* 播放与下载控制 - 显著位置展示 */}
          {audioUrl && (
            <div className="bg-green-500/15 border border-green-500/40 rounded-3xl p-5 space-y-4 animate-in fade-in zoom-in duration-500 shadow-[0_0_40px_rgba(34,197,94,0.15)] ring-1 ring-green-500/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/20">
                  <Music className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-black text-white">
                    语音合成成功
                  </div>
                  <div className="text-[9px] text-green-500 uppercase tracking-widest font-black">
                    READY TO PLAY •{' '}
                    {voices.find((v) => v.id === selectedVoice)?.name ||
                      'Selected Voice'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePlay}
                  className="flex-[3] bg-green-500 hover:bg-green-400 text-black font-black uppercase text-xs rounded-xl h-12 shadow-lg shadow-green-500/30 transition-all active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  立即点击试听
                </Button>
                <a
                  href={audioUrl}
                  download={`video-voice-${Date.now()}.mp3`}
                  className="flex-1 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/5 shadow-inner"
                  title="下载音频文件"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
              <audio ref={audioRef} src={audioUrl} className="hidden" />
            </div>
          )}

          {/* 音色选择 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-black uppercase tracking-wider text-white/50">
                选择音色
              </div>
              <div className="text-[9px] text-white/20 font-bold uppercase tracking-tight">
                {voices.length} Available
              </div>
            </div>

            {/* 搜索框 */}
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within/search:text-primary transition-colors" />
              <Input
                placeholder="搜索音色名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/5 border-white/5 focus:border-primary/30 h-10 pl-9 text-xs rounded-xl transition-all"
              />
            </div>

            {isLoadingVoices ? (
              <div className="grid grid-cols-2 gap-3 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                {voices
                  .filter((v) =>
                    v.name.toLowerCase().includes(searchTerm.toLowerCase()),
                  )
                  .map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden flex flex-col justify-between h-[80px]',
                        selectedVoice === voice.id
                          ? 'bg-primary/20 border-primary/50 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]'
                          : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]',
                      )}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className="font-black text-[11px] group-hover:text-primary transition-colors truncate max-w-[70%]">
                          {voice.name}
                        </div>
                        <span
                          className={cn(
                            'text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter',
                            voice.type === '系统'
                              ? 'bg-blue-500/20 text-blue-400'
                              : voice.type === '克隆'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-green-500/20 text-green-400',
                          )}
                        >
                          {voice.type}
                        </span>
                      </div>
                      <div className="text-[9px] text-white/30 line-clamp-2 leading-tight">
                        {voice.desc}
                      </div>

                      {selectedVoice === voice.id && (
                        <div className="absolute bottom-1 right-1">
                          <div className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_5px_var(--primary)]" />
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !fullScript}
            className={cn(
              'w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-2xl transition-all group overflow-hidden relative',
              !audioUrl
                ? 'bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/10 text-white hover:bg-white/20',
            )}
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI 合成中...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                <span>{audioUrl ? '重新合成' : '立刻生成语音'}</span>
              </div>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
