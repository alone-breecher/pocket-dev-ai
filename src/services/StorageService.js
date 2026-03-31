import * as SecureStore from 'expo-secure-store';

const KEYS = {
  API_URL: 'api_url',
  API_KEY: 'api_key',
  SELECTED_MODEL: 'selected_model',
  SESSIONS: 'chat_sessions_v2',
  SETTINGS: 'app_settings',
};

/**
 * StorageService - Handles persisting app state to device storage.
 * Uses SecureStore for sensitive data (API keys) and AsyncStorage for rest.
 */
class StorageService {
  // --- Secure storage (API credentials) ---

  async saveApiUrl(url) {
    try {
      await SecureStore.setItemAsync(KEYS.API_URL, url);
    } catch {
      // SecureStore might fail on emulators; graceful degradation
    }
  }

  async getApiUrl() {
    try {
      return await SecureStore.getItemAsync(KEYS.API_URL);
    } catch {
      return null;
    }
  }

  async saveApiKey(key) {
    try {
      await SecureStore.setItemAsync(KEYS.API_KEY, key);
    } catch {}
  }

  async getApiKey() {
    try {
      return await SecureStore.getItemAsync(KEYS.API_KEY);
    } catch {
      return null;
    }
  }

  async saveSelectedModel(modelId) {
    try {
      await SecureStore.setItemAsync(KEYS.SELECTED_MODEL, modelId);
    } catch {}
  }

  async getSelectedModel() {
    try {
      return await SecureStore.getItemAsync(KEYS.SELECTED_MODEL);
    } catch {
      return null;
    }
  }

  async clearCredentials() {
    try {
      await SecureStore.deleteItemAsync(KEYS.API_URL);
      await SecureStore.deleteItemAsync(KEYS.API_KEY);
    } catch {}
  }

  // --- Session persistence ---

  async saveSessions(sessions) {
    try {
      // Only persist last 20 sessions with limited messages for memory efficiency
      const trimmed = sessions.slice(0, 20).map(s => ({
        ...s,
        messages: s.messages.slice(-50), // last 50 messages per session
      }));
      const json = JSON.stringify(trimmed);
      await SecureStore.setItemAsync(KEYS.SESSIONS, json);
    } catch {}
  }

  async getSessions() {
    try {
      const json = await SecureStore.getItemAsync(KEYS.SESSIONS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  // --- Settings ---

  async saveSettings(settings) {
    try {
      await SecureStore.setItemAsync(KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }

  async getSettings() {
    try {
      const json = await SecureStore.getItemAsync(KEYS.SETTINGS);
      return json ? JSON.parse(json) : {};
    } catch {
      return {};
    }
  }

  // --- Load all persisted state on app start ---

  async loadAll() {
    const [apiUrl, apiKey, selectedModel, sessions, settings] = await Promise.all([
      this.getApiUrl(),
      this.getApiKey(),
      this.getSelectedModel(),
      this.getSessions(),
      this.getSettings(),
    ]);

    return {
      apiUrl: apiUrl || 'http://localhost:11434',
      apiKey: apiKey || '',
      selectedModel: selectedModel || 'qwen2.5-coder:7b',
      sessions: sessions || [],
      settings: settings || {},
    };
  }
}

export const storageService = new StorageService();
export default storageService;
