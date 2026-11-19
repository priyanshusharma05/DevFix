/**
 * DevFix AI Engine - Mock LLM Provider
 *
 * Deterministic, offline-friendly provider for unit and integration testing.
 * Simulates latency, token responses, errors, and availability checks without network calls.
 */

import { BaseLLMProvider } from './LLMProvider';
import { LLMConfig, LLMRequest, LLMResponse, ProviderType } from '../core/types';

export interface MockProviderOptions {
  cannedResponses?: string[];
  delayMs?: number;
  shouldFail?: boolean;
  failureError?: Error;
  isAvailableResult?: boolean;
}

export class MockLLMProvider extends BaseLLMProvider {
  public readonly providerName = 'mock';
  public readonly providerType: ProviderType = 'mock';

  private responseQueue: string[] = [];
  private options: MockProviderOptions;
  public requestHistory: LLMRequest[] = [];

  constructor(defaultConfig: LLMConfig, options: MockProviderOptions = {}) {
    super(defaultConfig);
    this.options = { ...options };
    if (options.cannedResponses) {
      this.responseQueue = [...options.cannedResponses];
    }
  }

  public enqueueResponse(response: string): void {
    this.responseQueue.push(response);
  }

  public clearHistory(): void {
    this.requestHistory = [];
  }

  public setOptions(options: Partial<MockProviderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public async isAvailable(): Promise<boolean> {
    return this.options.isAvailableResult ?? true;
  }

  protected async executeChat(
    request: LLMRequest,
    effectiveConfig: LLMConfig,
    signal: AbortSignal
  ): Promise<LLMResponse> {
    this.requestHistory.push(request);

    if (this.options.delayMs && this.options.delayMs > 0) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => resolve(), this.options.delayMs);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('Operation aborted due to timeout'));
        });
      });
    }

    if (signal.aborted) {
      throw new Error('Operation aborted due to timeout');
    }

    if (this.options.shouldFail) {
      throw this.options.failureError ?? new Error('Simulated provider failure');
    }

    const content = this.responseQueue.length > 0
      ? this.responseQueue.shift()!
      : JSON.stringify({
          status: 'success',
          explanation: 'Mocked fix applied successfully.',
          diff: '--- a/file.ts\n+++ b/file.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;',
        });

    return {
      content,
      model: effectiveConfig.model,
      provider: this.providerName,
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      finishReason: 'stop',
      durationMs: this.options.delayMs ?? 5,
    };
  }
}
