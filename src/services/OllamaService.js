/**
 * OllamaService - Handles all communication with the Ollama Cloud API.
 * FIXED: Correct endpoint, valid models, proper auth, robust error handling.
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

// Valid cloud model names (FIXED)
export const VALID_CLOUD_MODELS = {
  LLAMA3: 'llama3',
  QWEN_CODER: 'qwen2.5-coder',
  DEEPSEEK_CODER: 'deepseek-coder',
};

class OllamaService {
  constructor() {
    // FIXED: Correct Ollama Cloud endpoint
    this.baseUrl = 'https://api.ollama.com';
    this.apiKey = '';
    this.requestTimeout = 60000;
    this.abortControllers = new Map();
  }

  configure(baseUrl, apiKey = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  _getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    // FIXED: Add Authorization header when API key exists
    if (this.apiKey && this.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${this.apiKey.trim()}`;
    }
    return headers;
  }

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
      // Return fallback models if fetch fails (FIXED: graceful degradation)
      console.warn('Failed to fetch models, using fallback:', err.message);
      return [
        { id: VALID_CLOUD_MODELS.LLAMA3, name: 'Llama 3', tag: 'META' },
        { id: VALID_CLOUD_MODELS.QWEN_CODER, name: 'Qwen 2.5 Coder', tag: 'CODING' },
        { id: VALID_CLOUD_MODELS.DEEPSEEK_CODER, name: 'DeepSeek Coder', tag: 'CODING' },
      ];
    }
  }

  async chatStream({ model, messages, sessionId, onChunk, onDone, onError }) {
    // Cancel any existing request for this session
    this.abortSession(sessionId);

    const controller = new AbortController();
    this.abortControllers.set(sessionId, controller);

    // FIXED: Use valid model names - fallback if invalid
    const validModel = VALID_CLOUD_MODELS[model] || model;
    const finalModel = Object.values(VALID_CLOUD_MODELS).includes(validModel) 
      ? validModel 
      : VALID_CLOUD_MODELS.LLAMA3;

    const payload = {
      model: finalModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10).map(m => ({ // FIXED: Limit to last 10 for memory
          role: m.role,
          content: m.content,
        })),
      ],
      stream: true,
      options: {
        temperature: 0.7,
        num_ctx: 4096,
        num_predict: 1024, // FIXED: Reduced for low-end devices
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // FIXED: Handle 404 model errors and other API errors
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        if (response.status === 404) {
          throw new Error(`Model "${finalModel}" not found. Please select a valid model.`);
        }
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API key in Settings.');
        }
        throw new Error(`API error ${response.status}: ${errorText.slice(0, 200)}`);
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
        buffer = lines.pop();

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

      onDone?.(fullContent);
    } catch (err) {
      if (err.name === 'AbortError') {
        onDone?.(undefined, true);
      } else {
        // FIXED: User-friendly error messages
        const userMessage = err.message.includes('Network') || err.message.includes('Failed to fetch')
          ? 'Network error. Please check your connection.'
          : err.message.includes('Authentication')
          ? 'Invalid API key. Update in Settings.'
          : err.message.includes('not found')
          ? 'Model unavailable. Try another model.'
          : `Error: ${err.message.slice(0, 150)}`;
        onError?.(userMessage);
      }
    } finally {
      this.abortControllers.delete(sessionId);
    }
  }

  async chat({ model, messages }) {
    const validModel = VALID_CLOUD_MODELS[model] || model;
    const finalModel = Object.values(VALID_CLOUD_MODELS).includes(validModel) 
      ? validModel 
      : VALID_CLOUD_MODELS.LLAMA3;

    const payload = {
      model: finalModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_ctx: 4096,
        num_predict: 1024,
      },
    };

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: this._getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 404) {
        throw new Error(`Model "${finalModel}" not found.`);
      }
      if (response.status === 401) {
        throw new Error('Authentication failed. Check API key.');
      }
      throw new Error(`API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  }

  abortSession(sessionId) {
    const controller = this.abortControllers.get(sessionId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(sessionId);
    }
  }

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

export const ollamaService = new OllamaService();
export default ollamaService;
