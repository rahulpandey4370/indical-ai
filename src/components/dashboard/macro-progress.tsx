'use client';

import { Progress } from '@/components/ui/progress';

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
    <div className="flex items-center gap-4">
      <p className="w-16 text-xs font-bold uppercase shrink-0">{label}</p>
      <div className="flex-1">
        <Progress
          value={percentage}
          className="h-2 bg-primary-foreground/20"
          indicatorClassName="bg-primary-foreground"
        />
      </div>
      <p className="text-xs font-mono w-24 text-right">
        <span className="font-bold">{value.toFixed(0)}</span> / {goal}g
      </p>
    </div>
  );
}

// Add indicatorClassName to Progress component props
declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      indicatorClassName?: string;
    }
}
