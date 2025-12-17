export type NutritionalAnalysis = {
  dishes: string[];
  estimatedNutritionalContent: string;
  analysisNotes?: string;
};

export type RefinedNutritionalAnalysis = {
  refinedAnalysis: string;
};

export type MacroNutrients = {
  protein: number;
  carbs: number;
  fat: number;
};

export type HistoryEntry = {
  id: string;
  timestamp: string;
  analysis: NutritionalAnalysis;
  imageUrl: string;
};
