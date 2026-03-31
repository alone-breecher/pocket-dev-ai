/**
 * Lightweight utility functions.
 * No heavy dependencies — keeps memory footprint minimal.
 */

// --- ID generation (no uuid package needed) ---
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// --- Date formatting ---
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (secs < 10) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- String utilities ---
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/`[^`]+`/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

export function countTokensEstimate(text) {
  // Rough estimate: ~4 chars per token
  return Math.ceil((text || '').length / 4);
}

// --- URL validation ---
export function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(url) {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

// --- Array utilities ---
export function limitArray(arr, maxLength) {
  if (!arr || arr.length <= maxLength) return arr;
  return arr.slice(arr.length - maxLength);
}

// --- Debounce ---
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// --- Detect language from code ---
export function detectLanguage(code) {
  if (!code) return 'code';
  const lower = code.toLowerCase();
  if (lower.includes('import react') || lower.includes('jsx')) return 'jsx';
  if (lower.includes('def ') && lower.includes(':')) return 'python';
  if (lower.includes('func ') && lower.includes('{')) return 'go';
  if (lower.includes('fn ') && lower.includes('->')) return 'rust';
  if (lower.includes('public class') || lower.includes('System.out')) return 'java';
  if (lower.includes('<?php')) return 'php';
  if (/^<[a-z]/.test(code.trim())) return 'html';
  if (lower.includes('const ') || lower.includes('let ') || lower.includes('=>')) return 'javascript';
  if (lower.includes(': string') || lower.includes(': number') || lower.includes('interface ')) return 'typescript';
  return 'code';
}
