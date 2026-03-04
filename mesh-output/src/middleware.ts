/**
 * Security Middleware — Added by AUDITOR agent
 * Rate limiting, security headers, input validation
 */

import * as http from 'node:http';

// ── Rate Limiter ─────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60_000;  // 1 minute
const RATE_LIMIT_MAX = 100;            // 100 requests per minute

export function rateLimit(req: http.IncomingMessage): boolean {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimits.set(ip, entry);
  }

  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// ── Security Headers ─────────────────────────────────────────────────

export function applySecurityHeaders(res: http.ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// ── Input Validation ─────────────────────────────────────────────────

const VALID_PRIORITIES = ['critical', 'high', 'normal', 'low'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateQueueMessage(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Body must be a JSON object' };
  }

  const msg = body as Record<string, unknown>;

  if (msg.priority && !VALID_PRIORITIES.includes(msg.priority as string)) {
    return { valid: false, error: `Invalid priority. Must be: ${VALID_PRIORITIES.join(', ')}` };
  }

  if (msg.payload === undefined) {
    return { valid: false, error: 'Missing required field: payload' };
  }

  if (msg.source && typeof msg.source !== 'string') {
    return { valid: false, error: 'Field "source" must be a string' };
  }

  return { valid: true };
}
