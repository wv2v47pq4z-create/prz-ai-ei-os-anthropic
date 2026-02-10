/**
 * Pillar 3: GOOSEGUARD
 * Meta-awareness logic to detect and break redundant conversational loops
 * 
 * Uses Levenshtein distance for accurate string similarity measurement
 * to prevent false positives/negatives in loop detection.
 */

import { validateRange } from '../security';

// Constants for loop detection (configurable via environment variables)
const LOOP_DETECTION_WINDOW_MS_RAW = parseInt(process.env.PRZ_LOOP_DETECTION_WINDOW_MS || '300000');
const SIMILARITY_THRESHOLD_RAW = parseFloat(process.env.PRZ_LOOP_SIMILARITY_THRESHOLD || '0.80');

// Validate environment variable values
validateRange(LOOP_DETECTION_WINDOW_MS_RAW, 1000, 3600000, 'PRZ_LOOP_DETECTION_WINDOW_MS');
validateRange(SIMILARITY_THRESHOLD_RAW, 0, 1, 'PRZ_LOOP_SIMILARITY_THRESHOLD');

const LOOP_DETECTION_WINDOW_MS = LOOP_DETECTION_WINDOW_MS_RAW; // 5 minutes default
const SIMILARITY_THRESHOLD = SIMILARITY_THRESHOLD_RAW; // 80% similarity default
const MAX_SIMILAR_ACTIONS = 3; // Maximum similar actions before triggering loop detection

export interface Action {
  id: string;
  type: string;
  payload: string | Record<string, unknown>;
  timestamp: number;
}

export interface GuardResult {
  shouldProceed: boolean;
  reason?: string;
  suggestion?: string;
}

/**
 * Detects if an action is part of a redundant loop using improved similarity metrics.
 * Implements Pillar 3 (GOOSEGUARD) to break redundant user loops.
 * 
 * @param action Current action to check
 * @param history Previous actions for comparison
 * @returns Guard result indicating whether to proceed and suggestions if blocked
 * 
 * @example
 * ```typescript
 * const guard = beforeAction(currentAction, actionHistory);
 * if (!guard.shouldProceed) {
 *   console.log(`Blocked: ${guard.reason}`);
 *   console.log(`Suggestion: ${guard.suggestion}`);
 * }
 * ```
 */
export function beforeAction(action: Action, history: Action[]): GuardResult {
  // Filter to recent actions within detection window
  const recentActions = history.filter(
    h => action.timestamp - h.timestamp < LOOP_DETECTION_WINDOW_MS
  );

  // Count similar actions using improved string similarity
  const similarActions = recentActions.filter(h => {
    if (h.type !== action.type) return false;
    
    // For string payloads, use Levenshtein-based similarity
    if (typeof h.payload === 'string' && typeof action.payload === 'string') {
      const similarity = calculateStringSimilarity(h.payload, action.payload);
      return similarity >= SIMILARITY_THRESHOLD;
    }
    
    // For object payloads, use JSON comparison
    if (typeof h.payload === 'object' && typeof action.payload === 'object') {
      return JSON.stringify(h.payload) === JSON.stringify(action.payload);
    }
    
    return false;
  });

  // If we see MAX_SIMILAR_ACTIONS or more similar actions, it's a loop
  if (similarActions.length >= MAX_SIMILAR_ACTIONS) {
    return {
      shouldProceed: false,
      reason: `GOOSEGUARD: Detected ${similarActions.length} similar requests within ${LOOP_DETECTION_WINDOW_MS / 1000}s. Breaking loop to preserve flow.`,
      suggestion: 'Try reformulating your request with more specific details or explore a different approach.'
    };
  }

  return { shouldProceed: true };
}

/**
 * Calculates string similarity using Levenshtein distance.
 * More accurate than simple Jaccard similarity, especially for paraphrased requests.
 * 
 * @param a First string
 * @param b Second string
 * @returns Similarity score in range [0, 1] where 1 is identical
 */
function calculateStringSimilarity(a: string, b: string): number {
  // Normalize strings
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();
  
  if (strA === strB) return 1.0;
  if (strA.length === 0 || strB.length === 0) return 0.0;
  
  const maxLen = Math.max(strA.length, strB.length);
  const distance = levenshteinDistance(strA, strB);
  
  // Convert distance to similarity score
  return 1 - (distance / maxLen);
}

/**
 * Computes Levenshtein distance between two strings.
 * Counts minimum number of edits (insertions, deletions, substitutions)
 * needed to transform one string into another.
 * 
 * @param a First string
 * @param b Second string
 * @returns Edit distance (lower is more similar)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Initialize first column (0, 1, 2, 3, ...)
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  // Initialize first row (0, 1, 2, 3, ...)
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        // Characters match, no edit needed
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        // Take minimum of insert, delete, or substitute
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // substitute
          matrix[i][j - 1] + 1,      // insert
          matrix[i - 1][j] + 1       // delete
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Checks if we should suggest a pivot to the user based on action patterns.
 * Detects when user is stuck in a repetitive pattern.
 * 
 * @param history Action history
 * @returns True if a pivot should be suggested
 */
export function shouldSuggestPivot(history: Action[]): boolean {
  if (history.length < 5) return false;
  
  const recentActions = history.slice(-5);
  const types = recentActions.map(a => a.type);
  
  // If all recent actions are the same type, suggest a pivot
  return new Set(types).size === 1;
}
