
'use client';

import { Camera, Type, Upload, ScanBarcode } from 'lucide-react';

interface ActionToolbarProps {
  onAddMeal: (mode: 'meal' | 'barcode' | 'upload' | 'text') => void;
}

export function ActionToolbar({ onAddMeal }: ActionToolbarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-xs sm:max-w-sm md:bottom-auto md:top-5">
        <div className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-xl p-2.5 rounded-full shadow-2xl flex items-center justify-around border border-border/50">
             <button onClick={() => onAddMeal('barcode')} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><ScanBarcode size={20}/></button>
             <button onClick={() => onAddMeal('text')} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><Type size={20}/></button>
             <button 
                onClick={() => onAddMeal('meal')}
                className="w-14 h-14 bg-gradient-to-br from-primary via-orange-600 to-amber-600 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white active:scale-90 hover:scale-105 transition-transform"
              >
               <Camera size={24}/>
             </button>
             <button onClick={() => onAddMeal('upload')} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><Upload size={20}/></button>
        </div>
    </div>
  );
}
