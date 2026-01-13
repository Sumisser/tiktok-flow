import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { generateMinimaxTts, fetchMinimaxVoices, type Voice } from '@/lib/tts';
import { uploadTtsAudio, deleteTtsAudio } from '@/lib/storage';
import {
  Mic,
  Download,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  Search,
  Check,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// 默认音色
const DEFAULT_VOICE_ID = 'Boyan_new_platform';
const DEFAULT_VOICE_NAME = '专业播音';

interface TtsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  fullScript: string;
  taskId: string;
  savedAudioUrl?: string;
  onAudioSaved: (audioUrl: string) => void;
}

export default function TtsDrawer({
  isOpen,
  onClose,
  fullScript,
  taskId,
  savedAudioUrl,
  onAudioSaved,
}: TtsDrawerProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE_ID);
  const [selectedVoiceName, setSelectedVoiceName] =
    useState(DEFAULT_VOICE_NAME);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(
    savedAudioUrl || null,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);

  // 音频播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  // 初始化时如果有保存的音频，则使用它
  useEffect(() => {
    if (savedAudioUrl) {
      setAudioUrl(savedAudioUrl);
    }
  }, [savedAudioUrl]);

  // 懒加载音色列表（仅当用户打开选择器时）
  const loadVoices = useCallback(async () => {
    if (voices.length > 0) return;
    setIsLoadingVoices(true);
    try {
      const list = await fetchMinimaxVoices();
      setVoices(list);
    } finally {
      setIsLoadingVoices(false);
    }
  }, [voices.length]);

  // 音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // 重置播放状态
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleCanPlay = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('音频加载错误:', e);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // 延迟加载确保 DOM 已更新 src
    const loadTimer = setTimeout(() => {
      if (audio.src !== audioUrl) {
        audio.src = audioUrl;
      }
      audio.load();
    }, 50);

    return () => {
      clearTimeout(loadTimer);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const handleGenerate = async () => {
    if (!fullScript.trim()) {
      toast.error('脚本内容为空');
      return;
    }

    setIsGenerating(true);
    try {
      // 1. 如果已有音频，先删除旧的
      if (audioUrl && savedAudioUrl) {
        await deleteTtsAudio(savedAudioUrl);
      }

      // 2. 生成新音频
      const localUrl = await generateMinimaxTts({
        text: fullScript,
        voice_id: selectedVoice,
      });

      // 3. 获取 Blob 用于上传
      const response = await fetch(localUrl);
      const audioBlob = await response.blob();

      // 4. 上传到 Supabase
      const uploadedUrl = await uploadTtsAudio(audioBlob, taskId);

      // 5. 更新状态和回调保存
      setAudioUrl(uploadedUrl);
      onAudioSaved(uploadedUrl);

      // 清理本地 ObjectURL
      URL.revokeObjectURL(localUrl);

      toast.success('语音合成完成');
    } catch (error: any) {
      console.error('TTS Error:', error);
      toast.error(error.message || '语音合成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error('播放失败:', err);
        toast.error('音频播放失败');
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice.id);
    setSelectedVoiceName(voice.name);
    setShowVoiceSelector(false);
  };

  const filteredVoices = voices.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="bg-black/95 backdrop-blur-3xl border-white/5 text-white w-[380px] sm:max-w-[380px] flex flex-col p-0 overflow-hidden">
        <SheetHeader className="px-5 py-4 border-b border-white/5 space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/15 text-primary">
              <Mic className="w-4 h-4" />
            </div>
            <SheetTitle className="text-base font-black tracking-tight text-white">
              语音合成
            </SheetTitle>
          </div>
          <SheetDescription className="text-white/30 text-[9px] uppercase tracking-[0.15em] font-bold">
            MiniMax Speech-2.6-HD
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* 脚本预览 - 紧凑 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-white/40">
              <span>脚本</span>
              <span className="text-primary/50">{fullScript.length} 字</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 max-h-[100px] overflow-y-auto no-scrollbar">
              <p className="text-[10px] leading-relaxed text-white/30 font-mono">
                {fullScript || '暂无脚本内容'}
              </p>
            </div>
          </div>

          {/* 音频播放器 - 完善功能 */}
          {audioUrl && (
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3 h-3 text-primary/60" />
                    <span className="text-[10px] font-bold text-white/70">
                      {selectedVoiceName}
                    </span>
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                  {/* 进度条 */}
                  <div
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className="h-1.5 bg-white/10 rounded-full cursor-pointer overflow-hidden group"
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-100 relative"
                      style={{
                        width: duration
                          ? `${(currentTime / duration) * 100}%`
                          : '0%',
                      }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] text-white/30 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* 下载按钮 */}
              <a
                href={audioUrl}
                download={`tts-${taskId}-${Date.now()}.mp3`}
                className="flex items-center justify-center gap-2 w-full h-9 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                <Download className="w-3.5 h-3.5" />
                下载音频
              </a>

              <audio ref={audioRef} src={audioUrl} preload="metadata" />
            </div>
          )}

          {/* 音色选择器 - 折叠式 */}
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowVoiceSelector(!showVoiceSelector);
                if (!showVoiceSelector) loadVoices();
              }}
              className="w-full flex items-center justify-between p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all group"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40">
                  当前音色
                </span>
                <span className="text-xs font-bold text-white/80">
                  {selectedVoiceName}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-white/30 transition-transform duration-300',
                  showVoiceSelector && 'rotate-180',
                )}
              />
            </button>

            {showVoiceSelector && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-2">
                {/* 搜索框 */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                  <Input
                    placeholder="搜索音色..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white/[0.03] border-white/5 focus:border-primary/30 h-9 pl-9 text-xs rounded-lg"
                  />
                </div>

                {/* 音色列表 */}
                {isLoadingVoices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto no-scrollbar">
                    {filteredVoices.map((voice) => (
                      <button
                        key={voice.id}
                        onClick={() => handleVoiceSelect(voice)}
                        className={cn(
                          'p-2 rounded-lg border text-left transition-all text-[10px]',
                          selectedVoice === voice.id
                            ? 'bg-primary/15 border-primary/40 text-white'
                            : 'bg-white/[0.02] border-white/5 text-white/50 hover:border-white/10 hover:text-white/70',
                        )}
                      >
                        <div className="font-bold truncate">{voice.name}</div>
                        <div className="text-[8px] text-white/30 mt-0.5 truncate">
                          {voice.type}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 底部生成按钮 */}
        <div className="px-5 py-4 border-t border-white/5 bg-white/[0.01]">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !fullScript}
            className={cn(
              'w-full h-12 rounded-xl font-black uppercase tracking-[0.15em] text-xs transition-all relative overflow-hidden group',
              !audioUrl
                ? 'bg-primary text-primary-foreground hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-primary/20'
                : 'bg-white/10 text-white hover:bg-white/15',
            )}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>合成中...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RotateCcw
                  className={cn(
                    'w-4 h-4 transition-transform duration-500',
                    audioUrl && 'group-hover:rotate-180',
                  )}
                />
                <span>{audioUrl ? '重新合成' : '生成语音'}</span>
              </div>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
