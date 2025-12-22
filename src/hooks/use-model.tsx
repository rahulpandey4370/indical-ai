'use client';
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type ModelDefinition = {
  id: string;
  name: string;
};

export const availableModels: ModelDefinition[] = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-3.0-flash', name: 'Gemini 3.0 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemma-3-27b', name: 'Gemma 3 27B' },
];

const DEFAULT_MODEL_ID = 'gemini-2.5-flash';

interface ModelContextValue {
  model: string;
  setModel: (modelId: string) => void;
  availableModels: ModelDefinition[];
}

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<string>(DEFAULT_MODEL_ID);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedModel = localStorage.getItem('indical_model');
    if (savedModel && availableModels.some(m => m.id === savedModel)) {
      setModel(savedModel);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('indical_model', model);
    }
  }, [model, isMounted]);

  const value = {
    model,
    setModel,
    availableModels,
  };

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
}
