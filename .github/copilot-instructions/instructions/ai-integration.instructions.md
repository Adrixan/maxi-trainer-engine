---
applyTo: 
  - "**/*.py"
  - "**/*.ts"
  - "**/*.js"
  - "**/*.java"
---
<ai_integration_standards>

## AI/ML Integration Security & Patterns

When integrating LLM APIs, embedding models, or AI-powered features:

**Prompt Injection Prevention:**

- Never pass raw user input directly into system prompts. Sanitize and escape all user-provided content.
- Use structured input/output schemas (Pydantic, Zod, JSON Schema) to constrain AI responses.
- Separate system instructions from user content with clear delimiters and role-based prompting.
- Implement output validation: parse AI responses against expected schemas before using them.

**Data Security:**

- Never send PII, secrets, API keys, or internal system details to external LLM APIs.
- Use data masking/redaction before sending content to AI services.
- Log AI interactions (prompt + response) for audit — but redact sensitive content in logs.
- Review AI provider data retention policies. Prefer providers with zero-retention options for sensitive data.

**Output Safety:**

- Treat ALL AI-generated content as untrusted user input.
- Sanitize AI output before rendering in DOM (XSS risk) or executing as code (injection risk).
- Never use `eval()` or equivalent on AI-generated code without sandboxing.
- Validate AI-generated SQL, shell commands, or API calls against strict allowlists before execution.

**Reliability Patterns:**

- Implement retry with exponential backoff for AI API calls.
- Set strict timeouts (10-30s) on AI API requests.
- Provide graceful degradation when AI services are unavailable.
- Cache AI responses where appropriate (embeddings, static classifications).
- Use streaming responses for long-running AI generations to improve perceived latency.

**Cost & Rate Limiting:**

- Track token usage per request. Set per-user and per-endpoint rate limits.
- Use cheaper/smaller models for simple tasks (classification, extraction) —
  reserve large models for complex generation.
- Implement circuit breakers to prevent runaway costs during outages or loops.

**Testing:**

- Mock AI API responses in unit tests — never call real AI APIs in automated tests.
- Test with adversarial inputs (prompt injection attempts, boundary cases).
- Validate that output sanitization catches common XSS/injection patterns in AI responses.
</ai_integration_standards>
