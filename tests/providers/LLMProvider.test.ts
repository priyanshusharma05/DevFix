import { expect } from 'chai';
import {
  BaseLLMProvider,
  MockLLMProvider,
  LLMConfig,
  LLMRequest,
  DevFixError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  ProviderError,
} from '../../src';

describe('Phase 1: Core and LLMProvider Foundation', () => {
  const defaultConfig: LLMConfig = {
    model: 'test-model',
    temperature: 0.2,
    maxTokens: 1000,
    timeoutMs: 5000,
  };

  describe('Configuration Validation', () => {
    it('should initialize with valid configuration', () => {
      const provider = new MockLLMProvider(defaultConfig);
      const config = provider.getConfig();

      expect(config.model).to.equal('test-model');
      expect(config.temperature).to.equal(0.2);
      expect(config.maxTokens).to.equal(1000);
      expect(config.timeoutMs).to.equal(5000);
    });

    it('should throw DevFixError on empty model string', () => {
      expect(() => {
        new MockLLMProvider({ ...defaultConfig, model: '' });
      }).to.throw(DevFixError, /Model identifier must be a non-empty string/);
    });

    it('should reject invalid temperature (< 0 or > 2)', () => {
      expect(() => {
        new MockLLMProvider({ ...defaultConfig, temperature: -0.5 });
      }).to.throw(DevFixError, /Temperature must be a number between 0.0 and 2.0/);

      expect(() => {
        new MockLLMProvider({ ...defaultConfig, temperature: 2.5 });
      }).to.throw(DevFixError, /Temperature must be a number between 0.0 and 2.0/);
    });

    it('should reject invalid maxTokens (non-positive or float)', () => {
      expect(() => {
        new MockLLMProvider({ ...defaultConfig, maxTokens: -10 });
      }).to.throw(DevFixError, /Max tokens must be a positive integer/);

      expect(() => {
        new MockLLMProvider({ ...defaultConfig, maxTokens: 10.5 });
      }).to.throw(DevFixError, /Max tokens must be a positive integer/);
    });

    it('should reject invalid timeoutMs (<= 0)', () => {
      expect(() => {
        new MockLLMProvider({ ...defaultConfig, timeoutMs: 0 });
      }).to.throw(DevFixError, /Timeout must be a positive number in milliseconds/);
    });

    it('should update configuration dynamically with validation', () => {
      const provider = new MockLLMProvider(defaultConfig);
      provider.updateConfig({ temperature: 0.7, model: 'gpt-4o-mini' });

      const updated = provider.getConfig();
      expect(updated.temperature).to.equal(0.7);
      expect(updated.model).to.equal('gpt-4o-mini');
      expect(updated.maxTokens).to.equal(1000); // Preserved
    });
  });

  describe('Request Execution & Response Normalization', () => {
    it('should successfully complete request with default canned response', async () => {
      const provider = new MockLLMProvider(defaultConfig);
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Fix this syntax error' }],
      };

      const response = await provider.complete(request);

      expect(response).to.have.property('content');
      expect(response.content).to.include('Mocked fix applied successfully');
      expect(response.model).to.equal('test-model');
      expect(response.provider).to.equal('mock');
      expect(response.finishReason).to.equal('stop');
      expect(response.durationMs).to.be.a('number');
      expect(response.usage).to.deep.equal({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should serve enqueued custom responses in FIFO order', async () => {
      const provider = new MockLLMProvider(defaultConfig);
      provider.enqueueResponse('First response');
      provider.enqueueResponse('Second response');

      const res1 = await provider.complete({ messages: [{ role: 'user', content: '1' }] });
      const res2 = await provider.complete({ messages: [{ role: 'user', content: '2' }] });

      expect(res1.content).to.equal('First response');
      expect(res2.content).to.equal('Second response');
    });

    it('should reject requests with empty messages array', async () => {
      const provider = new MockLLMProvider(defaultConfig);
      try {
        await provider.complete({ messages: [] });
        expect.fail('Expected complete to throw');
      } catch (err) {
        expect(err).to.be.instanceOf(DevFixError);
        expect((err as DevFixError).code).to.equal('INVALID_REQUEST');
      }
    });

    it('should merge request-level config overrides', async () => {
      const provider = new MockLLMProvider(defaultConfig);
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Test' }],
        config: { model: 'override-model', temperature: 0.9 },
      };

      const response = await provider.complete(request);
      expect(response.model).to.equal('override-model');
      expect(provider.requestHistory[0].config?.model).to.equal('override-model');
    });
  });

  describe('Timeout and Error Normalization', () => {
    it('should normalize timeout errors into TimeoutError', async () => {
      const provider = new MockLLMProvider(
        { ...defaultConfig, timeoutMs: 50 },
        { delayMs: 150 }
      );

      try {
        await provider.complete({
          messages: [{ role: 'user', content: 'Slow request' }],
        });
        expect.fail('Expected complete to time out');
      } catch (err) {
        expect(err).to.be.instanceOf(TimeoutError);
        const timeoutErr = err as TimeoutError;
        expect(timeoutErr.code).to.equal('TIMEOUT_ERROR');
        expect(timeoutErr.timeoutMs).to.equal(50);
        expect(timeoutErr.provider).to.equal('mock');
      }
    });

    it('should normalize 401 Unauthorized into AuthenticationError', async () => {
      const provider = new MockLLMProvider(defaultConfig, {
        shouldFail: true,
        failureError: new Error('Request failed with status code 401 Unauthorized'),
      });

      try {
        await provider.complete({
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Expected authentication failure');
      } catch (err) {
        expect(err).to.be.instanceOf(AuthenticationError);
        const authErr = err as AuthenticationError;
        expect(authErr.code).to.equal('AUTHENTICATION_ERROR');
        expect(authErr.statusCode).to.equal(401);
      }
    });

    it('should normalize 429 Rate Limit into RateLimitError', async () => {
      const provider = new MockLLMProvider(defaultConfig, {
        shouldFail: true,
        failureError: new Error('429 Too Many Requests: Rate limit reached'),
      });

      try {
        await provider.complete({
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Expected rate limit failure');
      } catch (err) {
        expect(err).to.be.instanceOf(RateLimitError);
        const rateErr = err as RateLimitError;
        expect(rateErr.code).to.equal('RATE_LIMIT_ERROR');
        expect(rateErr.statusCode).to.equal(429);
      }
    });

    it('should sanitize API keys from error messages', async () => {
      const sensitiveKey = 'sk-proj-1234567890abcdef1234567890abcdef';
      const provider = new MockLLMProvider(defaultConfig, {
        shouldFail: true,
        failureError: new Error(`Internal network failure with key: ${sensitiveKey}`),
      });

      try {
        await provider.complete({
          messages: [{ role: 'user', content: 'Test' }],
        });
        expect.fail('Expected provider failure');
      } catch (err) {
        expect(err).to.be.instanceOf(ProviderError);
        const provErr = err as ProviderError;
        expect(provErr.message).to.not.include(sensitiveKey);
        expect(provErr.message).to.include('sk-***REDACTED***');
      }
    });

    it('should report availability status correctly', async () => {
      const availableProvider = new MockLLMProvider(defaultConfig, { isAvailableResult: true });
      const unavailableProvider = new MockLLMProvider(defaultConfig, { isAvailableResult: false });

      expect(await availableProvider.isAvailable()).to.be.true;
      expect(await unavailableProvider.isAvailable()).to.be.false;
    });
  });
});
