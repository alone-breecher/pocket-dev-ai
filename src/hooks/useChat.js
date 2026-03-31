import { useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import ollamaService from '../services/OllamaService';

/**
 * useChat - Core chat logic hook.
 * Handles sending messages, streaming responses, and session management.
 */
export function useChat() {
  const { state, dispatch, getActiveSession } = useApp();
  const streamingRef = useRef(false);

  const createSession = useCallback(() => {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    dispatch({ type: 'CREATE_SESSION', payload: { id } });
    return id;
  }, [dispatch]);

  const sendMessage = useCallback(async (content, projectContext = '') => {
    if (!content.trim() || streamingRef.current) return;

    let sessionId = state.activeSessionId;
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      dispatch({ type: 'CREATE_SESSION', payload: { id: sessionId } });
    }

    const session = state.sessions.find(s => s.id === sessionId) || { messages: [] };

    // User message
    const userMessageId = `msg_${Date.now()}_user`;
    const userContent = projectContext
      ? `${projectContext}\n\nUser question: ${content}`
      : content;

    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        sessionId,
        message: {
          id: userMessageId,
          role: 'user',
          content: content, // Show original content in UI
          displayContent: content,
          timestamp: Date.now(),
        },
      },
    });

    // AI message placeholder
    const aiMessageId = `msg_${Date.now()}_ai`;
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        sessionId,
        message: {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          streaming: true,
          timestamp: Date.now(),
        },
      },
    });

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_STREAMING_ID', payload: aiMessageId });
    streamingRef.current = true;

    // Build messages for API (use display content for history, full context for current)
    const historyMessages = session.messages
      .filter(m => !m.streaming)
      .map(m => ({ role: m.role, content: m.content }));

    const apiMessages = [
      ...historyMessages,
      { role: 'user', content: userContent },
    ];

    ollamaService.configure(state.apiUrl, state.apiKey);

    ollamaService.chatStream({
      model: state.selectedModel,
      messages: apiMessages,
      sessionId,
      onChunk: (_chunk, fullContent) => {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { sessionId, messageId: aiMessageId, content: fullContent, done: false },
        });
      },
      onDone: (fullContent, aborted) => {
        streamingRef.current = false;
        dispatch({ type: 'SET_LOADING', payload: false });

        if (!aborted && fullContent) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { sessionId, messageId: aiMessageId, content: fullContent, done: true },
          });
        } else if (aborted) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { sessionId, messageId: aiMessageId, content: '[Response stopped]', done: true },
          });
        }
      },
      onError: (errorMsg) => {
        streamingRef.current = false;
        dispatch({ type: 'SET_LOADING', payload: false });
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: {
            sessionId,
            messageId: aiMessageId,
            content: `❌ Error: ${errorMsg}\n\nCheck your API URL and server status in Settings.`,
            done: true,
          },
        });
      },
    });
  }, [state, dispatch]);

  const stopStreaming = useCallback(() => {
    if (state.activeSessionId) {
      ollamaService.abortSession(state.activeSessionId);
    }
    streamingRef.current = false;
    dispatch({ type: 'SET_LOADING', payload: false });
  }, [state.activeSessionId, dispatch]);

  const deleteSession = useCallback((sessionId) => {
    ollamaService.abortSession(sessionId);
    dispatch({ type: 'DELETE_SESSION', payload: sessionId });
  }, [dispatch]);

  const switchSession = useCallback((sessionId) => {
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: sessionId });
  }, [dispatch]);

  return {
    sendMessage,
    stopStreaming,
    createSession,
    deleteSession,
    switchSession,
    isLoading: state.isLoading,
    isStreaming: streamingRef.current,
    activeSession: getActiveSession(),
    sessions: state.sessions,
  };
}
