/**
 * PRZ Pipeline Runner
 * Implements the "Complete-Then-Validate" protocol (Pillar 1)
 * 
 * This module orchestrates the Seven Pillars framework:
 * - GOOSEGUARD loop detection
 * - ZAK Echo pattern matching
 * - Resonance measurement
 * - Vapor ↔ Crystal state transitions
 * - Green Lane autonomous execution
 */

import { measureResonance, shouldCrystallize } from './prz/resonance-engine';
import { beforeAction, Action } from './prz/gooseguard';
import { calculatePatternMatchConfidence } from './harmonic-field';
import { zakEchoRegistry } from './zak-echoes';
import { 
  UserFeedback, 
  processFeedback, 
  adjustResonanceWithFeedback,
  shouldTransitionState
} from './prz/user-feedback';

export interface PipelineResult {
  deliverable: string;
  resonance: {
    score: number;
    directionSim: number;
    magnitudeMatch: number;
    frequencyMatch: number;
    threshold: number;
  };
  crystallized: boolean;
  tier: 'GREEN LANE' | 'MONITORED' | 'BLOCKED' | 'ERROR';
  artifactId?: string;
  error?: string;
  suggestedPivot?: string;
}

export interface PipelineWithFeedbackResult extends PipelineResult {
  feedbackAccepted: boolean;
  adjustedResonance?: number;
  stateTransition?: {
    occurred: boolean;
    newState: 'vapor' | 'crystal';
    reason: string;
  };
  suggestedAction?: string;
}

/**
 * Runs the PRZ pipeline to process user requests with resonance validation.
 * Implements the Seven Pillars: Complete-Then-Validate, Resonance Threshold,
 * GOOSEGUARD loop detection, and Green Lane autonomous execution.
 * 
 * @param userRequest The user's input intent to process
 * @param history Previous actions for loop detection (optional)
 * @returns Pipeline result with resonance score and execution tier
 * 
 * @example
 * ```typescript
 * const result = await runPrzPipeline("Create React component");
 * if (result.tier === 'GREEN LANE') {
 *   console.log('Autonomous execution approved');
 * }
 * ```
 */
export async function runPrzPipeline(userRequest: string, history: Action[] = []): Promise<PipelineResult> {
  try {
    // 1. Loop Detection (GOOSEGUARD - Pillar 3)
    const currentAction: Action = {
      id: `action-${Date.now()}`,
      type: 'request',
      payload: userRequest,
      timestamp: Date.now()
    };
    
    const guard = beforeAction(currentAction, history);
    if (!guard.shouldProceed) {
      return {
        deliverable: '',
        resonance: { score: 0, directionSim: 0, magnitudeMatch: 0, frequencyMatch: 0, threshold: 0.95 },
        crystallized: false,
        tier: 'BLOCKED',
        error: guard.reason,
        suggestedPivot: guard.suggestion
      };
    }

    // 2. Pattern Matching (ZAK Echo Search - Pillar 4)
    const bestMatch = zakEchoRegistry
      .map(echo => ({ echo, confidence: calculatePatternMatchConfidence(userRequest, echo.pattern) }))
      .sort((a, b) => b.confidence - a.confidence)[0];

    // 3. Execution (Simulated - in production, this would execute the actual task)
    const artifactId = `artifact-${Date.now()}`;
    let deliverable = `PRZ Deliverable for: ${userRequest}\n`;
    if (bestMatch && bestMatch.confidence >= 0.85) {
      deliverable += `Applied Pattern: ${bestMatch.echo.pattern}\n`;
    }

    // 4. Validation (Resonance Check - Pillar 2)
    const resonance = measureResonance(
      { content: userRequest, direction: [1, 0], magnitude: 0.9, frequency: 0.5 },
      { state: 'active', patterns: [0.9], expectedDirection: [1, 0], systemFrequency: 0.5 }
    );

    // Ensure resonance is valid
    if (!resonance || typeof resonance.score !== 'number') {
      throw new Error('Resonance measurement failed: invalid result');
    }

    return {
      deliverable,
      resonance,
      crystallized: shouldCrystallize(resonance),
      tier: resonance.score >= 0.95 ? 'GREEN LANE' : 'MONITORED',
      artifactId
    };
  } catch (error) {
    // Graceful error handling
    return {
      deliverable: '',
      resonance: { score: 0, directionSim: 0, magnitudeMatch: 0, frequencyMatch: 0, threshold: 0.95 },
      crystallized: false,
      tier: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown pipeline error occurred'
    };
  }
}

/**
 * Extended pipeline that includes feedback processing
 * Implements Complete-Then-Validate with user feedback loop (Pillar 1)
 * 
 * @param userRequest The user's request
 * @param feedback Optional user feedback on the deliverable
 * @param history Action history for loop detection
 * @param feedbackHistory Previous feedback for pattern detection
 * @returns Pipeline result with feedback integration
 */
export async function runPrzPipelineWithFeedback(
  userRequest: string,
  feedback?: UserFeedback,
  history: Action[] = [],
  feedbackHistory: UserFeedback[] = []
): Promise<PipelineWithFeedbackResult> {
  try {
    // Run the standard pipeline first (Complete-Then-Validate step 1: Complete)
    const pipelineResult = await runPrzPipeline(userRequest, history);

    // If pipeline errored or was blocked, return early
    if (pipelineResult.tier === 'ERROR' || pipelineResult.tier === 'BLOCKED') {
      return {
        ...pipelineResult,
        feedbackAccepted: false
      };
    }

    // If no feedback provided, return standard result
    if (!feedback) {
      return {
        ...pipelineResult,
        feedbackAccepted: false
      };
    }

    // Process user feedback (Complete-Then-Validate step 2: Validate)
    const feedbackResult = processFeedback(feedback, feedbackHistory);

    if (!feedbackResult.accepted) {
      return {
        ...pipelineResult,
        feedbackAccepted: false,
        suggestedAction: feedbackResult.suggestedAction
      };
    }

    // Adjust resonance based on feedback
    const adjustedResonance = adjustResonanceWithFeedback(
      pipelineResult.resonance.score,
      feedback
    );

    // Check if state transition is needed (Vapor ↔ Crystal - Pillar 5)
    const transition = shouldTransitionState(feedback, pipelineResult.resonance.score);

    // Determine new tier based on adjusted resonance
    const newTier = adjustedResonance >= 0.95 ? 'GREEN LANE' : 'MONITORED';

    return {
      ...pipelineResult,
      feedbackAccepted: true,
      adjustedResonance,
      tier: newTier,
      crystallized: adjustedResonance >= 0.95,
      stateTransition: {
        occurred: transition.shouldTransition,
        newState: transition.newState,
        reason: transition.reason
      },
      suggestedAction: feedbackResult.suggestedAction
    };
  } catch (error) {
    // Graceful error handling for feedback processing
    return {
      deliverable: '',
      resonance: { score: 0, directionSim: 0, magnitudeMatch: 0, frequencyMatch: 0, threshold: 0.95 },
      crystallized: false,
      tier: 'ERROR',
      feedbackAccepted: false,
      error: error instanceof Error ? error.message : 'Unknown feedback processing error'
    };
  }
}