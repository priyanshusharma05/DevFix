/**
 * DevFix AI Engine - LLM Provider Abstraction
 *
 * Provides a unified contract and common baseline for all LLM providers
 * (Cloud, Ollama, LocalAI, and Mocks). Encapsulates timeout handling,
 * error normalization, and configuration merging.
 */

import { LLMConfig, LLMRequest, LLMResponse, ProviderType } from '../core/types';
import {
  AuthenticationError,
  DevFixError,
  ProviderError,
  RateLimitError,
  TimeoutError,
} from '../core/errors';

/**
 * Universal interface for LLM Providers.
 * Agents exclusively interact through this interface.
 */
export interface ILLMProvider {
  readonly providerName: string;
  readonly providerType: ProviderType;

  /**
   * Sends a chat completion request to the model provider.
   */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Checks whether the provider endpoint is healthy and accessible.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Retrieves active provider configuration.
   */
  getConfig(): Readonly<LLMConfig>;

  /**
   * Updates configuration dynamically (e.g. changing model or temperature).
   */
  updateConfig(config: Partial<LLMConfig>): void;
}

/**
 * Abstract Base Provider implementing shared mechanics:
 * - Configuration validation and merging
 * - Timeout enforcement via AbortController
 * - Unified error mapping and secret-redacted logging
 */
export abstract class BaseLLMProvider implements ILLMProvider {
  public abstract readonly providerName: string;
  public abstract readonly providerType: ProviderType;

  protected config: LLMConfig;

  constructor(defaultConfig: LLMConfig) {
    this.validateConfig(defaultConfig);
    this.config = { ...defaultConfig };
  }

  public getConfig(): Readonly<LLMConfig> {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<LLMConfig>): void {
    const merged = { ...this.config, ...newConfig };
    this.validateConfig(merged);
    this.config = merged;
  }

  /**
   * Validates configuration parameters.
   * Throws DevFixError if parameters violate sane boundaries.
   */
  protected validateConfig(cfg: Partial<LLMConfig>): void {
    if (!cfg.model || typeof cfg.model !== 'string' || cfg.model.trim().length === 0) {
      throw new DevFixError('Model identifier must be a non-empty string.', 'INVALID_CONFIG');
    }

    if (cfg.temperature !== undefined) {
      if (typeof cfg.temperature !== 'number' || cfg.temperature < 0 || cfg.temperature > 2) {
        throw new DevFixError('Temperature must be a number between 0.0 and 2.0.', 'INVALID_CONFIG');
      }
    }

    if (cfg.maxTokens !== undefined) {
      if (typeof cfg.maxTokens !== 'number' || cfg.maxTokens <= 0 || !Number.isInteger(cfg.maxTokens)) {
        throw new DevFixError('Max tokens must be a positive integer.', 'INVALID_CONFIG');
      }
    }

    if (cfg.timeoutMs !== undefined) {
      if (typeof cfg.timeoutMs !== 'number' || cfg.timeoutMs <= 0) {
        throw new DevFixError('Timeout must be a positive number in milliseconds.', 'INVALID_CONFIG');
      }
    }
  }

  /**
   * Merges provider base configuration with request-specific overrides.
   */
  protected mergeConfig(requestConfig?: Partial<LLMConfig>): LLMConfig {
    if (!requestConfig) {
      return { ...this.config };
    }
    const merged = { ...this.config, ...requestConfig };
    this.validateConfig(merged);
    return merged;
  }

  /**
   * Normalizes unknown thrown errors into strongly typed DevFix domain errors,
   * ensuring API keys or sensitive auth tokens are never leaked into error messages.
   */
  protected normalizeError(error: unknown, timeoutMs: number): DevFixError {
    if (error instanceof DevFixError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);

    // Timeout detection
    if (
      message.includes('abort') ||
      message.includes('timeout') ||
      message.includes('ETIMEDOUT') ||
      (error instanceof Error && error.name === 'AbortError')
    ) {
      return new TimeoutError(this.providerName, timeoutMs);
    }

    // Authentication failure detection
    if (message.includes('401') || message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('forbidden')) {
      return new AuthenticationError(this.providerName);
    }

    // Rate limit detection
    if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
      return new RateLimitError(this.providerName);
    }

    // General provider failure
    return new ProviderError(
      `Provider ${this.providerName} failed: ${this.sanitizeErrorMessage(message)}`,
      this.providerName,
      undefined,
      error
    );
  }

  /**
   * Redacts potential API keys or tokens embedded in raw error strings.
   */
  private sanitizeErrorMessage(msg: string): string {
    return msg
      .replace(/(sk-[a-zA-Z0-9_\-]{20,})/g, 'sk-***REDACTED***')
      .replace(/(Bearer\s+)[a-zA-Z0-9_\-\.]+/gi, '$1***REDACTED***')
      .replace(/([?&]key=)[^&]+/gi, '$1***REDACTED***');
  }

  /**
   * Subclasses implement the actual execution logic.
   */
  protected abstract executeChat(
    request: LLMRequest,
    effectiveConfig: LLMConfig,
    signal: AbortSignal
  ): Promise<LLMResponse>;

  /**
   * Public entrypoint wrapping execution with timeout, validation, and error normalization.
   */
  public async complete(request: LLMRequest): Promise<LLMResponse> {
    if (!request || !Array.isArray(request.messages) || request.messages.length === 0) {
      throw new DevFixError('LLMRequest must contain at least one message.', 'INVALID_REQUEST');
    }

    const effectiveConfig = this.mergeConfig(request.config);
    const timeoutMs = effectiveConfig.timeoutMs ?? 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const startTime = Date.now();

    try {
      const response = await this.executeChat(request, effectiveConfig, controller.signal);
      response.durationMs = response.durationMs ?? (Date.now() - startTime);
      return response;
    } catch (err) {
      throw this.normalizeError(err, timeoutMs);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Subclasses implement health/availability probes.
   */
  public abstract isAvailable(): Promise<boolean>;
}
