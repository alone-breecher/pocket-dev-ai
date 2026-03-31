import { useCallback, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import ollamaService from '../services/OllamaService';
import AgentService from '../services/AgentService';
import SkillsService from '../services/SkillsService';

/**
 * useChat - Core chat logic hook with Agent/Skill/Model integration.
 * FIXED: Auto model selection, skill handling, performance optimizations.
 */
export function useChat() {
  const { state, dispatch, getActiveSession } = useApp();
  const streamingRef = useRef(false);
  // Performance: debounce timer ref
  const debounceTimerRef = useRef(null);

  const createSession = useCallback(() => {
    const id = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    dispatch({ type: 'CREATE_SESSION', payload: { id } });
    return id;
  }, [dispatch]);

  const sendMessage = useCallback(async (content, projectContext = '') => {
    // Debounce rapid sends (performance for low-end devices)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    if (!content.trim() || streamingRef.current) return;
    
    // Small debounce to prevent accidental double-sends
    await new Promise(resolve => {
      debounceTimerRef.current = setTimeout(resolve, 50);
    });

    let sessionId = state.activeSessionId;
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      dispatch({ type: 'CREATE_SESSION', payload: { id: sessionId } });
    }

    const session = state.sessions.find(s => s.id === sessionId) || { messages: [] };

    // User message
    const userMessageId = `msg_${Date.now()}_user`;
    
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        sessionId,
        message: {
          id: userMessageId,
          role: 'user',
          content: content,
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

    // === AGENT SYSTEM INTEGRATION ===
    // Prepare request with auto model selection + skill detection
    const agentRequest = await AgentService.prepareRequest(content, {
      projectContext,
      userSelectedModel: state.selectedModel, // Allow manual override
      history: session.messages.filter(m => !m.streaming),
    });

    // Build full messages array with system prompt
    const apiMessages = [
      { role: 'system', content: agentRequest.systemPrompt },
      ...agentRequest.messages,
    ];

    // Configure service
    ollamaService.configure(state.apiUrl, state.apiKey);

    // Send with streaming
    ollamaService.chatStream({
      model: agentRequest.model, // Auto-selected or user-overridden
      messages: apiMessages,
      sessionId,
      onChunk: (_chunk, fullContent) => {
        dispatch({
          type: 'UPDATE_MESSAGE',
          payload: { 
            sessionId, 
            messageId: aiMessageId, 
            content: fullContent, 
            done: false 
          },
        });
      },
      onDone: (fullContent, aborted) => {
        streamingRef.current = false;
        dispatch({ type: 'SET_LOADING', payload: false });

        if (!aborted && fullContent) {
          // Post-process response (skill-specific formatting)
          const processedContent = AgentService.postProcess(
            fullContent, 
            agentRequest.metadata
          );
          
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { 
              sessionId, 
              messageId: aiMessageId, 
              content: processedContent, 
              done: true,
              skill: agentRequest.metadata.skill, // Store skill for UI
            },
          });
        } else if (aborted) {
          dispatch({
            type: 'UPDATE_MESSAGE',
            payload: { 
              sessionId, 
              messageId: aiMessageId, 
              content: '[Response stopped]', 
              done: true 
            },
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
            content: `❌ ${errorMsg}`,
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

  // Performance: memoized session data with limited history
  const activeSession = useMemo(() => {
    const session = getActiveSession();
    if (!session) return null;
    // Return session with limited messages for rendering
    return {
      ...session,
      messages: session.messages.slice(-15), // Only keep last 15 for UI
    };
  }, [getActiveSession, state.activeSessionId]);

  return {
    sendMessage,
    stopStreaming,
    createSession,
    deleteSession,
    switchSession,
    isLoading: state.isLoading,
    isStreaming: streamingRef.current,
    activeSession,
    sessions: state.sessions,
    // Expose skill detection for UI hints
    detectSkill: SkillsService.detectSkill,
    getSkillMeta SkillsService.getMetadata,
  };
}
