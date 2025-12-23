
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ModelId, modelNames } from '@/lib/types';
import { useUser } from './use-user';
import { getModelUsage, saveModelUsage } from '@/lib/actions';

const defaultModel: ModelId = 'gemini-2.5-flash';

const ModelContext = createContext<{
  selectedModel: ModelId;
  setSelectedModel: (m: ModelId) => void;
  modelUsage: Record<string, number>;
  incrementModelUsage: (modelId: string) => void;
} | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [selectedModel, setSelectedModel] = useState<ModelId>(defaultModel);
  const [modelUsage, setModelUsage] = useState<Record<string, number>>({});

  // Load preference from storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('indical-ai-model') as ModelId;
    if (saved && modelNames.includes(saved)) {
      setSelectedModel(saved);
    }
  }, []);
  
  // Load usage from storage on user change
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

  const updateModel = (m: ModelId) => {
    setSelectedModel(m);
    localStorage.setItem('indical-ai-model', m);
  };
  
  const incrementModelUsage = useCallback((modelId: string) => {
    if (!user) return;
    
    const newUsage = { ...modelUsage, [modelId]: (modelUsage[modelId] || 0) + 1 };
    setModelUsage(newUsage);

    // This should be debounced in a real app, but for now we save on every increment
    saveModelUsage(user.id, new Date(), newUsage).catch(e => {
        console.error("Failed to save model usage", e);
        // Optionally revert state, but for this app we'll keep the optimistic update
    });
  }, [modelUsage, user]);


  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel: updateModel, modelUsage, incrementModelUsage }}>
      {children}
    </ModelContext.Provider>
  );
}

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) throw new Error('useModel must be used within ModelProvider');
  return context;
};
