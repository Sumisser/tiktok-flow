import { cn } from '@/lib/utils';
import { MODELS } from '../../constants/workflow';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (id: string) => void;
}

export default function ModelSelector({
  selectedModel,
  onModelSelect,
}: ModelSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl rounded-xl border border-white/5 w-fit mx-auto scale-90 shadow-2xl">
      {MODELS.map((m) => (
        <button
          key={m.id}
          onClick={() => onModelSelect(m.id)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 relative group',
            selectedModel === m.id
              ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] scale-105'
              : 'text-white/30 hover:text-white/70 hover:bg-white/5',
          )}
          title={m.name}
        >
          {m.logo ? (
            <img
              src={m.logo}
              alt={m.vendor}
              className={cn(
                'w-4 h-4 object-contain transition-all duration-300',
                selectedModel === m.id
                  ? 'opacity-100 grayscale-0'
                  : 'opacity-40 grayscale group-hover:opacity-80 group-hover:grayscale-0',
              )}
            />
          ) : (
            <div
              className={cn(
                'w-4 h-4 flex items-center justify-center transition-all duration-300',
                selectedModel === m.id ? 'text-white' : 'text-white/40',
              )}
            >
              {m.icon}
            </div>
          )}
          <span
            className={cn(
              'text-[10px] font-black uppercase tracking-widest leading-none',
              selectedModel === m.id
                ? 'text-white'
                : 'text-white/40 group-hover:text-white/60',
            )}
          >
            {m.name}
          </span>
        </button>
      ))}
    </div>
  );
}
