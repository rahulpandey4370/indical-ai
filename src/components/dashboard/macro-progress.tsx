
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
  const isOver = percentage > 100;

  // Dynamic color: starts white, transitions to yellow as it nears 100%, turns red if over
  const barColor = isOver
    ? 'bg-red-400'
    : percentage > 85
    ? 'bg-yellow-300'
    : 'bg-white';

  return (
    <div className="space-y-3">
        <div className={cn("flex justify-between items-center text-[11px] font-black uppercase tracking-[0.15em] drop-shadow-sm", isOver && "text-red-300")}>
          <span className="opacity-80">{label}</span>
          <span>{Math.round(value)} / {goal}g</span>
        </div>
        <div className="h-2.5 bg-black/10 rounded-full overflow-hidden p-0.5">
            <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)] ${barColor}`}
                style={{width: `${Math.min(100, percentage)}%`}} 
            />
        </div>
    </div>
  );
}
