

export type MacroNutrients = {
  protein: number;
  carbs: number;
  fat: number;
};

export type AnalysisItem = {
  name: string;
  weight_g: number;
  calories: number;
  macros: MacroNutrients;
};

export type NutritionalAnalysis = {
  items: AnalysisItem[];
  total_calories: number;
  total_macros: MacroNutrients;
  confidence_score: number;
  food_type: 'prepared' | 'packaged';
  summary: string;
};

export type RefinedNutritionalAnalysis = {
  refinedAnalysis: NutritionalAnalysis;
  responseText: string;
};

export type HistoryEntry = {
  id: string;
  userId: string;
  timestamp: string;
  analysis: NutritionalAnalysis;
  imageUrl: string;
  mode?: 'meal' | 'barcode' | 'text';
  textInput?: string;
};

export type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

export type UserGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

    