"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const src_1 = require("../../src");
describe('Phase 1: Core and LLMProvider Foundation', () => {
    const defaultConfig = {
        model: 'test-model',
        temperature: 0.2,
        maxTokens: 1000,
        timeoutMs: 5000,
    };
    describe('Configuration Validation', () => {
        it('should initialize with valid configuration', () => {
            const provider = new src_1.MockLLMProvider(defaultConfig);
            const config = provider.getConfig();
            (0, chai_1.expect)(config.model).to.equal('test-model');
            (0, chai_1.expect)(config.temperature).to.equal(0.2);
            (0, chai_1.expect)(config.maxTokens).to.equal(1000);
            (0, chai_1.expect)(config.timeoutMs).to.equal(5000);
        });
        it('should throw DevFixError on empty model string', () => {
            (0, chai_1.expect)(() => {
                new src_1.MockLLMProvider({ ...defaultConfig, model: '' });
            }).to.throw(src_1.DevFixError, /Model identifier must be a non-empty string/);
        });
        it('should reject invalid temperature (< 0 or > 2)', () => {
            (0, chai_1.expect)(() => {
                new src_1.MockLLMProvider({ ...defaultConfig, temperature: -0.5 });
            }).to.throw(src_1.DevFixError, /Temperature must be a number between 0.0 and 2.0/);
            (0, chai_1.expect)(() => {
                new src_1.MockLLMProvider({ ...defaultConfig, temperature: 2.5 });
            }).to.throw(src_1.DevFixError, /Temperature must be a number between 0.0 and 2.0/);
        });
        it('should reject invalid maxTokens (non-positive or float)', () => {
            (0, chai_1.expect)(() => {
                new src_1.MockLLMProvider({ ...defaultConfig, maxTokens: -10 });
            }).to.throw(src_1.DevFixError, /Max tokens must be a positive integer/);
            (0, chai_1.expect)(() => {
                new src_1.MockLLMProvider({ ...defaultConfig, maxTokens: 10.5 });
            }).to.throw(src_1.DevFixError, /Max tokens must be a positive integer/);
        });
        it('should reject invalid timeoutMs (<= 0)', () => {
            (0, chai_1.expect)(() => {
                new src_1.MockLLMProvider({ ...defaultConfig, timeoutMs: 0 });
            }).to.throw(src_1.DevFixError, /Timeout must be a positive number in milliseconds/);
        });
        it('should update configuration dynamically with validation', () => {
            const provider = new src_1.MockLLMProvider(defaultConfig);
            provider.updateConfig({ temperature: 0.7, model: 'gpt-4o-mini' });
            const updated = provider.getConfig();
            (0, chai_1.expect)(updated.temperature).to.equal(0.7);
            (0, chai_1.expect)(updated.model).to.equal('gpt-4o-mini');
            (0, chai_1.expect)(updated.maxTokens).to.equal(1000); // Preserved
        });
    });
    describe('Request Execution & Response Normalization', () => {
        it('should successfully complete request with default canned response', async () => {
            const provider = new src_1.MockLLMProvider(defaultConfig);
            const request = {
                messages: [{ role: 'user', content: 'Fix this syntax error' }],
            };
            const response = await provider.complete(request);
            (0, chai_1.expect)(response).to.have.property('content');
            (0, chai_1.expect)(response.content).to.include('Mocked fix applied successfully');
            (0, chai_1.expect)(response.model).to.equal('test-model');
            (0, chai_1.expect)(response.provider).to.equal('mock');
            (0, chai_1.expect)(response.finishReason).to.equal('stop');
            (0, chai_1.expect)(response.durationMs).to.be.a('number');
            (0, chai_1.expect)(response.usage).to.deep.equal({
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30,
            });
        });
        it('should serve enqueued custom responses in FIFO order', async () => {
            const provider = new src_1.MockLLMProvider(defaultConfig);
            provider.enqueueResponse('First response');
            provider.enqueueResponse('Second response');
            const res1 = await provider.complete({ messages: [{ role: 'user', content: '1' }] });
            const res2 = await provider.complete({ messages: [{ role: 'user', content: '2' }] });
            (0, chai_1.expect)(res1.content).to.equal('First response');
            (0, chai_1.expect)(res2.content).to.equal('Second response');
        });
        it('should reject requests with empty messages array', async () => {
            const provider = new src_1.MockLLMProvider(defaultConfig);
            try {
                await provider.complete({ messages: [] });
                chai_1.expect.fail('Expected complete to throw');
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(src_1.DevFixError);
                (0, chai_1.expect)(err.code).to.equal('INVALID_REQUEST');
            }
        });
        it('should merge request-level config overrides', async () => {
            const provider = new src_1.MockLLMProvider(defaultConfig);
            const request = {
                messages: [{ role: 'user', content: 'Test' }],
                config: { model: 'override-model', temperature: 0.9 },
            };
            const response = await provider.complete(request);
            (0, chai_1.expect)(response.model).to.equal('override-model');
            (0, chai_1.expect)(provider.requestHistory[0].config?.model).to.equal('override-model');
        });
    });
    describe('Timeout and Error Normalization', () => {
        it('should normalize timeout errors into TimeoutError', async () => {
            const provider = new src_1.MockLLMProvider({ ...defaultConfig, timeoutMs: 50 }, { delayMs: 150 });
            try {
                await provider.complete({
                    messages: [{ role: 'user', content: 'Slow request' }],
                });
                chai_1.expect.fail('Expected complete to time out');
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(src_1.TimeoutError);
                const timeoutErr = err;
                (0, chai_1.expect)(timeoutErr.code).to.equal('TIMEOUT_ERROR');
                (0, chai_1.expect)(timeoutErr.timeoutMs).to.equal(50);
                (0, chai_1.expect)(timeoutErr.provider).to.equal('mock');
            }
        });
        it('should normalize 401 Unauthorized into AuthenticationError', async () => {
            const provider = new src_1.MockLLMProvider(defaultConfig, {
                shouldFail: true,
                failureError: new Error('Request failed with status code 401 Unauthorized'),
            });
            try {
                await provider.complete({
                    messages: [{ role: 'user', content: 'Test' }],
                });
                chai_1.expect.fail('Expected authentication failure');
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(src_1.AuthenticationError);
                const authErr = err;
                (0, chai_1.expect)(authErr.code).to.equal('AUTHENTICATION_ERROR');
                (0, chai_1.expect)(authErr.statusCode).to.equal(401);
            }
        });
        it('should normalize 429 Rate Limit into RateLimitError', async () => {
            const provider = new src_1.MockLLMProvider(defaultConfig, {
                shouldFail: true,
                failureError: new Error('429 Too Many Requests: Rate limit reached'),
            });
            try {
                await provider.complete({
                    messages: [{ role: 'user', content: 'Test' }],
                });
                chai_1.expect.fail('Expected rate limit failure');
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(src_1.RateLimitError);
                const rateErr = err;
                (0, chai_1.expect)(rateErr.code).to.equal('RATE_LIMIT_ERROR');
                (0, chai_1.expect)(rateErr.statusCode).to.equal(429);
            }
        });
        it('should sanitize API keys from error messages', async () => {
            const sensitiveKey = 'sk-proj-1234567890abcdef1234567890abcdef';
            const provider = new src_1.MockLLMProvider(defaultConfig, {
                shouldFail: true,
                failureError: new Error(`Internal network failure with key: ${sensitiveKey}`),
            });
            try {
                await provider.complete({
                    messages: [{ role: 'user', content: 'Test' }],
                });
                chai_1.expect.fail('Expected provider failure');
            }
            catch (err) {
                (0, chai_1.expect)(err).to.be.instanceOf(src_1.ProviderError);
                const provErr = err;
                (0, chai_1.expect)(provErr.message).to.not.include(sensitiveKey);
                (0, chai_1.expect)(provErr.message).to.include('sk-***REDACTED***');
            }
        });
        it('should report availability status correctly', async () => {
            const availableProvider = new src_1.MockLLMProvider(defaultConfig, { isAvailableResult: true });
            const unavailableProvider = new src_1.MockLLMProvider(defaultConfig, { isAvailableResult: false });
            (0, chai_1.expect)(await availableProvider.isAvailable()).to.be.true;
            (0, chai_1.expect)(await unavailableProvider.isAvailable()).to.be.false;
        });
    });
});
//# sourceMappingURL=LLMProvider.test.js.map