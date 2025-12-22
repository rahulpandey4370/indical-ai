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
    try {
      const savedUsage = localStorage.getItem(usageKey);
      if(savedUsage) {
        setModelUsage(JSON.parse(savedUsage));
      }
    } catch (e) {
      console.error("Failed to parse model usage from localStorage", e);
      setModelUsage({});
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
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(newUsage));
      } catch (e) {
        console.error("Failed to save model usage to localStorage", e);
      }
      return newUsage;
    });
  }, []);


  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('indical_model', model);
    }
  }, [model, isMounted]);

  const setModelAndTrackUsage = (modelId: string) => {
    setModel(modelId);
  }

  const value = {
    model,
    setModel: setModelAndTrackUsage,
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
  // This is a side-effect but it's the most reliable way to track usage
  // without changing all the call-sites.
  useEffect(() => {
    context.incrementModelUsage(context.model);
  }, [context.model]);
  
  return context;
}
