# Contributing to PRZ AI/EI/OS 🌀

First off, thank you for considering contributing to the Post-Reality Zone Operating System! It is the collective resonance of contributors like you that moves this project from Vapor to Crystal.

## 🏛 The Seven Pillars Compliance
All contributions must align with the Seven Pillars framework. If you are adding a new module or feature, ensure it:
1. **Reduces Chatter Friction**: Does it help the agent move faster with less redundant interaction?
2. **Maintains Resonance**: Does it provide clear validation for user intent?
3. **Is Modular**: Can it be plugged into the `PRZ Pipeline`?

## 🔒 Security Guidelines

### Critical Security Requirements
All code contributions **MUST** adhere to these security practices:

1. **Never commit secrets or credentials**
   - Use environment variables for all sensitive data
   - Load credentials via `requireEnv()` from `lib/security.ts`
   - Add sensitive files to `.gitignore`
   - Use `.env.example` for configuration templates

2. **Input validation is mandatory**
   - Use `validateQuery()` for all database queries to prevent NoSQL injection
   - Use `sanitizeInput()` for user-provided strings before processing
   - Use `validateRange()` for numeric inputs
   - Never trust user input directly

3. **Type safety over convenience**
   - Avoid `any` type - use `Record<string, unknown>` for flexible objects
   - Use generics for reusable components
   - Enable strict TypeScript checking
   - Prefer explicit types over inference for public APIs

4. **Error handling**
   - Always use try-catch for async operations
   - Return errors gracefully instead of crashing
   - Never expose stack traces or sensitive data in error messages
   - Log errors with appropriate detail levels

5. **Database security**
   - Always validate queries before execution
   - Use connection pooling with timeouts
   - Never log database credentials
   - Use prepared statements when possible

### Security Checklist for PRs
Before submitting a pull request:
- [ ] No hardcoded credentials or API keys
- [ ] All user inputs are validated and sanitized
- [ ] Database queries use `validateQuery()`
- [ ] Error messages don't leak sensitive information
- [ ] Environment variables documented in `.env.example`
- [ ] No `any` types without explicit justification
- [ ] All async operations have error handling

### Reporting Security Vulnerabilities
If you discover a security vulnerability, please:
1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Include detailed steps to reproduce
4. Allow time for patch development before disclosure

## 🚀 How Can I Contribute?

### 1. ZAK Echo Registry
The most impactful way to contribute is by adding new **ZAK Echoes** to `lib/zak-echoes.ts`. A ZAK Echo is a pre-validated pattern for a specific task (e.g., "React Component Refactoring", "Security Audit", "API Documentation").

### 2. Core Engine Improvements
We are always looking for better math and logic for:
- **Resonance Engine**: Improving the vector similarity logic.
- **Harmonic Field**: Enhancing complex intent matching.
- **GOOSEGUARD**: Better loop detection patterns (Levenshtein distance implementation is a good example).

### 3. Documentation & Manifestos
Help us refine the PRZ philosophy. If you can explain the concepts of "Vapor" and "Crystal" more clearly, we want your PR!

### 4. Testing
We need comprehensive test coverage:
- Unit tests for core modules (resonance-engine, gooseguard, user-feedback)
- Integration tests for pipeline workflows
- Database adapter tests with mocks
- Security vulnerability tests

## 🛠 Development Workflow
1. **Fork** the repository.
2. **Create a branch** for your feature: `git checkout -b feature/amazing-echo`.
3. **Install dependencies**: `npm install`
4. **Build the project**: `npm run build`
5. **Run tests**: `npm test` (when implemented)
6. **Commit** your changes: `git commit -m 'Add amazing ZAK Echo'`.
7. **Push** to the branch: `git push origin feature/amazing-echo`.
8. **Open a Pull Request**.

## 📝 Code Quality Standards

### TypeScript Best Practices
- Use strict mode (already enabled in tsconfig.json)
- Prefer interfaces for data structures
- Use classes for stateful components
- Document all public APIs with JSDoc
- Keep functions focused and testable

### Naming Conventions
- **Files**: kebab-case (e.g., `resonance-engine.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `EmotionalIntelligence`)
- **Functions/Variables**: camelCase (e.g., `measureResonance`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `LOOP_DETECTION_WINDOW_MS`)

### Documentation
- All public APIs must have JSDoc comments
- Include `@param`, `@returns`, `@throws` tags
- Provide usage examples in comments
- Document the "why" not just the "what"

## ⚖️ Code of Conduct
We operate in the **Green Lane**. Be respectful, be constructive, and help others find their flow.

---
Part of the Super Reality OS project.