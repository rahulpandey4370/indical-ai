
'use client';

import { Button } from '@/components/ui/button';
import { Camera, Type, Upload, ScanBarcode, Bot } from 'lucide-react';

interface ActionToolbarProps {
  onAddMeal: (mode: 'meal' | 'barcode' | 'upload' | 'text') => void;
}

export function ActionToolbar({ onAddMeal }: ActionToolbarProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 w-full max-w-sm">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl px-10 py-6 rounded-[48px] shadow-2xl flex items-center justify-between border border-white/20 dark:border-white/5 ring-1 ring-black/5">
             <button onClick={() => onAddMeal('barcode')} className="text-slate-400 hover:text-primary transition-colors p-2"><ScanBarcode size={26}/></button>
             <button onClick={() => onAddMeal('text')} className="text-slate-400 hover:text-primary transition-colors p-2"><Type size={26}/></button>
             <button 
                onClick={() => onAddMeal('meal')}
                className="w-24 h-24 -mt-20 bg-gradient-to-br from-primary via-orange-600 to-amber-600 rounded-[38px] shadow-2xl shadow-primary/40 flex items-center justify-center text-white active:scale-90 hover:rotate-3 transition-all border-[8px] border-background"
              >
               <Camera size={42}/>
             </button>
             <button onClick={() => onAddMeal('upload')} className="text-slate-400 hover:text-primary transition-colors p-2"><Upload size={26}/></button>
             {/* This button has been moved to the header, but keeping it here as reference in case we need it */}
             {/* <button onClick={() => {}} className="text-slate-400 hover:text-primary transition-colors p-2"><Bot size={26}/></button> */}
        </div>
    </div>
  );
}
