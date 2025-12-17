'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, Tooltip } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { parseNutritionString } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

const chartConfig = {
  protein: {
    label: 'Protein',
    color: 'hsl(var(--chart-1))',
  },
  carbs: {
    label: 'Carbs',
    color: 'hsl(var(--chart-2))',
  },
  fat: {
    label: 'Fat',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function NutritionalChart({ nutritionString }: { nutritionString: string }) {
  const { calories, protein, carbs, fat } = parseNutritionString(nutritionString);

  const chartData = [
    { name: 'protein', value: protein, fill: chartConfig.protein.color },
    { name: 'carbs', value: carbs, fill: chartConfig.carbs.color },
    { name: 'fat', value: fat, fill: chartConfig.fat.color },
  ].filter(d => d.value > 0);

  const totalMacros = protein + carbs + fat;

  if (totalMacros === 0) {
    return null;
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Macro Distribution</CardTitle>
            <CardDescription>Estimated Calories: {calories || 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-[200px]"
            >
                <PieChart>
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel indicator="dot" formatter={(value, name) => `${value}g (${((value / totalMacros) * 100).toFixed(0)}%)`} />}
                />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                >
                     {chartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                     ))}
                </Pie>
                </PieChart>
            </ChartContainer>
        </CardContent>
    </Card>
  );
}
