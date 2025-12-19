
'use client';
import { Card } from '@/components/ui/card';
import MacroProgress from './macro-progress';
import { HistoryEntry, UserGoals } from '@/lib/types';
import { parseNutritionString } from '@/lib/utils';
import { addDays, format, isSameDay, subDays, startOfWeek } from 'date-fns';
import { Sparkles, Target, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

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
  
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    onDateChange(subDays(selectedDate, 7));
  };

  const handleNextWeek = () => {
    onDateChange(addDays(selectedDate, 7));
  };

  const totalMacros = entries.reduce(
    (acc, entry) => {
      if (!entry.analysis) return acc;
      const { protein, carbs, fat } = parseNutritionString(entry.analysis);
      acc.protein += protein;
      acc.carbs += carbs;
      acc.fat += fat;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  const totalCalories = entries.reduce((acc, entry) => {
    if (!entry.analysis) return 0;
    const { calories } = parseNutritionString(entry.analysis);
    return acc + calories;
  }, 0);
  
  const caloriesOver = goals.calories > 0 && totalCalories > goals.calories;

  return (
    <div className="w-full space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold tracking-tight">{format(selectedDate, 'MMMM yyyy')}</h3>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <CalendarIcon size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DateCalendar 
                    value={dayjs(selectedDate)}
                    onChange={(newValue) => newValue && onDateChange(newValue.toDate())}
                  />
                </LocalizationProvider>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePreviousWeek} variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeft size={16} />
            </Button>
            <Button onClick={handleNextWeek} variant="outline" size="icon" className="h-8 w-8">
              <ChevronRight size={16} />
            </Button>
          </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {dates.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateChange(date)}
            className={`flex-shrink-0 w-16 h-20 md:w-20 md:h-24 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center transition-all duration-300 flex-1 ${
              isSameDay(date, selectedDate)
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                : 'bg-card text-card-foreground border hover:bg-muted'
            }`}
          >
            <span
              className={`text-[10px] md:text-xs uppercase font-bold tracking-widest mb-1 ${
                isSameDay(date, selectedDate) ? 'opacity-75' : 'opacity-50'
              }`}
            >
              {format(date, 'EEE')}
            </span>
            <span className="text-xl md:text-2xl font-black tracking-tight">{format(date, 'd')}</span>
          </button>
        ))}
      </div>

      <Card className="bg-gradient-to-br from-primary via-orange-600 to-amber-600 text-primary-foreground p-6 md:p-8 rounded-3xl shadow-xl shadow-primary/20 relative overflow-hidden group">
          <div className="absolute -top-4 -right-4 opacity-10 scale-125 group-hover:rotate-6 transition-transform duration-700">
              <Sparkles size={120} />
          </div>
          <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
              <div>
                  <h2 className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Calories Consumed</h2>
                  <div className={cn("flex items-baseline gap-2", caloriesOver && "text-red-300")}>
                      <span className="text-5xl md:text-6xl font-black tracking-tighter">{totalCalories.toLocaleString()}</span>
                      <span className="text-lg font-bold opacity-70">/ {goals.calories.toLocaleString()} kcal</span>
                  </div>
              </div>
              <button onClick={onGoalsClick} className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl hover:bg-white/30 transition-all active:scale-90">
                  <Target size={20}/>
              </button>
          </div>
          <div className="space-y-4 md:space-y-5 relative z-10">
            <MacroProgress label="Protein" value={totalMacros.protein} goal={goals.protein} />
            <MacroProgress label="Carbs" value={totalMacros.carbs} goal={goals.carbs} />
            <MacroProgress label="Fat" value={totalMacros.fat} goal={goals.fat} />
          </div>
      </Card>
    </div>
  );
}
