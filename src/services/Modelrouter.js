/**
 * ModelRouter - Smart model selection based on user intent.
 * Detects: coding, reasoning, or normal queries.
 */

import { VALID_CLOUD_MODELS } from './OllamaService';

// Keyword patterns for intent detection
const INTENT_PATTERNS = {
  coding: [
    /\bcode\b/i, /\bbug\b/i, /\bfix\b/i, /\berror\b/i, /\bapi\b/i,
    /\bfunction\b/i, /\bclass\b/i, /\bcomponent\b/i, /\breact\b/i,
    /\bjavascript\b/i, /\bpython\b/i, /\btypescript\b/i, /\bsyntax\b/i,
    /\bdebug\b/i, /\bimplement\b/i, /\bwrite\b.*\bcode\b/i, /\brefactor\b/i,
  ],
  reasoning: [
    /\bwhy\b/i, /\bexplain\b/i, /\barchitecture\b/i, /\boptimize\b/i,
    /\bstrategy\b/i, /\bapproach\b/i, /\bdesign pattern\b/i, /\bbest practice\b/i,
    /\btrade-off\b/i, /\bcomplexity\b/i, /\balgorithm\b/i, /\bperformance\b/i,
  ],
};

// Model mapping based on intent
const MODEL_MAP = {
  coding: VALID_CLOUD_MODELS.QWEN_CODER,
  reasoning: VALID_CLOUD_MODELS.DEEPSEEK_CODER,
  normal: VALID_CLOUD_MODELS.LLAMA3,
};

export class ModelRouter {
  /**
   * Detect user intent from message text
   * @param {string} message - User's message
   * @returns {string} 'coding' | 'reasoning' | 'normal'
   */
  static detectIntent(message) {
    if (!message || typeof message !== 'string') return 'normal';
    
    const lowerMsg = message.toLowerCase();
    
    // Check coding patterns first (most specific)
    for (const pattern of INTENT_PATTERNS.coding) {
      if (pattern.test(lowerMsg)) return 'coding';
    }
    
    // Check reasoning patterns
    for (const pattern of INTENT_PATTERNS.reasoning) {
      if (pattern.test(lowerMsg)) return 'reasoning';
    }
    
    return 'normal';
  }

  /**
   * Get optimal model for the detected intent
   * @param {string} intent - Detected intent
   * @returns {string} Model ID
   */
  static getModelForIntent(intent) {
    return MODEL_MAP[intent] || MODEL_MAP.normal;
  }

  /**
   * Main method: route message to best model
   * @param {string} message - User message
   * @returns {{ model: string, intent: string }}
   */
  static route(message) {
    const intent = this.detectIntent(message);
    const model = this.getModelForIntent(intent);
    return { model, intent };
  }

  /**
   * Override detection if user explicitly requests a model type
   * @param {string} message - User message
   * @param {string|null} userPreference - Optional user-selected model
   * @returns {{ model: string, intent: string, auto: boolean }}
   */
  static routeWithPreference(message, userPreference = null) {
    // If user explicitly selected a valid model, respect it
    if (userPreference && Object.values(VALID_CLOUD_MODELS).includes(userPreference)) {
      return {
        model: userPreference,
        intent: this.detectIntent(message),
        auto: false,
      };
    }
    
    // Otherwise use auto-routing
    const { model, intent } = this.route(message);
    return { model, intent, auto: true };
  }
}

export default ModelRouter;
