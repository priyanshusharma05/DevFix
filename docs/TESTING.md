# DevFix AI Engine — Testing Strategy & Guidelines

## 1. Testing Philosophy

The test suite is built on **Mocha** and **Chai**. All tests are 100% deterministic and do not require paid external APIs, active internet connections, or cloud credentials.

## 2. Running Tests

Execute the full test suite:

```bash
npm test
```

## 3. Test Structure

Tests are organized into directories mirroring `src/`:

```
tests/
├── providers/        # LLM provider contract, timeout, error normalization & retry tests
├── agents/           # InstantAgent, SmartAgent, and DeepAgent execution tests
├── prompts/          # Prompt templates, prompt-injection defense & sanitization tests
├── response/         # ResponseParser, JSON validator, and unified diff tests
├── validation/       # RetryManager, self-correction feedback loop tests
└── integration/      # End-to-end multi-step flows
```

## 4. Writing Unit Tests

When adding new components:
- Use `MockLLMProvider` to enqueue predictable responses.
- Assert both the happy path and edge cases (timeouts, 401, 429, malformed JSON).
- Ensure error messages sanitize any accidental API key formats.
