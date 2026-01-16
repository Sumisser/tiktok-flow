import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STYLE_CATEGORIES } from '../../constants/workflow';

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleSelect: (id: string) => void;
}

export default function StyleSelector({
  selectedStyle,
  onStyleSelect,
}: StyleSelectorProps) {
  const selectedStyleConfig = STYLE_CATEGORIES.flatMap((c) => c.styles).find(
    (s) => s.id === selectedStyle,
  );

  return (
    <div className="bg-black/20 border border-white/5 rounded-xl w-full h-full flex flex-col p-3 shadow-inner">
      <Tabs
        defaultValue={STYLE_CATEGORIES[0].name}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="hidden">
          {STYLE_CATEGORIES.map((category) => (
            <TabsTrigger key={category.name} value={category.name}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          {STYLE_CATEGORIES.map((category) => (
            <TabsContent
              key={category.name}
              value={category.name}
              className="mt-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                {category.styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => onStyleSelect(style.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 border uppercase tracking-tighter flex items-center gap-1.5',
                      selectedStyle === style.id
                        ? 'bg-primary/20 text-primary border-primary/50 shadow-lg shadow-primary/5 scale-[1.02]'
                        : 'bg-white/5 text-white/40 border-white/5 hover:border-white/10 hover:text-white/60',
                    )}
                  >
                    {style.label.includes(' ') ? (
                      <>
                        <span className="text-xs">
                          {style.label.split(' ')[0]}
                        </span>
                        <span>{style.label.split(' ').slice(1).join(' ')}</span>
                      </>
                    ) : (
                      style.label
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </div>

        {selectedStyleConfig && (
          <div className="mt-3 flex-none px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <div className="p-1.5 bg-primary/10 rounded-full shrink-0">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 flex items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-black text-primary uppercase">
                  {selectedStyleConfig.label.split(' ').slice(1).join(' ')}
                </span>
              </div>
              <p className="text-[10px] text-foreground/50 leading-relaxed italic line-clamp-2 text-wrap truncate">
                {selectedStyleConfig.description}
              </p>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}
