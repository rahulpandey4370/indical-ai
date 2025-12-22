
'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Image from 'next/image';
import { analyzeIndianFoodImage } from '@/ai/flows/analyze-indian-food-image';
import { refineNutritionalAnalysis } from '@/ai/flows/refine-nutritional-analysis';
import { Send, Save, Loader2, CheckCircle, Bot, AlertTriangle, Calendar as CalendarIcon, X } from 'lucide-react';
import { commitToJourney } from '@/lib/actions';
import type {
  NutritionalAnalysis,
  HistoryEntry,
  ChatMessage,
  MealType,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NutritionalChart } from './nutritional-chart';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { useModel } from '@/hooks/use-model'; // Import the new hook
import { Utensils } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';

export function AnalysisPanel({
  closePanel,
  existingEntry,
}: {
  closePanel: (refresh?: boolean) => void;
  existingEntry: HistoryEntry;
}) {
  const { user } = useUser();
  const { model, incrementModelUsage } = useModel(); // Get model utility
  const [imagePreview, setImagePreview] = useState<string | null>(
    existingEntry?.imageUrl || null
  );
  
  const [analysisResult, setAnalysisResult] = useState<NutritionalAnalysis | null>(existingEntry?.analysis || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [refinementInput, setRefinementInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [mealType, setMealType] = useState<MealType>(existingEntry?.mealType || 'Lunch');
  const [mealName, setMealName] = useState<string>(existingEntry?.mealName || '');
  const [entryDate, setEntryDate] = useState<Date>(new Date(existingEntry.timestamp));

  const [isCommitPending, startCommitTransition] = useTransition();
  const { toast } = useToast();
  const analysisChatScrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // If it's a new entry (not editing), and there's no analysis result yet, run analysis.
    if (!existingEntry.id && !analysisResult) {
      handleInitialAnalysis();
    } else if (existingEntry.id) {
       setChatMessages([{ role: 'model', text: "Ready to update this entry. What changed?" }]);
    }
  }, []);

  useEffect(() => {
    analysisChatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleInitialAnalysis = async () => {
    if (!existingEntry.mode) {
        setAnalysisError("Analysis mode is not defined.");
        return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    incrementModelUsage(model);
    try {
      const result = await analyzeIndianFoodImage({
        photoDataUri: existingEntry.imageUrl, // This is now a URL, not base64
        textInput: existingEntry.textInput,
        mode: existingEntry.mode,
      }, model);
      setAnalysisResult(result);
      if (!mealName && existingEntry.mode === 'text' && result.items.length === 1) {
        setMealName(result.items[0].name);
      } else if (!mealName) {
        setMealName(result.summary);
      }
      setChatMessages([{ role: 'model', text: `I've analyzed your ${existingEntry.mode}. Everything looks high quality! I found ${result.items.length} items.` }]);
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred during analysis.';
      setAnalysisError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementInput.trim() || !analysisResult) return;

    const userMsg = { role: 'user' as const, text: refinementInput };
    setChatMessages(prev => [...prev, userMsg]);
    setRefinementInput("");
    setIsRefining(true);
    incrementModelUsage(model);
    try {
      const response = await refineNutritionalAnalysis({
        initialAnalysis: analysisResult,
        refinementInstruction: userMsg.text,
      }, model);
      if (response.refinedAnalysis) {
        setAnalysisResult(response.refinedAnalysis);
      }
      setChatMessages(prev => [...prev, { role: 'model', text: response.responseText }]);
    } catch (e: any) {
      const errorMessage = e.message || "Sorry, I couldn't refine that right now.";
      setChatMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
      toast({
        variant: 'destructive',
        title: 'Refinement Failed',
        description: errorMessage,
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCommit = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to commit to your journey.',
      });
      return;
    }
    if (!analysisResult) return;

    startCommitTransition(async () => {
      // Create a new date object from entryDate but keep the time from the original timestamp
      const originalTime = new Date(existingEntry.timestamp);
      const finalDate = new Date(entryDate);
      finalDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds(), originalTime.getMilliseconds());
      
      const result = await commitToJourney(
        analysisResult,
        imagePreview,
        finalDate,
        user.id,
        mealType,
        existingEntry?.id,
        existingEntry?.mode,
        existingEntry?.textInput,
        mealName,
      );
      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        closePanel(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    });
  };
  
  return (
    <div className="relative">
      <Button
        onClick={() => closePanel()}
        variant="ghost"
        size="icon"
        className="absolute -top-4 right-0 z-10 h-12 w-12 rounded-full bg-background/50 backdrop-blur-md"
      >
        <X className="h-6 w-6" />
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 pb-32">
          <div className="space-y-10">
            {imagePreview && (
              <div className="rounded-[56px] overflow-hidden shadow-2xl aspect-square bg-white border-[12px] border-white dark:border-slate-900 ring-1 ring-slate-200/50 dark:ring-white/5 group relative">
                <Image src={imagePreview} alt="Meal" layout="fill" objectFit="cover" className="group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
            )}
            {isAnalyzing && (
              <div className="py-24 text-center flex flex-col items-center">
                <div className="relative">
                  <Loader2 className="animate-spin text-primary mb-8" size={72} strokeWidth={3} />
                  <div className="absolute inset-0 bg-primary blur-2xl opacity-20 animate-pulse"></div>
                </div>
                <p className="font-black text-3xl tracking-tight mb-2">Deconstructing Dishes...</p>
                <p className="text-sm font-medium opacity-40 uppercase tracking-[0.2em]">AI Vision Active</p>
              </div>
            )}
            {analysisError && !isAnalyzing && (
              <Alert variant="destructive" className="rounded-[44px] p-8">
                <AlertTriangle className="h-6 w-6" />
                <AlertTitle className="text-xl font-black mt-2">Analysis Failed</AlertTitle>
                <AlertDescription className="mt-4 font-mono bg-destructive/10 p-4 rounded-lg text-destructive-foreground/80 break-words">
                  {analysisError}
                </AlertDescription>
                <div className="mt-6">
                  <Button onClick={handleInitialAnalysis} variant="destructive">
                    Try Again
                  </Button>
                  <Button onClick={() => closePanel()} variant="ghost" className="ml-2">
                    Cancel
                  </Button>
                </div>
              </Alert>
            )}

            {!isAnalyzing && !analysisError && analysisResult && (
              <div className="bg-card rounded-[56px] p-10 shadow-2xl border border-border space-y-12">
                <div className="animate-in fade-in zoom-in duration-700">
                    <NutritionalChart analysis={analysisResult} />
                </div>
                
                <div className="p-8 bg-muted/50 dark:bg-slate-800/50 rounded-[44px] border border-border/50 shadow-inner animate-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-baseline gap-3">
                        <span className="text-8xl font-black tracking-tighter text-primary leading-none">{analysisResult.total_calories}</span>
                        <span className="text-xl font-black opacity-30 uppercase tracking-[0.1em]">Total Kcal</span>
                      </div>
                      <div className='text-right text-sm font-bold text-muted-foreground'>
                          <div>P: {analysisResult.total_macros.protein}g</div>
                          <div>C: {analysisResult.total_macros.carbs}g</div>
                          <div>F: {analysisResult.total_macros.fat}g</div>
                      </div>
                    </div>
                    <p className="text-sm opacity-50 leading-relaxed font-bold italic border-l-4 border-primary pl-4 py-1 mt-4">
                      "{analysisResult.summary}"
                    </p>
                </div>
                
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40">Composition Details</h4>
                      <span className="text-[10px] font-black text-primary-foreground px-4 py-1.5 bg-foreground rounded-full shadow-lg">
                        {analysisResult.items.length} ITEM{analysisResult.items.length !== 1 ? 'S' : ''}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {analysisResult.items.map((item, i) => (
                        <div 
                          key={i} 
                          className="group p-6 bg-card rounded-[38px] border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-in slide-in-from-right-4"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                <Utensils size={24} />
                              </div>
                              <div>
                                <div className="font-black text-xl tracking-tight group-hover:text-primary transition-colors">{item.name}</div>
                                <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-1">{item.weight}{item.unit} Serving</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-3xl tracking-tighter text-foreground">{item.calories}</div>
                              <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em]">Kcal</div>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-muted-foreground bg-muted/50 p-2 rounded-2xl">
                              <div>P: {item.macros.protein}g</div>
                              <div>C: {item.macros.carbs}g</div>
                              <div>F: {item.macros.fat}g</div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6 flex flex-col h-full">
            {!isAnalyzing && !analysisError && analysisResult && (
                <>
                  <div className="flex-1 flex flex-col bg-card rounded-[56px] border border-border shadow-2xl overflow-hidden min-h-[500px] animate-in slide-in-from-bottom-8 duration-700">
                    <div className="p-8 border-b border-border bg-muted/50 flex items-center justify-between backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <Bot className="text-primary" size={24} />
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">AI Dialogue</h4>
                      </div>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] opacity-40">Session Verified</span>
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                      {chatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-7 rounded-[38px] shadow-sm text-sm font-bold leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted text-foreground rounded-tl-none'}`}>
                            {m.text}
                          </div>
                        </div>
                      ))}
                      {isRefining && (
                        <div className="flex justify-start">
                          <div className="px-8 py-5 rounded-[38px] bg-muted/50 flex gap-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                          </div>
                        </div>
                      )}
                      <div ref={analysisChatScrollRef} />
                    </div>
                    
                    <div className="p-8 bg-muted/30 border-t border-border">
                      <div className="relative flex items-center">
                        <Input 
                          type="text" 
                          value={refinementInput}
                          onChange={(e) => setRefinementInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                          placeholder="Portion incorrect? Just tell me..."
                          className="w-full bg-background pl-6 pr-20 py-8 rounded-[32px] border-border focus:ring-8 focus:ring-primary/5 text-sm font-bold shadow-sm transition-all placeholder:opacity-40"
                        />
                        <Button onClick={handleRefine} disabled={isRefining} size="icon" className="absolute right-4 p-4 h-14 w-14 bg-foreground text-background rounded-2xl shadow-xl active:scale-90 hover:scale-105 transition-all">
                          <Send size={22}/>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">Meal Name</label>
                          <Input 
                              value={mealName}
                              onChange={(e) => setMealName(e.target.value)}
                              placeholder="e.g., Post-workout Lunch"
                              className="w-full mt-1 py-6 rounded-2xl text-lg font-bold border-2"
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">Meal Type</label>
                          <Select value={mealType} onValueChange={(v: MealType) => setMealType(v)}>
                              <SelectTrigger className="w-full mt-1 py-6 rounded-2xl text-lg font-bold border-2">
                                  <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                                  <SelectItem value="Lunch">Lunch</SelectItem>
                                  <SelectItem value="Dinner">Dinner</SelectItem>
                                  <SelectItem value="Snack">Snack</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1">
                      <div>
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider pl-2">Log Date</label>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button
                                  variant={"outline"}
                                  className="w-full mt-1 py-6 rounded-2xl text-lg font-bold border-2 flex justify-start"
                                  >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(entryDate, "PPP")}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                  <Calendar
                                  mode="single"
                                  selected={entryDate}
                                  onSelect={(date) => date && setEntryDate(date)}
                                  initialFocus
                                  />
                              </PopoverContent>
                          </Popover>
                      </div>
                  </div>


                  <Button 
                    onClick={handleCommit} 
                    disabled={isCommitPending}
                    className="group relative w-full self-end py-9 rounded-[44px] bg-foreground text-background font-black text-2xl shadow-lg active:scale-[0.98] hover:scale-[1.01] transition-all overflow-hidden disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-center gap-5 relative z-10">
                      {isCommitPending ? <Loader2 size={36} className="animate-spin" /> : <CheckCircle size={36} strokeWidth={2.5}/>}
                      <span>{existingEntry?.id ? 'Finalize' : 'Record'}</span>
                    </div>
                  </Button>
                </>
            )}
          </div>
      </div>
    </div>
  );
}
