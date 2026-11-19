/**
 * DevFix AI Engine - Standard Domain Errors
 *
 * Strongly typed error hierarchy to facilitate resilient handling,
 * descriptive diagnostics, and accurate error reporting without leaking secrets.
 */

export class DevFixError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly details?: unknown;

  constructor(message: string, code = 'DEVFIX_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ProviderError extends DevFixError {
  public readonly provider: string;
  public readonly statusCode?: number;

  constructor(message: string, provider: string, statusCode?: number, details?: unknown) {
    super(message, 'PROVIDER_ERROR', details);
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends ProviderError {
  constructor(provider: string, message = 'Authentication failed. Please verify API key or credentials.') {
    super(message, provider, 401);
    (this as { code: string }).code = 'AUTHENTICATION_ERROR';
  }
}

export class RateLimitError extends ProviderError {
  public readonly retryAfterMs?: number;

  constructor(provider: string, retryAfterMs?: number, message = 'Rate limit exceeded. Please back off before retrying.') {
    super(message, provider, 429, { retryAfterMs });
    (this as { code: string }).code = 'RATE_LIMIT_ERROR';
    this.retryAfterMs = retryAfterMs;
  }
}

export class TimeoutError extends ProviderError {
  public readonly timeoutMs: number;

  constructor(provider: string, timeoutMs: number, message = `Request timed out after ${timeoutMs}ms`) {
    super(message, provider, 408, { timeoutMs });
    (this as { code: string }).code = 'TIMEOUT_ERROR';
    this.timeoutMs = timeoutMs;
  }
}

export class MalformedResponseError extends DevFixError {
  public readonly rawContent?: string;

  constructor(message: string, rawContent?: string, details?: unknown) {
    super(message, 'MALFORMED_RESPONSE_ERROR', details);
    this.rawContent = rawContent;
  }
}

export class ValidationError extends DevFixError {
  public readonly errors: string[];

  constructor(message: string, errors: string[] = [], details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.errors = errors;
  }
}

export class PromptInjectionError extends DevFixError {
  constructor(message = 'Potential prompt injection attempt or disallowed instruction detected in untrusted input.') {
    super(message, 'PROMPT_INJECTION_DETECTED');
  }
}

export class PrivacyViolationError extends DevFixError {
  constructor(message = 'Privacy violation: External network transmission blocked while running in Local Privacy Mode.') {
    super(message, 'PRIVACY_VIOLATION');
  }
}
