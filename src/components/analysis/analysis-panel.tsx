
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
  RefinedNutritionalAnalysis,
  ModelId,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NutritionalChart } from './nutritional-chart';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { Utensils } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useModel } from '@/hooks/use-model';
import { Badge } from '../ui/badge';

export function AnalysisPanel({
  closePanel,
  existingEntry,
}: {
  closePanel: (refresh?: boolean) => void;
  existingEntry: HistoryEntry;
}) {
  const { user } = useUser();
  const { selectedModel, incrementModelUsage } = useModel();
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
  const [refinementModel, setRefinementModel] = useState<string | undefined>(undefined);


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
    incrementModelUsage(selectedModel);
    try {
      const result = await analyzeIndianFoodImage({
        photoDataUri: existingEntry.imageUrl, // This is now a URL, not base64
        textInput: existingEntry.textInput,
        mode: existingEntry.mode,
      }, selectedModel);
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
    incrementModelUsage(selectedModel);
    try {
      const response = await refineNutritionalAnalysis({
        initialAnalysis: analysisResult,
        refinementInstruction: userMsg.text,
      }, selectedModel);
      
      const updatedAnalysis: NutritionalAnalysis = {
        ...response.refinedAnalysis,
        modelId: response.modelId
      }

      setAnalysisResult(updatedAnalysis);
      setChatMessages(prev => [...prev, { role: 'model', text: response.responseText }]);
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred during refinement.';
      setAnalysisError(errorMessage);
      setChatMessages(prev => [...prev, { role: 'model', text: `Sorry, I couldn't make that change. ${errorMessage}` }]);
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
    if (!user || !analysisResult) {
      toast({ variant: 'destructive', title: 'Error', description: 'User or analysis data is missing.' });
      return;
    }

    startCommitTransition(async () => {
      const result = await commitToJourney(
        analysisResult,
        existingEntry.imageUrl,
        entryDate,
        user.id,
        mealType,
        existingEntry.id, // Pass docId if editing
        existingEntry.mode,
        existingEntry.textInput,
        mealName
      );

      if (result.success) {
        toast({ title: 'Success!', description: result.message });
        closePanel(true);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-card rounded-2xl shadow-inner border">
            <Loader2 className="animate-spin text-primary mb-4" size={32} />
            <h3 className="font-bold text-lg">Analyzing...</h3>
            <p className="text-sm text-muted-foreground">Please wait a moment while the AI works its magic.</p>
        </div>
      );
    }
    if (analysisError) {
      return (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Analysis Error</AlertTitle>
            <AlertDescription>
                <p>{analysisError}</p>
                <Button variant="outline" size="sm" onClick={handleInitialAnalysis} className="mt-4">
                Try Again
                </Button>
            </AlertDescription>
        </Alert>
      );
    }
    if (analysisResult) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center bg-card p-4 rounded-2xl shadow-sm border space-y-4">
                <NutritionalChart analysis={analysisResult} />
                 <div className="text-center">
                    <p className="text-4xl font-extrabold tracking-tighter text-foreground">{analysisResult.total_calories}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Kcal</p>
                </div>
                <div className="flex gap-4 text-xs font-semibold text-muted-foreground">
                    <span>P: {analysisResult.total_macros.protein.toFixed(1)}g</span>
                    <span>C: {analysisResult.total_macros.carbs.toFixed(1)}g</span>
                    <span>F: {analysisResult.total_macros.fat.toFixed(1)}g</span>
                </div>
              </div>
            <div className="space-y-4">
              <Input 
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Coffee and Cookies"
                className="text-lg font-bold h-12"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select value={mealType} onValueChange={(v: MealType) => setMealType(v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                        <SelectItem value="Lunch">Lunch</SelectItem>
                        <SelectItem value="Dinner">Dinner</SelectItem>
                        <SelectItem value="Snack">Snack</SelectItem>
                    </SelectContent>
                </Select>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(entryDate, 'PPP')}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={entryDate} onSelect={(d) => d && setEntryDate(d)} initialFocus />
                    </PopoverContent>
                </Popover>
              </div>
              <div className="bg-card p-4 rounded-2xl shadow-sm border">
                <h3 className="font-bold mb-2 flex justify-between items-center text-sm">
                  <span>Composition Details</span>
                  <Badge variant="outline">{analysisResult.items.length} {analysisResult.items.length === 1 ? "ITEM" : "ITEMS"}</Badge>
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {analysisResult.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.weight}{item.unit} Serving</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.calories}Kcal</p>
                        <p className="text-xs text-muted-foreground">
                            P: {item.macros.protein.toFixed(0)}g C: {item.macros.carbs.toFixed(0)}g F: {item.macros.fat.toFixed(0)}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => closePanel()}>
            <X className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold tracking-tight">Analysis</h2>
        </div>
        <Button
          onClick={handleCommit}
          disabled={!analysisResult || isAnalyzing || isCommitPending}
          size="sm"
        >
          {isCommitPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Save className="mr-2" /> Commit
            </>
          )}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {imagePreview && (
            <div className="rounded-xl overflow-hidden border shadow-sm aspect-video relative">
              <Image
                src={imagePreview}
                alt="Meal analysis"
                layout="fill"
                objectFit="cover"
              />
            </div>
          )}
          {renderContent()}
        </div>
        
        {/* Chat / Refinement */}
        <div className="max-w-4xl mx-auto">
             <div className="space-y-4">
                {chatMessages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 text-sm ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><Bot className="text-primary" size={16}/></div>}
                        <div className={`p-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border shadow-sm rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={analysisChatScrollRef}></div>
            </div>

            <div className="sticky bottom-0 py-4 bg-background/80 backdrop-blur-sm">
                <div className="relative">
                    <Input
                    type="text"
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                    placeholder={analysisResult ? "e.g., 'The portion of rice was smaller'" : "Waiting for analysis to complete..."}
                    disabled={!analysisResult || isRefining}
                    className="pr-12 h-12"
                    />
                    <Button onClick={handleRefine} disabled={!analysisResult || isRefining || !refinementInput} size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9">
                        {isRefining ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
