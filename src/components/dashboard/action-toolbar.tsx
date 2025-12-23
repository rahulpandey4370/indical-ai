
'use client';

import { Camera, Type, Upload, ScanBarcode, MoreVertical, Bot } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useModel } from '@/hooks/use-model';
import { ModelId, modelNames } from '@/lib/types';


interface ActionToolbarProps {
  onAddMeal: (mode: 'meal' | 'barcode' | 'upload' | 'text') => void;
}

export function ActionToolbar({ onAddMeal }: ActionToolbarProps) {
  const { selectedModel, setSelectedModel } = useModel();

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-2 w-full max-w-sm">
        <div className="bg-card/80 dark:bg-slate-900/80 backdrop-blur-xl p-2 rounded-full shadow-2xl flex items-center justify-around border border-border/50">
             <button onClick={() => onAddMeal('barcode')} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><ScanBarcode size={18}/></button>
             <button onClick={() => onAddMeal('text')} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><Type size={18}/></button>
             <button 
                onClick={() => onAddMeal('meal')}
                className="w-12 h-12 bg-gradient-to-br from-primary via-orange-600 to-amber-600 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center text-white active:scale-90 hover:scale-105 transition-transform"
              >
               <Camera size={22}/>
             </button>
             <button onClick={() => onAddMeal('upload')} className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><Upload size={18}/></button>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"><MoreVertical size={18}/></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mb-2 w-56" side="top" align="end">
                    <DropdownMenuLabel className="flex items-center gap-2"><Bot size={14}/> AI Model</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={selectedModel} onValueChange={(val) => setSelectedModel(val as ModelId)}>
                        {modelNames.map(model => (
                            <DropdownMenuRadioItem key={model} value={model}>{model}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
             </DropdownMenu>
        </div>
    </div>
  );
}
