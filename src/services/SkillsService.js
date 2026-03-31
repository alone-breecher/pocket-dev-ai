/**
 * SkillsService - Detects and applies specialized skills to user requests.
 * Skills: code_review, bug_fix, explain_code, optimize_code
 */

// Skill detection patterns (ordered by specificity)
const SKILL_PATTERNS = {
  code_review: [
    /\breview\b.*\bcode\b/i, /\bcode\b.*\breview\b/i,
    /\bcheck\b.*\bcode\b/i, /\bis this code\b/i,
    /\bwhat do you think of\b.*\bcode\b/i, /\bfeedback\b.*\bcode\b/i,
  ],
  bug_fix: [
    /\bfix\b/i, /\bbug\b/i, /\berror\b.*\bfix\b/i, /\bnot working\b/i,
    /\bwhy isn't\b/i, /\bbroken\b/i, /\bcrash\b/i, /\bexception\b/i,
    /\bdoesn't work\b/i, /\bissue\b.*\bcode\b/i,
  ],
  explain_code: [
    /\bexplain\b/i, /\bwhat does\b.*\bdo\b/i, /\bhow does\b/i,
    /\bwalk me through\b/i, /\bteach me\b/i, /\bunderstand\b.*\bcode\b/i,
  ],
  optimize_code: [
    /\boptimize\b/i, /\bmake.*faster\b/i, /\bperformance\b/i,
    /\befficient\b/i, /\bimprove\b.*\bperformance\b/i, /\brefactor\b.*\bperformance\b/i,
  ],
};

// Skill metadata for UI/UX
export const SKILL_METADATA = {
  code_review: {
    label: 'Code Review',
    icon: 'search-outline',
    color: '#8b85ff',
    description: 'Get expert feedback on your code',
  },
  bug_fix: {
    label: 'Bug Fix',
    icon: 'bug-outline',
    color: '#ff6b6b',
    description: 'Diagnose and fix issues',
  },
  explain_code: {
    label: 'Explain Code',
    icon: 'lightbulb-outline',
    color: '#ffd93d',
    description: 'Understand how code works',
  },
  optimize_code: {
    label: 'Optimize',
    icon: 'flash-outline',
    color: '#00d4aa',
    description: 'Improve performance & efficiency',
  },
};

export class SkillsService {
  /**
   * Detect which skill (if any) the user is requesting
   * @param {string} message - User message
   * @returns {string|null} Skill key or null
   */
  static detectSkill(message) {
    if (!message || typeof message !== 'string') return null;
    
    const lowerMsg = message.toLowerCase();
    
    // Check each skill's patterns
    for (const [skill, patterns] of Object.entries(SKILL_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerMsg)) {
          return skill;
        }
      }
    }
    
    return null;
  }

  /**
   * Get skill metadata for UI display
   * @param {string|null} skill - Skill key
   * @returns {Object|null} Metadata object
   */
  static getMetadata(skill) {
    return skill ? SKILL_METADATA[skill] : null;
  }

  /**
   * Enhance user message with skill-specific instructions
   * @param {string} userMessage - Original message
   * @param {string|null} skill - Detected skill
   * @returns {string} Enhanced message
   */
  static enhanceUserMessage(userMessage, skill) {
    if (!skill) return userMessage;
    
    const enhancements = {
      code_review: `Please review this code thoroughly:\n\n${userMessage}`,
      bug_fix: `I need help fixing this issue. Please analyze and provide a solution:\n\n${userMessage}`,
      explain_code: `Please explain this code in simple terms:\n\n${userMessage}`,
      optimize_code: `Please analyze and suggest optimizations for this code:\n\n${userMessage}`,
    };
    
    return enhancements[skill] || userMessage;
  }

  /**
   * Get all available skills for UI listing
   * @returns {Array} Array of skill objects
   */
  static getAllSkills() {
    return Object.entries(SKILL_METADATA).map(([key, meta]) => ({
      key,
      ...meta,
      patterns: SKILL_PATTERNS[key].map(p => p.toString()),
    }));
  }

  /**
   * Check if a message contains code (for skill activation hints)
   * @param {string} message - User message
   * @returns {boolean}
   */
  static containsCode(message) {
    if (!message) return false;
    // Simple heuristic: look for code block markers or common code patterns
    return /```|function\s*\(|const\s+\w+\s*=|class\s+\w+|import\s+from/.test(message);
  }
}

export default SkillsService;
