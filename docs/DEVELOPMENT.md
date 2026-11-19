# DevFix AI Engine — Developer Guide

## 1. Prerequisites

- **Node.js**: v20 or v22 LTS
- **npm**: v10+
- **TypeScript**: v5+

## 2. Setup

Clone the repository and install development dependencies:

```bash
git clone https://github.com/priyanshusharma05/DevFix.git
git checkout kunal-ai-engine
npm install
```

## 3. Build & Watch

Compile TypeScript sources to JavaScript and declaration files in `dist/`:

```bash
npm run build
```

Watch mode for active development:

```bash
npm run watch
```

## 4. Coding Standards

1. **TypeScript Strict Mode**: No `any` types unless strictly representing unparsed external JSON.
2. **Error Handling**: Throw strongly typed subclasses of `DevFixError` (`ProviderError`, `AuthenticationError`, `RateLimitError`, `TimeoutError`, `ValidationError`).
3. **No Hardcoded Secrets**: API keys, credentials, and tokens must never be embedded in source code, committed to Git, or printed in logs.
4. **Privacy**: Under Local Mode (`OllamaProvider`, `LocalAIProvider`), no network requests outside localhost are permitted.
5. **No Direct Execution**: The AI engine never executes shell scripts or installs packages. It only proposes unified diffs for verification by the parent extension host.
