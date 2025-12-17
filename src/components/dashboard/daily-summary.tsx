'use client';
import { useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import MacroProgress from './macro-progress';
import { HistoryEntry, MacroNutrients } from '@/lib/types';
import { parseNutritionString } from '@/lib/utils';
import { addDays, format, isSameDay } from 'date-fns';

interface DailySummaryProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  entries: HistoryEntry[];
}

const USER_GOALS = {
  calories: 2010,
  protein: 100,
  carbs: 250,
  fat: 65,
};

export default function DailySummary({
  selectedDate,
  onDateChange,
  entries,
}: DailySummaryProps) {
  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i - 7));

  const totalMacros = entries.reduce(
    (acc, entry) => {
      const { protein, carbs, fat } = parseNutritionString(
        entry.analysis.estimatedNutritionalContent
      );
      acc.protein += protein;
      acc.carbs += carbs;
      acc.fat += fat;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  const totalCalories = entries.reduce((acc, entry) => {
    const { calories } = parseNutritionString(
      entry.analysis.estimatedNutritionalContent
    );
    return acc + calories;
  }, 0);

  const remainingCalories = USER_GOALS.calories - totalCalories;

  return (
    <div className="w-full">
      <Carousel
        opts={{
          align: 'start',
          startIndex: dates.findIndex((d) => isSameDay(d, selectedDate)),
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-1">
          {dates.map((date, index) => (
            <CarouselItem
              key={index}
              className="pl-1 basis-1/5 md:basis-1/7"
              onClick={() => onDateChange(date)}
            >
              <div className="p-1">
                <Card
                  className={`cursor-pointer ${
                    isSameDay(date, selectedDate)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-card-foreground'
                  }`}
                >
                  <CardContent className="flex flex-col items-center justify-center p-2 aspect-square">
                    <span className="text-xs font-medium uppercase">
                      {format(date, 'EEE')}
                    </span>
                    <span className="text-2xl font-bold">
                      {format(date, 'd')}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      <Card className="mt-4 bg-primary text-primary-foreground p-6 rounded-3xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium opacity-80">REMAINING ENERGY</p>
            <p className="text-6xl font-bold tracking-tighter">
              {remainingCalories.toLocaleString()}
              <span className="text-2xl ml-2 opacity-80">kcal</span>
            </p>
          </div>
          {/* Visual element placeholder */}
          <div className="w-16 h-16 opacity-20">
             <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0 L61.8 38.2 L100 38.2 L69.1 61.8 L80.9 100 L50 76.4 L19.1 100 L30.9 61.8 L0 38.2 L38.2 38.2 Z" fill="currentColor"/>
            </svg>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <MacroProgress
            label="Protein"
            value={totalMacros.protein}
            goal={USER_GOALS.protein}
          />
          <MacroProgress
            label="Carbs"
            value={totalMacros.carbs}
            goal={USER_GOALS.carbs}
          />
          <MacroProgress
            label="Fat"
            value={totalMacros.fat}
            goal={USER_GOALS.fat}
          />
        </div>
      </Card>
    </div>
  );
}
