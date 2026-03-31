import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const DEFAULT_MODELS = [
  { id: 'qwen2.5-coder:7b', name: 'Qwen2.5 Coder 7B', tag: 'CODING' },
  { id: 'qwen2.5-coder:14b', name: 'Qwen2.5 Coder 14B', tag: 'CODING' },
  { id: 'deepseek-coder:6.7b', name: 'DeepSeek Coder 6.7B', tag: 'CODING' },
  { id: 'deepseek-coder-v2:16b', name: 'DeepSeek Coder V2', tag: 'CODING' },
  { id: 'codellama:7b', name: 'Code Llama 7B', tag: 'META' },
  { id: 'llama3.2:3b', name: 'Llama 3.2 3B', tag: 'CHAT' },
  { id: 'mistral:7b', name: 'Mistral 7B', tag: 'CHAT' },
  { id: 'gemma2:9b', name: 'Gemma2 9B', tag: 'GOOGLE' },
];

const initialState = {
  // Config
  apiUrl: 'http://localhost:11434',
  apiKey: '',
  selectedModel: 'qwen2.5-coder:7b',
  availableModels: DEFAULT_MODELS,
  serverOnline: null,

  // Chat sessions
  sessions: [],
  activeSessionId: null,

  // Project files
  projectFiles: [],
  projectName: null,

  // UI state
  isLoading: false,
  streamingMessageId: null,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, ...action.payload };

    case 'SET_SERVER_STATUS':
      return { ...state, serverOnline: action.payload };

    case 'SET_MODEL':
      return { ...state, selectedModel: action.payload };

    case 'SET_AVAILABLE_MODELS':
      return { ...state, availableModels: action.payload };

    case 'CREATE_SESSION': {
      const session = {
        id: action.payload.id,
        title: action.payload.title || 'New Chat',
        messages: [],
        model: state.selectedModel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        ...state,
        sessions: [session, ...state.sessions.slice(0, 49)], // max 50 sessions
        activeSessionId: session.id,
      };
    }

    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSessionId: action.payload };

    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload),
        activeSessionId:
          state.activeSessionId === action.payload
            ? state.sessions.find(s => s.id !== action.payload)?.id || null
            : state.activeSessionId,
      };

    case 'ADD_MESSAGE': {
      const { sessionId, message } = action.payload;
      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages.slice(-99), message], // max 100 messages
                updatedAt: Date.now(),
                title:
                  s.title === 'New Chat' && message.role === 'user'
                    ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
                    : s.title,
              }
            : s
        ),
      };
    }

    case 'UPDATE_MESSAGE': {
      const { sessionId, messageId, content, done } = action.payload;
      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map(m =>
                  m.id === messageId ? { ...m, content, streaming: !done } : m
                ),
              }
            : s
        ),
        streamingMessageId: done ? null : messageId,
      };
    }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_STREAMING_ID':
      return { ...state, streamingMessageId: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_PROJECT_FILES':
      return {
        ...state,
        projectFiles: action.payload.files,
        projectName: action.payload.name,
      };

    case 'CLEAR_PROJECT':
      return { ...state, projectFiles: [], projectName: null };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setConfig = useCallback((config) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
  }, []);

  const getActiveSession = useCallback(() => {
    return state.sessions.find(s => s.id === state.activeSessionId) || null;
  }, [state.sessions, state.activeSessionId]);

  return (
    <AppContext.Provider value={{ state, dispatch, setConfig, getActiveSession }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
