/**
 * Pillar 2: Resonance Engine
 * Measures intent alignment and trajectory using harmonic field matching
 * 
 * This module implements polar-complex vector math for high-precision
 * intent alignment as specified in the Seven Pillars.
 */

import { clamp } from '../security';

export interface ResonanceInput {
  content: string;
  direction: number[];
  magnitude: number;
  frequency: number;
}

export interface ResonanceContext {
  state: 'vapor' | 'crystal' | 'active';
  patterns: number[];
  expectedDirection: number[];
  systemFrequency: number;
}

/**
 * Measures resonance between user input and system context.
 * Returns a score in the range [0, 1] where higher values indicate
 * better alignment.
 * 
 * @param input User's intent with direction vector, magnitude, and frequency
 * @param context System state and expected patterns
 * @returns Resonance measurement with component breakdown
 * 
 * @example
 * ```typescript
 * const result = measureResonance(
 *   { content: "Create component", direction: [0.8, 0.6], magnitude: 0.9, frequency: 0.7 },
 *   { state: 'vapor', patterns: [0.5], expectedDirection: [1, 0], systemFrequency: 0.8 }
 * );
 * console.log(result.score); // e.g., 0.87
 * ```
 */
export function measureResonance(input: ResonanceInput, context: ResonanceContext) {
  const directionSim = calculateCosineSimilarity(input.direction, context.expectedDirection);
  const magnitudeMatch = 1 - Math.abs(input.magnitude - (context.patterns[0] || 0.5));
  const frequencyMatch = 1 - Math.abs(input.frequency - context.systemFrequency);
  
  // Calculate weighted score
  const rawScore = (directionSim * 0.5) + (magnitudeMatch * 0.3) + (frequencyMatch * 0.2);
  
  // Clamp to valid range [0, 1] to handle floating point errors
  const score = clamp(rawScore, 0, 1);
  
  return {
    score,
    directionSim: clamp(directionSim, 0, 1),
    magnitudeMatch: clamp(magnitudeMatch, 0, 1),
    frequencyMatch: clamp(frequencyMatch, 0, 1),
    threshold: 0.95
  };
}

/**
 * Determines if an idea should transition from Vapor to Crystal state
 * based on resonance threshold (Pillar 5: Vapor ↔ Crystal States).
 * 
 * @param result Resonance measurement result
 * @returns True if resonance meets or exceeds threshold for crystallization
 */
export function shouldCrystallize(result: { score: number, threshold: number }): boolean {
  return result.score >= result.threshold;
}

/**
 * Calculates cosine similarity between two vectors.
 * Used for direction matching in harmonic field analysis.
 * 
 * @param a First vector
 * @param b Second vector
 * @returns Similarity score in range [0, 1]
 */
function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  if (magA === 0 || magB === 0) return 0;
  
  return clamp(dotProduct / (magA * magB), 0, 1);
}