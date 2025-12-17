
'use client';

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

  return (
    <div className="space-y-3">
        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-[0.15em]">
          <span className="opacity-80">{label}</span>
          <span>{Math.round(value)} / {goal}g</span>
        </div>
        <div className="h-2.5 bg-black/10 rounded-full overflow-hidden p-0.5">
            <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                style={{width: `${Math.min(100, percentage)}%`}} 
            />
        </div>
    </div>
  );
}
