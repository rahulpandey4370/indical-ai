
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { HistoryEntry } from '@/lib/types';
import { Copy, Check, Trash2, ChevronRight, Utensils, Coffee, Sun, Moon as MoonIcon, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HistoryLogProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}

const MealTypeIcon = ({type}: {type?: string}) => {
    switch (type) {
        case 'Breakfast': return <Coffee size={16} className="text-amber-500" />;
        case 'Lunch': return <Sun size={16} className="text-orange-500" />;
        case 'Dinner': return <MoonIcon size={16} className="text-indigo-500" />;
        case 'Snack': return <Cookie size={16} className="text-yellow-600" />;
        default: return null;
    }
}

const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  onSelect,
  onDelete,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent, entry: HistoryEntry) => {
    e.stopPropagation();
    const itemsList = entry.analysis.items.map(i => `${i.name} (${i.weight_g}g)`).join(', ');
    const textToCopy = `IndiCal AI Log:\nMeal: ${itemsList}\nTotal: ${entry.analysis.total_calories} kcal\nDate: ${new Date(entry.timestamp).toLocaleString()}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  if (history.length === 0) {
     return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600 bg-card dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-border dark:border-white/5 mx-2 shadow-sm animate-in fade-in zoom-in duration-500">
        <div className="relative mb-6">
          <Utensils size={72} className="opacity-10 text-primary" />
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
        </div>
        <p className="text-2xl font-black opacity-30 tracking-tight">Empty Logbook</p>
        <p className="text-[10px] opacity-20 font-black uppercase tracking-[0.2em] mt-2">Ready for your first scan</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-1 pb-24 pt-8">
      {history.map((entry) => (
        <div
          key={entry.id}
          onClick={() => onSelect(entry)}
          className="group flex items-center gap-6 p-6 bg-card rounded-[40px] shadow-sm border border-border cursor-pointer active:scale-[0.98] hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1 transition-all duration-500 overflow-hidden"
        >
          <div className="h-20 w-20 lg:h-24 lg:w-24 rounded-[32px] overflow-hidden flex-shrink-0 bg-muted border border-border shadow-inner">
            {entry.imageUrl ? (
              <Image
                src={entry.imageUrl}
                alt="Meal"
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                width={96}
                height={96}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                <Utensils className="opacity-30 text-primary" size={28} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {entry.mealType && (
                 <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                    <MealTypeIcon type={entry.mealType} />
                    {entry.mealType}
                </span>
              )}
              <span className="text-[10px] font-bold opacity-40">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <h4 className="font-black text-card-foreground truncate text-xl mb-1.5 group-hover:text-primary transition-colors tracking-tight">
              {entry.analysis.items.map(i => i.name).join(', ')}
            </h4>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-foreground tracking-tighter">
                {entry.analysis.total_calories}
              </span>
              <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">
                kcal
              </span>
            </div>
          </div>

          <div className="flex gap-2 items-center lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleCopy(e, entry)}
              className={`rounded-2xl transition-all duration-300 ${
                copiedId === entry.id
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {copiedId === entry.id ? <Check size={18} /> : <Copy size={18} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleAction(e, () => onDelete(entry.id))}
              className="rounded-2xl bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
            >
              <Trash2 size={18} />
            </Button>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary lg:block hidden">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryLog;
