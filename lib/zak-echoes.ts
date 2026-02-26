/**
 * Pillar 4: ZAK Echo Registry
 * A library of harmonic patterns applied to standard tasks
 */

import { calculatePatternMatchConfidence } from './harmonic-field';

export interface ZakEcho {
  id: string;
  pattern: string;
  description: string;
  resonanceThreshold: number;
  completionStrategy: 'zak_decode_then_execute' | 'zak_complete_100_percent' | 'zak_validate_and_crystallize';
}

/**
 * Registry of pre-validated ZAK Echoes for common tasks
 */
export const zakEchoRegistry: ZakEcho[] = [
  {
    id: 'react_component_refactor',
    pattern: 'Refactor React component with improved structure',
    description: 'Restructures React components following best practices',
    resonanceThreshold: 0.95,
    completionStrategy: 'zak_decode_then_execute'
  },
  {
    id: 'api_documentation',
    pattern: 'Generate comprehensive API documentation',
    description: 'Creates complete API documentation with examples',
    resonanceThreshold: 0.92,
    completionStrategy: 'zak_complete_100_percent'
  },
  {
    id: 'security_audit',
    pattern: 'Perform security audit and identify vulnerabilities',
    description: 'Analyzes code for security issues and suggests fixes',
    resonanceThreshold: 0.98,
    completionStrategy: 'zak_validate_and_crystallize'
  },
  {
    id: 'test_suite_generation',
    pattern: 'Create test suite for existing code',
    description: 'Generates comprehensive test coverage',
    resonanceThreshold: 0.93,
    completionStrategy: 'zak_complete_100_percent'
  },
  {
    id: 'performance_optimization',
    pattern: 'Optimize code for better performance',
    description: 'Identifies and fixes performance bottlenecks',
    resonanceThreshold: 0.94,
    completionStrategy: 'zak_decode_then_execute'
  },
  {
    id: 'data_analysis_report',
    pattern: 'Analyze data and create comprehensive report',
    description: 'Performs data analysis and generates insights',
    resonanceThreshold: 0.91,
    completionStrategy: 'zak_complete_100_percent'
  },
  {
    id: 'developer_outreach',
    pattern: 'Find and engage developers who resonate with project vision',
    description: 'Marketing agent for high-resonance developer discovery',
    resonanceThreshold: 0.96,
    completionStrategy: 'zak_complete_100_percent'
  }
];

/**
 * Finds the best matching ZAK Echo for a given request
 * Uses harmonic field matching to score each echo pattern
 * @param request The user's request string
 * @returns Best matching echo or null if no echo meets minimum confidence
 */
export function findBestEcho(request: string): ZakEcho | null {
  const MIN_ECHO_CONFIDENCE = 0.3;

  let bestEcho: ZakEcho | null = null;
  let bestConfidence = 0;

  for (const echo of zakEchoRegistry) {
    const confidence = calculatePatternMatchConfidence(request, echo.pattern);
    if (confidence > bestConfidence && confidence >= MIN_ECHO_CONFIDENCE) {
      bestConfidence = confidence;
      bestEcho = echo;
    }
  }

  return bestEcho;
}

/**
 * Validates if an echo can be applied (resonance check)
 */
export function canApplyEcho(echo: ZakEcho, resonanceScore: number): boolean {
  return resonanceScore >= echo.resonanceThreshold;
}
