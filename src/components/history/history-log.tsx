
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { HistoryEntry, MealType } from '@/lib/types';
import { Copy, Check, Trash2, ChevronRight, Utensils, Coffee, Sun, Moon, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { parseNutritionString } from '@/lib/utils';

interface HistoryLogProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  goals: {calories: number};
}

const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealTypeIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case 'Breakfast': return <Coffee size={20} className="text-amber-500" />;
    case 'Lunch': return <Sun size={20} className="text-orange-500" />;
    case 'Dinner': return <Moon size={20} className="text-indigo-500" />;
    case 'Snack': return <Cookie size={20} className="text-yellow-600" />;
    default: return null;
  }
};

const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  onSelect,
  onDelete,
  goals
}) => {

  const meals = mealOrder.map(mealType => {
    const entries = history.filter(h => h.mealType === mealType);
    const totalCalories = entries.reduce((acc, curr) => acc + parseNutritionString(curr.analysis).calories, 0);
    return {
      type: mealType,
      entries,
      totalCalories
    };
  });
  
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
    <div className="grid grid-cols-1 gap-8 px-1 pb-24 pt-8">
      {meals.map(meal => (
        <Card key={meal.type} className="rounded-[40px] shadow-lg border flex flex-col">
           <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <MealTypeIcon type={meal.type} />
                <CardTitle className="font-black text-2xl tracking-tighter">{meal.type}</CardTitle>
              </div>
              <div className='text-right'>
                <p className="font-bold text-lg">{meal.totalCalories} <span className="text-xs text-muted-foreground">kcal</span></p>
                <p className="text-xs text-muted-foreground">/ {Math.round(goals.calories/4)} kcal</p>
              </div>
           </CardHeader>
           <CardContent className="flex-1">
              {meal.entries.length > 0 ? (
                <div className="space-y-3">
                  {meal.entries.map(entry => (
                    <HistoryItem key={entry.id} entry={entry} onSelect={onSelect} onDelete={onDelete} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-2xl p-8 text-center">
                  <Utensils size={32} className="opacity-50 mb-2"/>
                  <p className="text-sm font-bold">No {meal.type} logged</p>
                </div>
              )}
           </CardContent>
        </Card>
      ))}
    </div>
  );
};


const HistoryItem = ({entry, onSelect, onDelete}: {entry: HistoryEntry, onSelect: (e:HistoryEntry) => void, onDelete: (id: string) => void}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const itemsList = entry.analysis.items.map(i => `${i.name} (${i.weight}${i.unit})`).join(', ');
    const textToCopy = `IndiCal AI Log:\nMeal: ${itemsList}\nTotal: ${entry.analysis.total_calories} kcal\nDate: ${new Date(entry.timestamp).toLocaleString()}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
     <div
          onClick={() => onSelect(entry)}
          className="group flex items-center gap-4 p-3 bg-card rounded-2xl shadow-sm border border-border cursor-pointer active:scale-[0.98] hover:shadow-xl hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
        >
          <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border shadow-inner">
            {entry.imageUrl ? (
              <Image
                src={entry.imageUrl}
                alt={entry.mealName || "Meal"}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                width={64}
                height={64}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                <Utensils className="opacity-30 text-primary" size={24} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-card-foreground truncate text-base mb-1 group-hover:text-primary transition-colors tracking-tight">
              {entry.mealName || entry.analysis.items.map(i => i.name).join(', ')}
            </h4>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-foreground tracking-tighter">
                {entry.analysis.total_calories}
              </span>
              <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                kcal
              </span>
               <span className="text-[10px] font-bold opacity-40">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {e.stopPropagation(); onDelete(entry.id)}}
              className="rounded-lg h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
            >
              <Trash2 size={16} />
            </Button>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
  )
}

export default HistoryLog;
