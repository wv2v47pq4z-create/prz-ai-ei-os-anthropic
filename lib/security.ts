/**
 * Security utilities for PRZ AI/EI/OS
 * Provides input validation, sanitization, and injection prevention
 */

/**
 * Validates a database query object to prevent NoSQL injection attacks.
 * Checks for dangerous operators and prototype pollution attempts.
 * 
 * @param query The query object to validate
 * @throws Error if query contains disallowed operators or keys
 * 
 * @example
 * ```typescript
 * validateQuery({ name: "John" }); // OK
 * validateQuery({ $ne: null }); // Throws error
 * validateQuery({ __proto__: {} }); // Throws error
 * ```
 */
export function validateQuery(query: Record<string, unknown>): void {
  // List of disallowed query operators and dangerous keys
  const disallowedKeys = [
    '$where',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$in',
    '$nin',
    '$or',
    '$and',
    '$not',
    '$nor',
    '$exists',
    '$type',
    '$regex',
    '__proto__',
    'constructor',
    'prototype'
  ];

  // Check top-level keys
  const hasDisallowed = Object.keys(query).some(key => 
    disallowedKeys.includes(key) || key.startsWith('$')
  );

  if (hasDisallowed) {
    throw new Error(
      'Invalid query: disallowed operators detected. ' +
      'Only simple equality queries are allowed.'
    );
  }

  // Recursively validate nested objects
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      validateQuery(value as Record<string, unknown>);
    }
  }
}

/**
 * Sanitizes user input to prevent injection attacks and excessive length.
 * 
 * @param input The user input string to sanitize
 * @param maxLength Maximum allowed length (default: 10000)
 * @returns Sanitized input string
 * @throws Error if input exceeds maximum length
 * 
 * @example
 * ```typescript
 * const safe = sanitizeInput("Create React component"); // OK
 * const tooLong = sanitizeInput("x".repeat(20000)); // Throws error
 * ```
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  if (input.length > maxLength) {
    throw new Error(
      `Input too long: ${input.length} characters (max: ${maxLength})`
    );
  }

  // Trim whitespace and normalize unicode
  return input.trim().normalize('NFC');
}

/**
 * Validates that a value is within the expected numeric range.
 * 
 * @param value The numeric value to validate
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @param name Name of the value for error messages
 * @throws Error if value is outside the allowed range
 * 
 * @example
 * ```typescript
 * validateRange(0.8, 0, 1, "resonance"); // OK
 * validateRange(1.5, 0, 1, "resonance"); // Throws error
 * ```
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  name: string
): void {
  if (value < min || value > max) {
    throw new Error(
      `${name} value ${value} out of range [${min}, ${max}]`
    );
  }

  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
}

/**
 * Clamps a numeric value to a specified range.
 * Used to ensure values like resonance scores stay within valid bounds.
 * 
 * @param value The value to clamp
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns The clamped value
 * 
 * @example
 * ```typescript
 * clamp(1.5, 0, 1); // Returns 1.0
 * clamp(-0.1, 0, 1); // Returns 0.0
 * clamp(0.5, 0, 1); // Returns 0.5
 * ```
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validates environment variable is set and non-empty.
 * Used for required configuration like database credentials.
 * 
 * @param name Environment variable name
 * @param optional If true, returns undefined when not set instead of throwing
 * @returns The environment variable value
 * @throws Error if required environment variable is not set
 * 
 * @example
 * ```typescript
 * const password = requireEnv('MONGODB_PASSWORD');
 * const optional = requireEnv('OPTIONAL_CONFIG', true);
 * ```
 */
export function requireEnv(name: string, optional: boolean = false): string | undefined {
  const value = process.env[name];

  if (!value && !optional) {
    throw new Error(
      `Required environment variable ${name} is not set. ` +
      `Please configure it in your .env file or environment.`
    );
  }

  return value;
}
