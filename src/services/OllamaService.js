/**
 * OllamaService - Handles all communication with the Ollama API server.
 * Supports streaming and non-streaming responses.
 * Designed to be lightweight and memory-efficient.
 */

const SYSTEM_PROMPT = `You are PocketDevAI, an expert coding assistant running on the Ollama framework.
You help developers with:
- Writing, debugging, and explaining code
- Code reviews and best practices
- Architecture and design decisions
- Bug fixes and optimizations
- Documentation and comments

When writing code:
1. Always use proper formatting with code blocks and language tags
2. Keep explanations concise but thorough
3. Highlight important caveats or edge cases
4. Suggest improvements when relevant

Be direct, practical, and developer-friendly.`;

class OllamaService {
  constructor() {
    this.baseUrl = 'https://api.ollama.com';
    this.apiKey = '';
    this.requestTimeout = 60000; // 60 seconds
    this.abortControllers = new Map();
  }

  configure(baseUrl, apiKey = '') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // strip trailing slash
    this.apiKey = apiKey;
  }

  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  /**
   * Check if the Ollama server is reachable
   */
  async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: this._getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetch available models from the Ollama server
   */
  async getModels() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        headers: this._getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      return (data.models || []).map(m => ({
        id: m.name,
        name: m.name,
        size: m.size,
        modifiedAt: m.modified_at,
        tag: detectModelTag(m.name),
      }));
    } catch (err) {
      throw new Error(`Failed to fetch models: ${err.message}`);
    }
  }

  /**
   * Send a chat message with streaming support.
   * @param {Object} params
   * @param {string} params.model - Model ID
   * @param {Array} params.messages - Message history
   * @param {string} params.sessionId - For abort tracking
   * @param {Function} params.onChunk - Called with each text chunk
   * @param {Function} params.onDone - Called when streaming completes
   * @param {Function} params.onError - Called on error
   */
  async chatStream({ model, messages, sessionId, onChunk, onDone, onError }) {
    // Cancel any existing request for this session
    this.abortSession(sessionId);

    const controller = new AbortController();
    this.abortControllers.set(sessionId, controller);

    const payload = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-20).map(m => ({ // only last 20 for context window
          role: m.role,
          content: m.content,
        })),
      ],
      stream: true,
      options: {
        temperature: 0.7,
        num_ctx: 4096,
        num_predict: 2048,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const json = JSON.parse(trimmed);

            if (json.message?.content) {
              fullContent += json.message.content;
              onChunk?.(json.message.content, fullContent);
            }

            if (json.done) {
              onDone?.(fullContent);
              this.abortControllers.delete(sessionId);
              return;
            }

            if (json.error) {
              throw new Error(json.error);
            }
          } catch (parseErr) {
            // Skip malformed JSON lines
          }
        }
      }

      // Stream ended without explicit done
      onDone?.(fullContent);
    } catch (err) {
      if (err.name === 'AbortError') {
        onDone?.(undefined, true); // aborted
      } else {
        onError?.(err.message || 'Request failed');
      }
    } finally {
      this.abortControllers.delete(sessionId);
    }
  }

  /**
   * Non-streaming fallback chat
   */
  async chat({ model, messages }) {
    const payload = {
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-20).map(m => ({
          role: m.role,
          content: m.content,
        })),
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_ctx: 4096,
        num_predict: 2048,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  /**
   * Abort an in-progress request for a session
   */
  abortSession(sessionId) {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
    }
  }

  /**
   * Abort all in-progress requests
   */
  abortAll() {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }
}

function detectModelTag(name) {
  const lower = name.toLowerCase();
  if (lower.includes('coder') || lower.includes('code') || lower.includes('deepseek')) return 'CODING';
  if (lower.includes('llama')) return 'META';
  if (lower.includes('gemma')) return 'GOOGLE';
  if (lower.includes('mistral')) return 'MISTRAL';
  if (lower.includes('qwen')) return 'QWEN';
  return 'CHAT';
}

// Singleton instance
export const ollamaService = new OllamaService();
export default ollamaService;
