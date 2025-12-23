<<<<<<< HEAD

'use client';
import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { getModelUsage, saveModelUsage } from '@/lib/actions';
import { useUser } from './use-user';

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
  const { user } = useUser();
  const [model, setModel] = useState<string>(DEFAULT_MODEL_ID);
  const [isMounted, setIsMounted] = useState(false);
  const [modelUsage, setModelUsage] = useState<Record<string, number>>({});
  
  useEffect(() => {
    setIsMounted(true);
    const savedModel = localStorage.getItem('indical_model');
    if (savedModel && availableModels.some(m => m.id === savedModel)) {
      setModel(savedModel);
    }
  }, []);
  
  useEffect(() => {
    if (user) {
        getModelUsage(user.id, new Date()).then(usage => {
            setModelUsage(usage || {});
        }).catch(e => {
            console.error("Failed to fetch model usage", e);
            setModelUsage({});
        });
    }
  }, [user]);


  const incrementModelUsage = useCallback((modelId: string) => {
    if (!user) return;
    
    const newUsage = { ...modelUsage, [modelId]: (modelUsage[modelId] || 0) + 1 };
    setModelUsage(newUsage);

    // Debounce this call in a real app, but for now we save on every increment
    saveModelUsage(user.id, new Date(), newUsage).catch(e => {
        console.error("Failed to save model usage", e);
        // Optionally revert state, but for this app we'll keep the optimistic update
    });
  }, [modelUsage, user]);


  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('indical_model', model);
    }
  }, [model, isMounted]);

  const value = {
    model,
    setModel,
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
=======
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ModelId } from '@/lib/types';

const defaultModel: ModelId = 'gemini-2.5-flash';

const ModelContext = createContext<{
  selectedModel: ModelId;
  setSelectedModel: (m: ModelId) => void;
} | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<ModelId>(defaultModel);

  // Load preference from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('indical-ai-model') as ModelId;
    if (saved) {
      setSelectedModel(saved);
    }
  }, []);

  const updateModel = (m: ModelId) => {
    setSelectedModel(m);
    localStorage.setItem('indical-ai-model', m);
  };

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel: updateModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) throw new Error('useModel must be used within ModelProvider');
  return context;
};
>>>>>>> 052caa3 (Can you please at a 3 dot button to the right most side of the dock whic)
