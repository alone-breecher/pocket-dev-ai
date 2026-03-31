/**
 * AgentService - Orchestrates model selection, skill triggering, and prompt engineering.
 * Acts as the "brain" between user input and API calls.
 */

import ModelRouter from './ModelRouter';
import SkillsService from './SkillsService';

// Base system prompt
const BASE_SYSTEM_PROMPT = `You are PocketDevAI, an expert coding assistant.
Be precise, practical, and developer-friendly.
Use code blocks with language tags for all code snippets.
Keep responses concise but thorough.`;

// Skill-enhanced prompts (extended by SkillsService)
const SKILL_PROMPT_EXTENSIONS = {
  code_review: `You are a senior developer conducting a code review. 
Focus on: bugs, security issues, performance, readability, and best practices.
Structure feedback: 1) Summary 2) Issues found 3) Suggestions.`,
  
  bug_fix: `You are a debugging expert. Analyze the error and provide:
1) Root cause explanation 2) Fixed code 3) Prevention tips.
Always test your fix mentally before suggesting.`,
  
  explain_code: `You are a teacher explaining code to a junior developer.
Break down complex concepts simply. Use analogies when helpful.
Highlight: what it does, how it works, and key takeaways.`,
  
  optimize_code: `You are a performance engineer. Analyze code for:
1) Time/space complexity 2) Bottlenecks 3) Optimization strategies.
Provide before/after code with explanations of improvements.`,
};

export class AgentService {
  /**
   * Analyze message and prepare API request parameters
   * @param {string} userMessage - Raw user input
   * @param {Object} options - { projectContext, userSelectedModel, history }
   * @returns {Promise<Object>} Prepared request: { model, messages, systemPrompt }
   */
  static async prepareRequest(userMessage, options = {}) {
    const { projectContext = '', userSelectedModel = null, history = [] } = options;
    
    // Step 1: Detect skill (if any)
    const skill = SkillsService.detectSkill(userMessage);
    
    // Step 2: Route to appropriate model (respecting user preference)
    const routing = ModelRouter.routeWithPreference(userMessage, userSelectedModel);
    
    // Step 3: Build system prompt
    const systemPrompt = this._buildSystemPrompt(skill, projectContext);
    
    // Step 4: Prepare messages array
    const messages = this._prepareMessages(userMessage, history, projectContext, skill);
    
    return {
      model: routing.model,
      messages,
      systemPrompt,
      meta {
        intent: routing.intent,
        skill,
        autoRouted: routing.auto,
      },
    };
  }

  /**
   * Build system prompt based on skill and context
   * @private
   */
  static _buildSystemPrompt(skill, projectContext) {
    let prompt = BASE_SYSTEM_PROMPT;
    
    // Add skill-specific instructions
    if (skill && SKILL_PROMPT_EXTENSIONS[skill]) {
      prompt += `\n\n${SKILL_PROMPT_EXTENSIONS[skill]}`;
    }
    
    // Add project context if provided
    if (projectContext && projectContext.trim()) {
      prompt += `\n\nProject Context:\n${projectContext.slice(0, 2000)}`; // Limit context size
    }
    
    return prompt;
  }

  /**
   * Prepare messages array for API (with history management)
   * @private
   */
  static _prepareMessages(userMessage, history, projectContext, skill) {
    // Format current user message (enhance with skill context if needed)
    const enhancedUserMessage = SkillsService.enhanceUserMessage(userMessage, skill);
    
    // Build messages: system + limited history + current
    const messages = [
      // System prompt will be added separately by OllamaService
      ...history
        .filter(m => m.role && m.content)
        .slice(-8) // Keep last 8 messages for context window (memory optimization)
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: enhancedUserMessage },
    ];
    
    return messages;
  }

  /**
   * Post-process AI response (formatting, skill-specific output handling)
   * @param {string} response - Raw AI response
   * @param {Object} metadata - { skill, intent } from prepareRequest
   * @returns {string} Formatted response
   */
  static postProcess(response, metadata = {}) {
    const { skill } = metadata;
    
    // Skill-specific formatting can be added here
    if (skill === 'code_review') {
      // Ensure review has clear sections
      if (!response.includes('##') && !response.includes('**')) {
        return `## Code Review\n\n${response}`;
      }
    }
    
    return response;
  }
}

export default AgentService;
