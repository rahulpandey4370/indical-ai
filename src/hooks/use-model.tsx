'use client';
import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

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
  modelUsage: Record<string, number>;
  incrementModelUsage: (modelId: string) => void;
}

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<string>(DEFAULT_MODEL_ID);
  const [isMounted, setIsMounted] = useState(false);
  const [modelUsage, setModelUsage] = useState<Record<string, number>>({});
  
  const getStorageKey = () => {
    const today = new Date().toISOString().split('T')[0];
    return `indical_model_usage_${today}`;
  }

  useEffect(() => {
    setIsMounted(true);
    const savedModel = localStorage.getItem('indical_model');
    if (savedModel && availableModels.some(m => m.id === savedModel)) {
      setModel(savedModel);
    }
    
    // Load today's usage
    const usageKey = getStorageKey();
    const savedUsage = localStorage.getItem(usageKey);
    if(savedUsage) {
      setModelUsage(JSON.parse(savedUsage));
    }
    
    // Clear out old usage data
    Object.keys(localStorage).forEach(key => {
      if(key.startsWith('indical_model_usage_') && key !== usageKey) {
        localStorage.removeItem(key);
      }
    });

  }, []);

  const incrementModelUsage = useCallback((modelId: string) => {
    setModelUsage(prev => {
      const newUsage = { ...prev, [modelId]: (prev[modelId] || 0) + 1 };
      localStorage.setItem(getStorageKey(), JSON.stringify(newUsage));
      return newUsage;
    });
  }, []);


  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('indical_model', model);
    }
  }, [model, isMounted]);

  const setModelAndIncrement = (modelId: string) => {
    setModel(modelId);
    incrementModelUsage(modelId);
  }

  const value = {
    model,
    setModel: setModelAndIncrement,
    availableModels,
    modelUsage,
    incrementModelUsage
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
