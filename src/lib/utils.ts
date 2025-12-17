import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseNutritionString(nutritionString: string | undefined) {
  if (!nutritionString) {
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  const caloriesMatch = nutritionString.match(/calories:\s*~?(\d+)/i);
  const proteinMatch = nutritionString.match(/protein:\s*~?(\d+)\s*g/i);
  const carbsMatch = nutritionString.match(/(?:carbohydrates|carbs):\s*~?(\d+)\s*g/i);
  const fatMatch = nutritionString.match(/fat:\s*~?(\d+)\s*g/i);

  const calories = caloriesMatch ? parseInt(caloriesMatch[1], 10) : 0;
  const protein = proteinMatch ? parseInt(proteinMatch[1], 10) : 0;
  const carbs = carbsMatch ? parseInt(carbsMatch[1], 10) : 0;
  const fat = fatMatch ? parseInt(fatMatch[1], 10) : 0;

  return { calories, protein, carbs, fat };
}
