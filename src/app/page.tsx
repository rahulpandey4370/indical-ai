'use client';

import { useState } from 'react';
import { useUser, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
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
import type { HistoryEntry } from '@/lib/types';
import { Utensils } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(
    null
  );

  const historyQuery = user
    ? query(
        collection(firestore, 'users', user.uid, 'history'),
        orderBy('timestamp', 'desc')
      )
    : null;

  const { data: history, loading: historyLoading } =
    useCollection<HistoryEntry>(historyQuery);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddMeal = () => {
    setSelectedEntry(null);
    setIsSheetOpen(true);
  };

  const handleSelectEntry = (entry: HistoryEntry) => {
    setSelectedEntry(entry);
    // TODO: Implement edit functionality in AnalysisPanel
    // For now, it just opens the panel
    setIsSheetOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete entry:', id);
  };

  if (userLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    router.push('/login');
    return <LoadingSpinner />;
  }

  const todayEntries =
    history?.filter(
      (entry) =>
        new Date(entry.timestamp).toDateString() === selectedDate.toDateString()
    ) ?? [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <DailySummary
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            entries={todayEntries}
          />

          {historyLoading ? (
            <LoadingSpinner />
          ) : history && history.length > 0 ? (
            <HistoryLog
              history={history}
              onSelect={handleSelectEntry}
              onDelete={handleDeleteEntry}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-white/5 mx-2 shadow-sm animate-in fade-in zoom-in duration-500 mt-8">
              <div className="relative mb-6">
                <Utensils size={72} className="opacity-10 text-primary" />
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
              </div>
              <p className="text-2xl font-black opacity-30 tracking-tight">
                Empty Logbook
              </p>
              <p className="text-[10px] opacity-20 font-black uppercase tracking-[0.2em] mt-2">
                Ready for your first scan
              </p>
            </div>
          )}
        </div>

        <ActionToolbar onAddMeal={handleAddMeal} />

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-headline">
                {selectedEntry ? 'Edit Meal' : 'Log Meal'} for{' '}
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </SheetTitle>
              <SheetDescription>
                {selectedEntry
                  ? 'Update the details of your meal.'
                  : 'Analyze your Indian meal with AI and log it to your journey.'}
              </SheetDescription>
            </SheetHeader>
            <AnalysisPanel
              key={selectedDate.toISOString() + (selectedEntry?.id || '')}
              date={selectedDate}
              closePanel={() => setIsSheetOpen(false)}
              existingEntry={selectedEntry}
            />
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
