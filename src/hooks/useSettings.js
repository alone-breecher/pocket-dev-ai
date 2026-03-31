import { useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import storageService from '../services/StorageService';
import ollamaService from '../services/OllamaService';

/**
 * useSettings - Handles loading/saving app configuration.
 */
export function useSettings() {
  const { state, dispatch } = useApp();

  // Load persisted config on mount
  useEffect(() => {
    let mounted = true;
    storageService.loadAll().then(saved => {
      if (!mounted) return;
      dispatch({
        type: 'SET_CONFIG',
        payload: {
          apiUrl: saved.apiUrl,
          apiKey: saved.apiKey,
          selectedModel: saved.selectedModel,
          sessions: saved.sessions.length > 0 ? saved.sessions : state.sessions,
        },
      });
      ollamaService.configure(saved.apiUrl, saved.apiKey);
    });
    return () => { mounted = false; };
  }, []); // Only on mount

  // Auto-save sessions when they change
  useEffect(() => {
    if (state.sessions.length > 0) {
      storageService.saveSessions(state.sessions);
    }
  }, [state.sessions]);

  const saveConfig = useCallback(async ({ apiUrl, apiKey, selectedModel }) => {
    const updates = {};
    if (apiUrl !== undefined) {
      updates.apiUrl = apiUrl;
      await storageService.saveApiUrl(apiUrl);
    }
    if (apiKey !== undefined) {
      updates.apiKey = apiKey;
      await storageService.saveApiKey(apiKey);
    }
    if (selectedModel !== undefined) {
      updates.selectedModel = selectedModel;
      await storageService.saveSelectedModel(selectedModel);
    }
    dispatch({ type: 'SET_CONFIG', payload: updates });
    ollamaService.configure(
      apiUrl ?? state.apiUrl,
      apiKey ?? state.apiKey
    );
  }, [state.apiUrl, state.apiKey, dispatch]);

  const checkServerStatus = useCallback(async () => {
    ollamaService.configure(state.apiUrl, state.apiKey);
    const online = await ollamaService.checkHealth();
    dispatch({ type: 'SET_SERVER_STATUS', payload: online });

    if (online) {
      try {
        const models = await ollamaService.getModels();
        if (models.length > 0) {
          dispatch({ type: 'SET_AVAILABLE_MODELS', payload: models });
        }
      } catch {}
    }
    return online;
  }, [state.apiUrl, state.apiKey, dispatch]);

  return {
    apiUrl: state.apiUrl,
    apiKey: state.apiKey,
    selectedModel: state.selectedModel,
    serverOnline: state.serverOnline,
    availableModels: state.availableModels,
    saveConfig,
    checkServerStatus,
  };
}
