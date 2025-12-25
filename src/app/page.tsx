
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/hooks/use-user';
import DailySummary from '@/components/dashboard/daily-summary';
import HistoryLog from '@/components/history/history-log';
import { ActionToolbar } from '@/components/dashboard/action-toolbar';
import { AnalysisPanel } from '@/components/analysis/analysis-panel';
import type { HistoryEntry, UserGoals } from '@/lib/types';
import { getHistory, saveGoals, getGoals, deleteHistoryEntry } from '@/lib/actions';
import { uploadImageToBlob } from '@/lib/blob-upload';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Loader2, Sparkles, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';


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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showTextLogModal, setShowTextLogModal] = useState(false);
  const [textLogInput, setTextLogInput] = useState('');
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [goals, setGoals] = useState<UserGoals>(DEFAULT_GOALS);

  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, mode: 'meal' | 'barcode') => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      
      const maxSize = 8 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({ 
          variant: 'destructive', 
          title: 'File too large', 
          description: 'Please select an image smaller than 8MB.' 
        });
        if(event.target) event.target.value = '';
        return;
      }
  
      setLoading(true);
      toast({ title: 'Uploading image...', description: 'Please wait...' });
  
      try {
        if (!user) {
          throw new Error('You must be logged in to upload images.');
        }
  
        const uploadResult = await uploadImageToBlob(file, user.id);
        
        if (!uploadResult.success || !uploadResult.url) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
  
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({ title: 'Upload complete!', description: 'Starting analysis...' });
        startAnalysis(uploadResult.url, mode);
        
      } catch (e: any) {
        const errorMessage = e.message || 'Could not process the image.';
        console.error("Upload error:", e);
        toast({ 
          variant: 'destructive', 
          title: 'Upload failed', 
          description: errorMessage,
        });
      } finally {
        setLoading(false);
        if(event.target) event.target.value = '';
      }
    }
  };


  const startAnalysis = (imageUrlOrNull: string | null, mode: 'meal' | 'barcode' | 'text', text?: string) => {
    if (!user) return;
    const timestamp = new Date();
    // Ensure the new log has the date of the selected day, but the time of now.
    const combinedDate = new Date(selectedDate);
    combinedDate.setHours(timestamp.getHours(), timestamp.getMinutes(), timestamp.getSeconds(), timestamp.getMilliseconds());

    setSelectedEntry({
      id: '', // Will be generated on commit
      userId: user.id,
      timestamp: combinedDate.toISOString(),
      analysis: null as any, // This will be filled by the analysis panel
      imageUrl: imageUrlOrNull || '',
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
  };

  if (userLoading) {
    return <LoadingSpinner />;
  }
  
  const todayEntries =
    history
      ?.filter(
        (entry) =>
          new Date(entry.timestamp).toDateString() === selectedDate.toDateString()
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      ?? [];

  return (
    <div className="flex-1 bg-muted/30 dark:bg-slate-950/50">
      <main className="flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        {view === 'home' && (
          <div className="w-full max-w-6xl mx-auto">
            <DailySummary
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              entries={todayEntries}
              goals={goals}
              onGoalsClick={() => setShowGoalModal(true)}
              allHistory={history}
            />

            {historyLoading ? (
              <LoadingSpinner className="py-24" />
            ) : (
              <HistoryLog
                history={todayEntries}
                onSelect={handleSelectEntry}
                onDelete={handleDeleteEntry}
                goals={goals}
              />
            )}
          </div>
        )}
        
        {view === 'analysis' && selectedEntry && (
           <AnalysisPanel
              key={selectedEntry.id || 'new'}
              closePanel={handleAnalysisClose}
              existingEntry={selectedEntry}
            />
        )}
      </main>

      {view === 'home' && <ActionToolbar onAddMeal={handleAddMeal} />}
      
      {/* Modals */}
      <Dialog open={showTextLogModal} onOpenChange={setShowTextLogModal}>
        <DialogContent className="sm:max-w-lg">
           <DialogHeader>
             <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3"><Type/> Manual Entry</DialogTitle>
             <DialogDescription>Describe your meal using natural language. For example: "2 rotis and a bowl of dal".</DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
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
                  <DialogDescription>Set your daily nutritional goals.</DialogDescription>
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
      <input type="file" ref={fileInputRef} accept="image/*,.heic,.heif" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'meal')} />
      <input type="file" ref={barcodeInputRef} accept="image/*,.heic,.heif" capture="environment" className="hidden" onChange={(e) => handleFileSelect(e, 'barcode')} />
      <input type="file" ref={uploadInputRef} accept="image/*,.heic,.heif" className="hidden" onChange={(e) => handleFileSelect(e, 'meal')} />
    </div>
  );
}

    
