# DevFix AI Engine (`devfix-ai-engine`)

> **Subsystem:** AI / LLM Engineering Module  
> **Parent Project:** DevFix AI — AI-Powered VS Code Debugging Extension  
> **Developer:** Kunal Singhal  
> **Role:** AI / LLM Developer  
> **Branch:** `kunal-ai-engine`

---

## 🚀 Overview

`devfix-ai-engine` is the core AI engineering subsystem of DevFix AI. It powers intelligent bug detection, root-cause analysis, and automatic code-fix patch generation directly inside the VS Code editor.

This module is designed strictly as a headless, modular, and dependency-injected engine. It does not couple to VS Code UI components or competing filesystem watchers, providing clean contracts to peer modules (AST Analysis, Vector Search Indexing, and Validation Execution).

---

## 🛠️ Key Capabilities

- **Unified LLM Provider Abstraction:** Seamless switching between Cloud LLMs (OpenAI/Anthropic/Gemini compatible) and local privacy-first models (Ollama, LocalAI).
- **Three Agent Reasoning Modes:**
  - **Instant Mode:** Ultra-fast, single-call patch generation meeting the 8-second turnaround benchmark.
  - **Smart Mode:** Complexity-aware debugging incorporating semantic project context.
  - **Deep Mode:** Multi-step reasoning for cross-file regressions, stack traces, and failing integration tests.
- **Automated Validation & Retry Loop:** Self-correcting prompt loop that consumes compiler and test feedback to repair flawed patches.
- **Context Defense & Sanitization:** Filters sensitive credentials (`.env`, secrets, API keys) and fences untrusted user code against prompt injection.
- **Provider-Independent Web Search:** Augments debugging with external documentation references without executing untrusted web scripts.
- **Structured AI Task Notes:** Generates clean session summaries, diff breakdowns, and diagnostic logs.

---

## 📁 Repository Structure

```
devfix-ai-engine/
├── DEVELOPMENT_PLAN.md    # Phased roadmap, checklists, and progress tracking
├── package.json          # Node.js project manifest & scripts
├── tsconfig.json         # Strict TypeScript compiler configuration
├── docs/                 # Architectural specifications and integration guides
│   ├── ARCHITECTURE.md   # Component architecture & data flow diagrams
│   ├── API_CONTRACTS.md  # Interfaces for peer subsystems (AST, Vector DB, Validation)
│   ├── DEVELOPMENT.md    # Setup & coding standards
│   ├── TESTING.md        # Deterministic testing methodology
│   └── INTEGRATION.md    # Guide for VS Code Extension host integration
├── src/
│   ├── index.ts          # Public library exports
│   ├── core/
│   │   ├── types.ts      # Core domain models (Messages, Diagnostics, Patches)
│   │   ├── errors.ts     # Domain error hierarchy (Timeout, RateLimit, Auth)
│   │   └── contracts.ts  # Interfaces for AST, Vector DB, and Validation
│   └── providers/
│       ├── LLMProvider.ts# Unified provider interface and BaseLLMProvider
│       └── MockProvider.ts# Deterministic mock provider for tests
└── tests/
    └── providers/
        └── LLMProvider.test.ts # Core & Provider unit test suite
```

---

## 🧪 Testing & Verification

All unit tests run deterministically with zero external dependencies and zero paid API calls:

```bash
# Run unit tests
npm test

# Compile TypeScript
npm run build
```

---

## 📄 Documentation Links

- [Development Plan & Progress Log](file:///d:/Devfix/DEVELOPMENT_PLAN.md)
- [Architecture & Design](file:///d:/Devfix/docs/ARCHITECTURE.md)
- [API Contracts](file:///d:/Devfix/docs/API_CONTRACTS.md)
- [Integration Guide](file:///d:/Devfix/docs/INTEGRATION.md)
- [Developer Setup](file:///d:/Devfix/docs/DEVELOPMENT.md)
- [Testing Guidelines](file:///d:/Devfix/docs/TESTING.md)
