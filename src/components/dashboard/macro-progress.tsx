'use client';

import { cn } from "@/lib/utils";

interface MacroProgressProps {
  label: string;
  value: number;
  goal: number;
}

export default function MacroProgress({
  label,
  value,
  goal,
}: MacroProgressProps) {
  const percentage = goal > 0 ? (value / goal) * 100 : 0;

  const getBarColor = () => {
    if (label === 'Protein') {
      if (percentage > 150) return 'bg-red-400';
      if (percentage >= 70) return 'bg-green-400';
      return 'bg-yellow-400';
    } else {
      if (percentage > 100) return 'bg-red-400';
      if (percentage >= 70) return 'bg-green-400';
      return 'bg-yellow-400';
    }
  };

  const isOver = label === 'Protein' ? percentage > 150 : percentage > 100;
  const barColor = getBarColor();

  return (
    <div className="space-y-3">
        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.15em]" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>
          <span className="opacity-80">{label}</span>
          <span className={cn(isOver && "text-red-300")}>{Math.round(value)} / {goal}g</span>
        </div>
        <div className="h-2.5 bg-black/10 rounded-full overflow-hidden p-0.5">
            <div 
                className={cn('h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]', barColor)}
                style={{width: `${Math.min(100, percentage)}%`}} 
            />
        </div>
    </div>
  );
}
