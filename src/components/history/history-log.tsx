'use client';
import { useState } from 'react';
import Image from 'next/image';
import { HistoryEntry, MealType, UserGoals, AnalyzeMealCompositionOutput } from '@/lib/types';
import { Trash2, ChevronRight, Utensils, Coffee, Sun, Moon, Cookie, BrainCircuit, Sparkles, Star, Award, TrendingDown, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseNutritionString } from '@/lib/utils';
import { analyzeMealComposition } from '@/ai/flows/analyze-meal-composition';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistoryLogProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  goals: UserGoals;
}

const mealOrder: MealType[] = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

const MealTypeIcon = ({ type }: { type?: MealType }) => {
  switch (type) {
    case 'Breakfast': return <Coffee size={20} className="text-amber-500" />;
    case 'Lunch': return <Sun size={20} className="text-orange-500" />;
    case 'Dinner': return <Moon size={20} className="text-indigo-500" />;
    case 'Snack': return <Cookie size={20} className="text-yellow-600" />;
    default: return null;
  }
};

export const AnalysisModal = ({ 
  isOpen, setIsOpen, isAnalyzing, analysisResult, setAnalysisResult, title, description 
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAnalyzing: boolean;
  analysisResult: AnalyzeMealCompositionOutput | null;
  setAnalysisResult: (result: AnalyzeMealCompositionOutput | null) => void;
  title: string;
  description: string;
}) => {
  return (
     <Dialog open={isOpen} onOpenChange={(isOpen) => {
        setIsOpen(isOpen);
        if (!isOpen) setAnalysisResult(null);
      }}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="p-6">
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
              <Sparkles className="text-primary"/>
              {title}
            </DialogTitle>
             <DialogDescription>
                {description}
             </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="px-6 pb-6 space-y-6">
              {isAnalyzing && <div className="flex justify-center items-center h-48"><Loader2 className="animate-spin text-primary" size={32}/></div>}
              {analysisResult && (
                <div className="space-y-4 animate-in fade-in-50">
                   <div className="text-center bg-muted p-6 rounded-2xl">
                      <p className="font-extrabold text-2xl text-primary">{analysisResult.title}</p>
                      <p className="text-muted-foreground font-semibold mt-1">{analysisResult.overallAssessment}</p>
                      <Badge variant="outline" className="mt-4 text-lg font-bold py-1 px-4">
                         Rating: {analysisResult.mealRating}/10 <Star size={16} className="ml-2 text-yellow-400"/>
                      </Badge>
                   </div>
                   
                   <div className="space-y-4">
                      {analysisResult.whatWentWell && analysisResult.whatWentWell.length > 0 && (
                        <div>
                          <h4 className="font-bold flex items-center gap-2 mb-2"><Award className="text-green-500"/> What Went Well</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                            {analysisResult.whatWentWell.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}

                      {analysisResult.areasForImprovement && analysisResult.areasForImprovement.length > 0 && (
                        <div>
                          <h4 className="font-bold flex items-center gap-2 mb-2"><TrendingDown className="text-red-500"/> Areas for Improvement</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                            {analysisResult.areasForImprovement.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
  )
}

const HistoryLog: React.FC<HistoryLogProps> = ({
  history,
  onSelect,
  onDelete,
  goals
}) => {
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMealCompositionOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMealType, setCurrentMealType] = useState<MealType | null>(null);


  const handleAnalyzeMeal = async (mealType: MealType, entries: HistoryEntry[]) => {
    if (entries.length === 0) {
      toast({ title: 'No entries to analyze for this meal.', variant: 'destructive' });
      return;
    }
    setIsAnalyzing(true);
    setIsModalOpen(true);
    setCurrentMealType(mealType);
    setAnalysisResult(null);
    try {
      const summarizedEntries = entries.map(entry => ({
        mealName: entry.mealName || entry.analysis.summary,
        total_calories: entry.analysis.total_calories,
        total_macros: entry.analysis.total_macros,
        mealType: entry.mealType || 'Snack',
      }));

      const result = await analyzeMealComposition({
        mealType,
        mealEntries: summarizedEntries,
        userGoals: goals,
      });
      setAnalysisResult(result);
    } catch (e: any) {
      toast({ title: 'Analysis Failed', description: e.message, variant: 'destructive' });
      setIsModalOpen(false);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const meals = mealOrder.map(mealType => {
    const entries = history.filter(h => h.mealType === mealType);
    const totalCalories = entries.reduce((acc, curr) => acc + parseNutritionString(curr.analysis).calories, 0);
    return {
      type: mealType,
      entries,
      totalCalories
    };
  });
  
  if (history.length === 0) {
    return (
     <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600 bg-card dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-border dark:border-white/5 mx-2 shadow-sm animate-in fade-in zoom-in duration-500">
       <div className="relative mb-6">
         <Utensils size={72} className="opacity-10 text-primary" />
         <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
       </div>
       <p className="text-2xl font-black opacity-30 tracking-tight">Empty Logbook</p>
       <p className="text-[10px] opacity-20 font-black uppercase tracking-[0.2em] mt-2">Ready for your first scan</p>
     </div>
   );
 }

  return (
    <div className="grid grid-cols-1 gap-8 px-1 pb-24 pt-8">
      {meals.map(meal => (
        meal.entries.length > 0 && (
          <Card key={meal.type} className="rounded-[40px] shadow-lg border flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <MealTypeIcon type={meal.type} />
                  <CardTitle className="font-black text-2xl tracking-tighter">{meal.type}</CardTitle>
                </div>
                <div className='flex items-center gap-2'>
                  <Button variant="outline" size="sm" onClick={() => handleAnalyzeMeal(meal.type, meal.entries)} disabled={meal.entries.length === 0} className="hover:scale-105 active:scale-95 transition-transform duration-200">
                    <BrainCircuit size={16} className="mr-2"/> Analyze Meal
                  </Button>
                  <div className='text-right'>
                    <p className="font-bold text-lg">{meal.totalCalories} <span className="text-xs text-muted-foreground">kcal</span></p>
                    <p className="text-xs text-muted-foreground">/ {Math.round(goals.calories/4)} kcal</p>
                  </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-3">
                  {meal.entries.map(entry => (
                    <HistoryItem key={entry.id} entry={entry} onSelect={onSelect} onDelete={onDelete} />
                  ))}
                </div>
            </CardContent>
          </Card>
        )
      ))}

      <AnalysisModal 
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        isAnalyzing={isAnalyzing}
        analysisResult={analysisResult}
        setAnalysisResult={setAnalysisResult}
        title={`${currentMealType} Analysis`}
        description={`Here's a breakdown of your ${currentMealType?.toLowerCase()}.`}
      />
    </div>
  );
};


const HistoryItem = ({entry, onSelect, onDelete}: {entry: HistoryEntry, onSelect: (e:HistoryEntry) => void, onDelete: (id: string) => void}) => {

  return (
     <div
          onClick={() => onSelect(entry)}
          className="group flex items-center gap-4 p-3 bg-card rounded-2xl shadow-sm border border-border cursor-pointer active:scale-[0.98] hover:shadow-xl hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
        >
          <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border shadow-inner">
            {entry.imageUrl ? (
              <Image
                src={entry.imageUrl}
                alt={entry.mealName || "Meal"}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                width={64}
                height={64}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/5">
                <Utensils className="opacity-30 text-primary" size={24} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-card-foreground truncate text-base mb-1 group-hover:text-primary transition-colors tracking-tight">
              {entry.mealName || entry.analysis.items.map(i => i.name).join(', ')}
            </h4>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-foreground tracking-tighter">
                {entry.analysis.total_calories}
              </span>
              <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                kcal
              </span>
               <span className="text-[10px] font-bold opacity-40">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex gap-1 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {e.stopPropagation();}}
                  className="rounded-lg h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                >
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this meal log from your history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
  )
}

export default HistoryLog;

    