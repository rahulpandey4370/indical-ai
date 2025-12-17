'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Header } from '@/components/layout/header';
import { AnalysisPanel } from '@/components/analysis/analysis-panel';

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setIsSheetOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight font-headline">
              Your Nutrition Journey
            </h2>
            <p className="text-muted-foreground mt-2">
              Select a day to log your meal or view your history.
            </p>
          </div>
          <div className="flex justify-center rounded-lg border bg-card shadow-sm">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="p-0"
            />
          </div>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-headline">
                Log Meal for {date ? date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </SheetTitle>
              <SheetDescription>
                Analyze your Indian meal with AI and log it to your journey.
              </SheetDescription>
            </SheetHeader>
            {date && <AnalysisPanel key={date.toISOString()} date={date} closePanel={() => setIsSheetOpen(false)} />}
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
}
