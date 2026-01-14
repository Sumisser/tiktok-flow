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
    <div className="flex items-center justify-center gap-1 p-1 bg-black/40 rounded-lg border border-white/5 w-fit mx-auto scale-90">
      {MODELS.map((m) => (
        <button
          key={m.id}
          onClick={() => onModelSelect(m.id)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-300 relative group',
            selectedModel === m.id
              ? 'bg-white/10 text-white border border-white/10 shadow-lg'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5',
          )}
          title={m.name}
        >
          <span
            className={cn(
              'text-[9px] font-black uppercase tracking-widest leading-none',
              selectedModel === m.id ? 'text-white' : 'text-white/40',
            )}
          >
            {m.name}
          </span>
        </button>
      ))}
    </div>
  );
}
