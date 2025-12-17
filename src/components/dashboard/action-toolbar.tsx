'use client';

import { Button } from '@/components/ui/button';
import { Camera, Type, Upload } from 'lucide-react';

interface ActionToolbarProps {
  onAddMeal: () => void;
}

export function ActionToolbar({ onAddMeal }: ActionToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 p-2 bg-card/80 backdrop-blur-sm rounded-full border shadow-lg">
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" disabled>
          <Type />
        </Button>
        <Button
          size="icon"
          className="rounded-full h-16 w-16 text-2xl"
          onClick={onAddMeal}
        >
          <Camera size={28} />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" disabled>
          <Upload />
        </Button>
      </div>
    </div>
  );
}
