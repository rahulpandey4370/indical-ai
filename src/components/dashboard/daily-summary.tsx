
'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import MacroProgress from './macro-progress';
import { HistoryEntry, UserGoals } from '@/lib/types';
import { parseNutritionString } from '@/lib/utils';
import { addDays, format, isSameDay, subDays } from 'date-fns';
import { Sparkles, Target } from 'lucide-react';

interface DailySummaryProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  entries: HistoryEntry[];
  goals: UserGoals;
  onGoalsClick: () => void;
}

export default function DailySummary({
  selectedDate,
  onDateChange,
  entries,
  goals,
  onGoalsClick,
}: DailySummaryProps) {
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => subDays(today, 7 - i));

  const totalMacros = entries.reduce(
    (acc, entry) => {
      const { protein, carbs, fat } = parseNutritionString(entry.analysis);
      acc.protein += protein;
      acc.carbs += carbs;
      acc.fat += fat;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  const totalCalories = entries.reduce((acc, entry) => {
    const { calories } = parseNutritionString(entry.analysis);
    return acc + calories;
  }, 0);

  const remainingCalories = goals.calories - totalCalories;

  return (
    <div className="w-full space-y-10">
      <div className="flex items-center gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-5 px-5 lg:mx-0 lg:px-0">
        {dates.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateChange(date)}
            className={`flex-shrink-0 w-20 h-24 rounded-[28px] flex flex-col items-center justify-center transition-all duration-500 ${
              isSameDay(date, selectedDate)
                ? 'bg-gradient-to-br from-primary to-amber-600 text-white shadow-2xl shadow-primary/30 scale-105 ring-4 ring-primary/10'
                : 'bg-card text-card-foreground border border-border hover:bg-muted'
            }`}
          >
            <span
              className={`text-[11px] uppercase font-black tracking-[0.2em] mb-2 ${
                isSameDay(date, selectedDate) ? 'opacity-100' : 'opacity-40'
              }`}
            >
              {format(date, 'EEE')}
            </span>
            <span className="text-2xl font-black">{format(date, 'd')}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-8">
            <Card className="bg-gradient-to-br from-primary via-orange-600 to-amber-600 text-primary-foreground p-10 rounded-[44px] shadow-2xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Sparkles size={120} />
                </div>
                <div className="flex justify-between items-start mb-10 relative z-10">
                    <div>
                        <h2 className="text-xs font-black opacity-80 uppercase tracking-[0.2em] mb-2">Remaining Energy</h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-black tracking-tighter">{Math.max(0, remainingCalories).toLocaleString()}</span>
                            <span className="text-xl font-bold opacity-70">kcal</span>
                        </div>
                    </div>
                    <button onClick={onGoalsClick} className="p-4 bg-white/20 backdrop-blur-xl rounded-3xl hover:bg-white/30 transition-all active:scale-90">
                        <Target size={24}/>
                    </button>
                </div>
                <div className="space-y-7 relative z-10">
                  <MacroProgress label="Protein" value={totalMacros.protein} goal={goals.protein} />
                  <MacroProgress label="Carbs" value={totalMacros.carbs} goal={goals.carbs} />
                  <MacroProgress label="Fat" value={totalMacros.fat} goal={goals.fat} />
                </div>
            </Card>
        </div>
        <div className='lg:col-span-7'>
           {/* Placeholder for future content next to summary card */}
        </div>
      </div>
    </div>
  );
}
