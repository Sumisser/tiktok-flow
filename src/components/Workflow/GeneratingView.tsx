import { useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface GeneratingViewProps {
  streamingText: string;
}

export default function GeneratingView({ streamingText }: GeneratingViewProps) {
  const streamingContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamingContainerRef.current) {
      streamingContainerRef.current.scrollTop =
        streamingContainerRef.current.scrollHeight;
    }
  }, [streamingText]);

  return (
    <div className="relative min-h-[500px] flex flex-col items-center justify-center animate-in fade-in duration-700">
      {/* 装饰性漂浮粒子 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary/30 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-accent/30 rounded-full blur-[160px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {streamingText ? (
          <div className="w-full max-w-lg bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500/60 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
                <div className="w-2 h-2 rounded-full bg-white/10" />
              </div>
              <div className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] ml-1">
                AI Draft
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span className="text-[8px] text-primary/60 font-bold uppercase tracking-widest">
                  Streaming
                </span>
              </div>
            </div>
            <div
              ref={streamingContainerRef}
              className="max-h-[200px] overflow-y-auto no-scrollbar scroll-smooth"
            >
              <p className="text-[12px] text-white/60 font-mono leading-relaxed whitespace-pre-wrap break-words">
                {streamingText}
                <span className="inline-block w-1.5 h-4 bg-primary/50 animate-pulse ml-0.5 align-middle" />
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-[-40px] rounded-full border border-primary/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <div className="absolute inset-[-20px] rounded-full border border-primary/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />

            <div className="p-8 rounded-full bg-white/5 ring-1 ring-white/10 shadow-[0_0_60px_rgba(var(--primary),0.3)] relative backdrop-blur-md overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-primary/20 animate-spin-slow opacity-50" />
              <Sparkles className="w-12 h-12 text-white animate-pulse-slow drop-shadow-[0_0_15px_rgba(255,255,255,0.6)] relative z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/30 blur-2xl animate-pulse rounded-full" />
            </div>
          </div>
        )}

        <div className="text-center space-y-4 max-w-[450px]">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
              {streamingText ? '正在生成创意内容' : '正在捕捉灵感细节'}
            </h3>
            <p className="text-[14px] text-white/70 uppercase tracking-[0.4em] font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              AI Creative Director is active
            </p>
          </div>

          <div className="w-48 h-[2px] bg-white/5 rounded-full overflow-hidden relative shadow-[0_0_15px_rgba(255,255,255,0.1)] mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite] w-[50%]" />
          </div>

          {!streamingText && (
            <div className="h-8 overflow-hidden relative w-full px-4">
              <div className="animate-[slide-up_8s_infinite] flex flex-col items-center gap-0">
                <span className="h-8 text-lg text-white font-bold drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
                  正在尝试感知您的创意初衷...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 left-0 w-full text-center">
        <span className="text-[12px] text-white/50 font-bold italic tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          "Great stories take a few seconds to breathe..."
        </span>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slide-up {
          0%, 15% { transform: translateY(0); }
          20%, 35% { transform: translateY(-32px); }
          40%, 55% { transform: translateY(-32px); }
          60%, 75% { transform: translateY(-32px); }
          80%, 95% { transform: translateY(-32px); }
          100% { transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
      `,
        }}
      />
    </div>
  );
}
