
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import { Header } from '@/components/layout/header';
import DailySummary from '@/components/dashboard/daily-summary';
import HistoryLog from '@/components/history/history-log';
import { ActionToolbar } from '@/components/dashboard/action-toolbar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AnalysisPanel } from '@/components/analysis/analysis-panel';
import type { HistoryEntry, UserGoals, ChatMessage } from '@/lib/types';
import { getHistory, saveGoals, getGoals, deleteHistoryEntry } from '@/lib/actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Bot, Loader2, Sparkles, Type, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getAssistantResponse } from '@/ai/flows/get-assistant-response';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_GOALS: UserGoals = {
  calories: 2000,
  protein: 100,
  carbs: 250,
  fat: 65,
};

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const [view, setView] = useState<'home' | 'analysis'>('home');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTextLogModal, setShowTextLogModal] = useState(false);
  const [textLogInput, setTextLogInput] = useState('');
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);

  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const [assistantChat, setAssistantChat] = useState<ChatMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [processingAssistant, setProcessingAssistant] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const assistantScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('indical_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('indical_theme', darkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);


  useEffect(() => {
    if (user) {
      setHistoryLoading(true);
      Promise.all([getHistory(user.id), getGoals(user.id)])
        .then(([userHistory, userGoals]) => {
          const formattedHistory = userHistory.map((entry) => ({
            ...entry,
            timestamp: new Date(entry.timestamp).toISOString(),
          }));
          setHistory(formattedHistory);
          if (userGoals) {
            setGoals(userGoals);
          }
        })
        .catch(console.error)
        .finally(() => setHistoryLoading(false));
    }
  }, [user]);

  useEffect(() => {
    assistantScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantChat]);


  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddMeal = (mode: 'meal' | 'barcode' | 'upload' | 'text') => {
    if (mode === 'text') {
      setShowTextLogModal(true);
    } else {
      const inputRef = mode === 'meal' ? fileInputRef : mode === 'barcode' ? barcodeInputRef : uploadInputRef;
      inputRef.current?.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, mode: 'meal' | 'barcode') => {
     if (event.target.files?.[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        startAnalysis(dataUri, mode);
      };
      reader.readAsDataURL(file);
    }
    // reset input value
    if(event.target) event.target.value = '';
  }

  const startAnalysis = (data: string | null, mode: 'meal' | 'barcode' | 'text', text?: string) => {
    if (!user) return;
    setSelectedEntry({
      id: '', // Will be generated on commit
      userId: user.id,
      timestamp: selectedDate.toISOString(),
      analysis: null as any, // This will be filled by the analysis panel
      imageUrl: data || '',
      mode: mode,
      textInput: text
    });
    setView('analysis');
  };

  const handleTextLogSubmit = () => {
    if (!textLogInput.trim()) return;
    setShowTextLogModal(false);
    startAnalysis(null, 'text', textLogInput);
    setTextLogInput("");
  };


  const handleSelectEntry = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    setView('analysis');
  };

  const handleDeleteEntry = async (id: string) => {
    if(!user) return;
    setHistory(prev => prev.filter(h => h.id !== id));
    const result = await deleteHistoryEntry(user.id, id);
    if (!result.success) {
      toast({ variant: 'destructive', title: "Error", description: result.message });
      // Re-fetch to be safe
      getHistory(user.id).then(setHistory);
    } else {
       toast({ title: "Success", description: "Log entry deleted." });
    }
  };

  const handleAnalysisClose = (refresh?: boolean) => {
    setView('home');
    setSelectedEntry(null);
    if (refresh && user) {
      setHistoryLoading(true);
      getHistory(user.id)
        .then(setHistory)
        .finally(() => setHistoryLoading(false));
    }
  };

  const handleSaveGoals = async (newGoals: UserGoals) => {
    if(!user) return;
    setGoals(newGoals);
    await saveGoals(user.id, newGoals);
    setShowGoalModal(false);
    toast({ title: 'Goals updated!', description: 'Your new targets have been saved.' });
  }

  const handleAssistantSend = async () => {
    if (!assistantInput.trim() || !user) return;
    
    const currentChat = [...assistantChat, { role: 'user' as const, text: assistantInput }];
    setAssistantChat(currentChat);
    setAssistantInput("");
    setProcessingAssistant(true);
    
    try {
      const response = await getAssistantResponse({
        userMessage: currentChat[currentChat.length -1].text,
        history: history,
        goals: goals,
        chatHistory: currentChat.slice(0, -1),
        currentDate: selectedDate.toDateString()
      });
      setAssistantChat(prev => [...prev, { role: 'model', text: response }]);
    } catch(e: any) {
        setAssistantChat(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
        toast({ variant: 'destructive', title: "Assistant Error", description: e.message });
    } finally {
        setProcessingAssistant(false);
    }
  };


  if (userLoading) {
    return <LoadingSpinner />;
  }
  
  const todayEntries =
    history?.filter(
      (entry) =>
        new Date(entry.timestamp).toDateString() === selectedDate.toDateString()
    ) ?? [];

  return (
    <div className={`flex min-h-screen w-full flex-col ${darkMode ? 'dark bg-slate-950' : 'bg-background'} transition-colors duration-300`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} onAssistantClick={() => setIsAssistantOpen(true)} />
      
      <main className="flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        {view === 'home' && (
          <div className="w-full max-w-4xl mx-auto">
            <DailySummary
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              entries={todayEntries}
              goals={goals}
              onGoalsClick={() => setShowGoalModal(true)}
            />

            {historyLoading ? (
              <LoadingSpinner />
            ) : (
              <HistoryLog
                history={history}
                onSelect={handleSelectEntry}
                onDelete={handleDeleteEntry}
              />
            )}
          </div>
        )}
        
        {view === 'analysis' && selectedEntry && (
           <AnalysisPanel
              key={selectedEntry.id || 'new'}
              date={selectedDate}
              closePanel={handleAnalysisClose}
              existingEntry={selectedEntry}
            />
        )}
      </main>

      {view === 'home' && <ActionToolbar onAddMeal={handleAddMeal} />}

      {/* Assistant Panel */}
      <Sheet open={isAssistantOpen} onOpenChange={setIsAssistantOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-0">
            <SheetHeader className='p-6 pb-4 border-b'>
              <SheetTitle className="font-headline flex items-center gap-3 text-2xl">
                 <Bot className="text-primary" size={28}/> Health Companion
              </SheetTitle>
              <SheetDescription>
                Your AI-powered nutrition assistant. Ask me anything!
              </SheetDescription>
            </SheetHeader>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {assistantChat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-muted-foreground rounded-bl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {processingAssistant && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-muted flex items-center gap-2">
                       <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'0ms'}} />
                       <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'150ms'}} />
                       <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay:'300ms'}} />
                    </div>
                  </div>
                )}
               <div ref={assistantScrollRef} />
             </div>
             <div className="p-4 border-t bg-background">
              <div className="relative flex items-center">
                <Input type="text" value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAssistantSend()} placeholder="Ask about macros..." className="pr-12" />
                <Button onClick={handleAssistantSend} disabled={processingAssistant} size="icon" className="absolute right-2" variant="ghost">
                  <Send size={20}/>
                </Button>
              </div>
             </div>
          </SheetContent>
      </Sheet>

      {/* Modals */}
      <Dialog open={showTextLogModal} onOpenChange={setShowTextLogModal}>
        <DialogContent className="sm:max-w-lg">
           <DialogHeader>
             <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3"><Type/> Manual Entry</DialogTitle>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <p className="text-sm text-muted-foreground">Describe your meal using natural language. For example: "2 rotis and a bowl of dal".</p>
             <Textarea value={textLogInput} onChange={e => setTextLogInput(e.target.value)} placeholder="e.g., 1 Egg, 2 Roti, and a cup of Masala Chai..." rows={4}/>
           </div>
           <Button onClick={handleTextLogSubmit} disabled={!textLogInput.trim() || loading} className="w-full" size="lg">
              {loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2"/> Analyze Text</>}
           </Button>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showGoalModal} onOpenChange={setShowGoalModal}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle className="text-2xl font-black tracking-tighter">Adjust Targets</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div>
                      <label className="text-sm font-medium">Daily Calories</label>
                      <Input type="number" value={goals.calories} onChange={e => setGoals({...goals, calories: parseInt(e.target.value) || 0})} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                      <div>
                          <label className="text-sm font-medium">Protein (g)</label>
                          <Input type="number" value={goals.protein} onChange={e => setGoals({...goals, protein: parseInt(e.target.value) || 0})} className="mt-1" />
                      </div>
                      <div>
                          <label className="text-sm font-medium">Carbs (g)</label>
                          <Input type="number" value={goals.carbs} onChange={e => setGoals({...goals, carbs: parseInt(e.target.value) || 0})} className="mt-1" />
                      </div>
                      <div>
                          <label className="text-sm font-medium">Fat (g)</label>
                          <Input type="number" value={goals.fat} onChange={e => setGoals({...goals, fat: parseInt(e.target.value) || 0})} className="mt-1" />
                      </div>
                  </div>
              </div>
              <Button onClick={() => handleSaveGoals(goals)} className="w-full" size="lg">Save Goals</Button>
          </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'meal')} />
      <input type="file" ref={barcodeInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'barcode')} />
      <input type="file" ref={uploadInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'meal')} />
    </div>
  );
}

// Add a mode to the HistoryEntry to be used in the analysis panel
declare module '@/lib/types' {
  interface HistoryEntry {
    mode?: 'meal' | 'barcode' | 'text';
    textInput?: string;
  }
}

    