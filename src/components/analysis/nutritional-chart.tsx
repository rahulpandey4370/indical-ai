'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ChartConfig,
} from '@/components/ui/chart';
import { parseNutritionString } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const chartConfig = {
  carbs: {
    label: 'Carbs',
    color: '#3B82F6',
  },
  fat: {
    label: 'Fat',
    color: '#EF4444',
  },
  protein: {
    label: 'Protein',
    color: '#10B981',
  },
} satisfies ChartConfig;


export function NutritionalChart({ nutritionString }: { nutritionString: string }) {
  const { calories, protein, carbs, fat } = parseNutritionString(nutritionString);

  const chartData = [
    { name: 'carbs', value: Math.max(0.1, carbs), fill: chartConfig.carbs.color },
    { name: 'fat', value: Math.max(0.1, fat), fill: chartConfig.fat.color },
    { name: 'protein', value: Math.max(0.1, protein), fill: chartConfig.protein.color },
  ].filter(d => d.value > 0.1);

  const totalMacros = protein + carbs + fat;

  if (totalMacros === 0) {
    return (
      <Card>
          <CardHeader>
              <CardTitle>Macro Distribution</CardTitle>
              <CardDescription>Estimated Calories: {calories || 'N/A'}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[200px]">
              <p className="text-muted-foreground">Not enough data to display chart.</p>
          </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
            <CardDescription>Estimated Calories: {calories || 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent className="relative h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={95}
                    paddingAngle={10}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    {chartData.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={entry.fill} 
                        className="focus:outline-none filter drop-shadow-md hover:opacity-80 transition-opacity cursor-pointer" 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(value: number) => [`${value.toFixed(1)}g`, '']}
                     contentStyle={{ 
                       borderRadius: '24px', 
                       border: 'none', 
                       padding: '12px 16px',
                       backgroundColor: 'hsl(var(--card))',
                       color: 'hsl(var(--card-foreground))',
                       boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' 
                     }}
                     itemStyle={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Macro Mix</span>
                <span className="text-3xl font-black tracking-tighter text-foreground">
                  {totalMacros > 0 ? Math.round(totalMacros) : 0}
                  <span className="text-sm font-bold opacity-30 ml-1">g</span>
                </span>
              </div>

              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-3">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full border border-border shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{item.name}</span>
                  </div>
                ))}
              </div>
        </CardContent>
    </Card>
  );
}
