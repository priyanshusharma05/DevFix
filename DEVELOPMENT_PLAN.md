# DevFix AI Engine — Development Plan & Roadmap

**Project:** DevFix AI — AI/LLM Engineering Subsystem (`devfix-ai-engine`)  
**Developer:** Kunal Singhal (AI / LLM Developer)  
**Parent Project:** DevFix AI (AI-powered VS Code debugging extension)  
**Target Environment:** Node.js (v22+) & TypeScript (v5+)  
**Test Framework:** Mocha & Chai  
**Status:** In Progress — Phase 1 (Foundation)  

---

## 1. Executive Summary & Repository Inspection

### 1.1 Existing State
- **Workspace:** `d:\Devfix`
- **Git Branch:** `kunal-ai-engine`
- **Initial State:** Repository initialized with only an empty `README.md` and `.git` repository tracking `origin/kunal-ai-engine`.
- **Pre-existing Code / Modules:** None.
- **Pre-existing TypeScript Setup:** None.
- **Dependencies Installed:** None initially.

### 1.2 Gap Analysis (Specification vs. Existing)
| Requirement Module | Current Status | Planned Phase |
| :--- | :--- | :--- |
| **Core Architecture & Interfaces** | Missing | Phase 1 (In Progress) |
| **LLM Provider Abstraction** | Missing | Phase 1 (In Progress) |
| **Cloud LLM Providers (OpenAI/Anthropic/Gemini compatible)** | Missing | Phase 2 |
| **Prompt Engineering & Templates** | Missing | Phase 3 |
| **Context Sanitizer & Prompt Defense** | Missing | Phase 3 |
| **Instant Agent (Single-call fix)** | Missing | Phase 4 |
| **Validation & Retry Manager** | Missing | Phase 5 |
| **Self-Correction Logic** | Missing | Phase 5 |
| **Smart & Deep Agents (Multi-step reasoning)** | Missing | Phase 6 |
| **Complexity Detector** | Missing | Phase 6 |
| **Embedding Provider Abstraction** | Missing | Phase 7 |
| **Root-Cause Analysis Engine** | Missing | Phase 7 |
| **Web Search Integration** | Missing | Phase 8 |
| **AI-Generated Task Notes** | Missing | Phase 8 |
| **Local LLM Providers (Ollama / LocalAI)** | Missing | Phase 9 |
| **Local-Mode Privacy Enforcement** | Missing | Phase 9 |
| **End-to-End Integration & Benchmarking** | Missing | Phase 10 |

---

## 2. Proposed Architecture

The `devfix-ai-engine` operates as a decoupled, headless core engine consumed by the parent DevFix VS Code extension. It communicates via strict TypeScript interfaces and does not couple to VS Code UI, file system watchers, or AST parsers directly.

```
                      +---------------------------------------+
                      |       VS Code Extension Host          |
                      |  (Orchestrator / UI / Workspace Trust)|
                      +-------------------+-------------------+
                                          |
                        [Context & Diagnostics Injected]
                                          v
+-----------------------------------------------------------------------------------+
|                         DEVFIX AI ENGINE SUBSYSTEM                                |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                             Agent Layer                                     |  |
|  |  +--------------------+  +--------------------+  +--------------------+     |  |
|  |  |    InstantAgent    |  |     SmartAgent     |  |     DeepAgent      |     |  |
|  |  |  (1-call fast fix) |  | (Complexity-aware) |  | (Multi-step reason)|     |  |
|  |  +---------+----------+  +---------+----------+  +---------+----------+     |  |
|  |            ^                       ^                       ^                |  |
|  |            +-----------------------+-----------------------+                |  |
|  |                                    |                                        |  |
|  |                         [Complexity Detection]                              |  |
|  +------------------------------------+----------------------------------------+  |
|                                       |                                           |
|  +------------------------------------+----------------------------------------+  |
|  |                        Context & Prompt Pipeline                            |  |
|  |  - ContextSanitizer (Secret stripping, untrusted data wrapping, token limits) |  |
|  |  - PromptTemplates (System instructions, code-fix, root-cause, self-correct)|  |
|  +------------------------------------+----------------------------------------+  |
|                                       |                                           |
|  +------------------------------------+----------------------------------------+  |
|  |                        Validation & Retry Loop                              |  |
|  |  - RetryManager: Patch -> Validate -> [Fail? Self-Correction Prompt] -> Retry|  |
|  |  - ResponseParser: Strict JSON parse, unified diff extraction, error handling|  |
|  +------------------------------------+----------------------------------------+  |
|                                       |                                           |
|  +------------------------------------+----------------------------------------+  |
|  |                         LLM Provider Layer                                  |  |
|  |  +-----------------------------------------------------------------------+  |  |
|  |  |                     ILLMProvider (Unified Contract)                   |  |  |
|  |  +-------------------+--------------------+--------------------+---------+  |  |
|  |                      |                    |                    |            |  |
|  |            +---------v--------+   +-------v-------+   +--------v-------+    |  |
|  |            | CloudLLMProvider |   | OllamaProvider|   | LocalAIProvider|    |  |
|  |            +------------------+   +---------------+   +----------------+    |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +-------------------------+  +--------------------------+  +------------------+  |
|  |   Embedding Provider    |  |    WebSearch Provider    |  |    Task Notes    |  |
|  | (IEmbeddingProvider for |  |   (IWebSearchService for |  | (Structured run |  |
|  |  Abhishek's vector DB)  |  |    doc/error search)     |  |    summaries)    |  |
|  +-------------------------+  +--------------------------+  +------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Directory Layout

```
devfix-ai-engine/
├── package.json
├── tsconfig.json
├── DEVELOPMENT_PLAN.md
├── README.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACTS.md
│   ├── DEVELOPMENT.md
│   ├── TESTING.md
│   └── INTEGRATION.md
├── src/
│   ├── index.ts
│   ├── core/
│   │   ├── types.ts          # Core request/response/diagnostic types
│   │   ├── errors.ts         # Hierarchical domain error classes
│   │   ├── config.ts         # Configuration structures & validation
│   │   └── contracts.ts      # Shared interfaces (Validation, AST, Vector DB)
│   ├── providers/
│   │   ├── LLMProvider.ts    # Base LLMProvider abstraction
│   │   ├── CloudProvider.ts  # Cloud LLM implementation (OpenAI-compatible)
│   │   ├── OllamaProvider.ts # Local Ollama provider
│   │   └── LocalAIProvider.ts# LocalAI provider
│   ├── agents/
│   │   ├── BaseAgent.ts      # Shared agent lifecycle & telemetry
│   │   ├── InstantAgent.ts   # Fast 1-call fix generator
│   │   ├── SmartAgent.ts     # Complexity-aware context-rich agent
│   │   ├── DeepAgent.ts      # Multi-step cross-file reasoning agent
│   │   └── ComplexityDetector.ts # Simple / Medium / Complex analyzer
│   ├── prompts/
│   │   ├── templates.ts      # Reusable prompt templates
│   │   ├── systemPrompts.ts  # Guardrailed system instructions
│   │   └── selfCorrection.ts # Validation feedback prompt builder
│   ├── context/
│   │   ├── ContextBuilder.ts # Context aggregation from external modules
│   │   └── ContextSanitizer.ts # Secret filtering & prompt defense
│   ├── embeddings/
│   │   └── EmbeddingProvider.ts # Text chunk vectorizer interface & impl
│   ├── response/
│   │   └── ResponseParser.ts # Strict JSON parser & diff validator
│   ├── validation/
│   │   └── RetryManager.ts   # Automated self-correction feedback loop
│   ├── tools/
│   │   └── WebSearch.ts      # Provider-independent doc & error search
│   └── notes/
│       └── TaskNotes.ts      # Structured run summary & metadata generator
└── tests/
    ├── providers/
    │   ├── LLMProvider.test.ts
    │   ├── CloudProvider.test.ts
    │   └── LocalProviders.test.ts
    ├── agents/
    │   ├── InstantAgent.test.ts
    │   ├── SmartAgent.test.ts
    │   └── DeepAgent.test.ts
    ├── prompts/
    │   └── Prompts.test.ts
    ├── response/
    │   └── ResponseParser.test.ts
    ├── validation/
    │   └── RetryManager.test.ts
    └── integration/
        └── EndToEndFlow.test.ts
```

---

## 4. Phased Task Checklist

- [x] **Phase 1: Foundation (Current Phase)**
  - [x] Inspect existing repository and initialize workspace structure.
  - [x] Set up TypeScript (`tsconfig.json`) and package manifest (`package.json`).
  - [x] Configure Mocha and Chai testing framework.
  - [x] Document architecture (`docs/ARCHITECTURE.md`) and development roadmap (`DEVELOPMENT_PLAN.md`).
  - [ ] Define core domain types (`src/core/types.ts`) and domain errors (`src/core/errors.ts`).
  - [ ] Define `LLMProvider` abstract base class and interfaces (`src/providers/LLMProvider.ts`).
  - [ ] Write unit tests for `LLMProvider` contracts and core types (`tests/providers/LLMProvider.test.ts`).
  - [ ] Verify test suite passes without external dependencies or network access.

- [ ] **Phase 2: Cloud LLM Provider**
  - [ ] Implement `CloudProvider` with OpenAI-compatible API protocol.
  - [ ] Support configurable timeout, model selection, temperature, and token limits.
  - [ ] Implement exponential backoff retry and rate limit detection.
  - [ ] Add normalized error handling (`RateLimitError`, `TimeoutError`, `AuthenticationError`).
  - [ ] Unit test with comprehensive mocked HTTP responses.

- [ ] **Phase 3: Prompt Engineering & Security Sanitization**
  - [ ] Implement system prompts with anti-prompt-injection fences.
  - [ ] Implement code fix, root-cause, and diagnosis prompt builders.
  - [ ] Implement `ContextSanitizer` (redact API keys, tokens, `.env` file exclusions).
  - [ ] Implement structured JSON output prompt schemas.
  - [ ] Unit test prompt formatting, escaping, and sanitization boundaries.

- [ ] **Phase 4: Instant Agent**
  - [ ] Implement `InstantAgent` with 1-call optimization.
  - [ ] Process source code, line diagnostics, and user request.
  - [ ] Integrate response parsing for unified diff and explanation.
  - [ ] Target sub-8-second execution benchmark.
  - [ ] Unit test InstantAgent with mocked provider responses.

- [ ] **Phase 5: Validation & Retry Manager**
  - [ ] Implement `RetryManager` adhering to external `IValidationService` interface.
  - [ ] Implement self-correction prompt generator feeding back compiler/linter/test errors.
  - [ ] Enforce configurable maximum retry bounds (default: 3).
  - [ ] Unit test successful validation on attempt 1, self-correction on attempt 2, and graceful retry exhaustion.

- [ ] **Phase 6: Complexity Detection & Smart / Deep Agents**
  - [ ] Implement `ComplexityDetector` (heuristics on diagnostics count, cross-file impact, stack depth).
  - [ ] Implement `SmartAgent` incorporating project context chunks.
  - [ ] Implement `DeepAgent` with multi-step reasoning prompts and token budgets.
  - [ ] Test mode selection and multi-step reasoning workflows.

- [ ] **Phase 7: Embeddings & Root-Cause Analysis**
  - [ ] Implement `IEmbeddingProvider` matching Abhishek's vector-store contract.
  - [ ] Support vector dimension reporting and batch embedding generation.
  - [ ] Implement root-cause diagnosis prompt accepting stack traces and failing test outputs.
  - [ ] Test embedding generation and root-cause analysis output formatting.

- [ ] **Phase 8: Web Search Integration & Task Notes**
  - [ ] Implement provider-agnostic `IWebSearchService` (with mock / DuckDuckGo / SearXNG adapter).
  - [ ] Wrap web search results as strictly untrusted context data.
  - [ ] Implement `TaskNotesGenerator` producing structured Markdown/JSON task summaries.
  - [ ] Test web search failure handling and task notes sanitization.

- [ ] **Phase 9: Local LLM Providers & Privacy Guard**
  - [ ] Implement `OllamaProvider` (HTTP API: `http://localhost:11434/api/chat`).
  - [ ] Implement `LocalAIProvider` (local OpenAI-compatible endpoint).
  - [ ] Implement strict `LocalPrivacyGuard`: zero outbound external network traffic in local mode.
  - [ ] Test offline behavior, provider switching, and connection refusal error handling.

- [ ] **Phase 10: Final Integration & Documentation**
  - [ ] Integrate all components into public module exports (`src/index.ts`).
  - [ ] Write integration test covering Instant, Smart, and Deep end-to-end flows.
  - [ ] Finalize `API_CONTRACTS.md`, `INTEGRATION.md`, and mentor demonstration guide.

---

## 5. Dependencies Strategy

To ensure zero bloat, maximum reliability, and no paid infrastructure:
- **Core Dependencies:** Zero external runtime dependencies where native Node.js APIs suffice (e.g. native `fetch` available in Node 18+, native `crypto`).
- **Development & Testing:**
  - `typescript`: Type checking and compilation.
  - `mocha`: Test runner.
  - `chai`: Assertion library.
  - `ts-node`: Direct execution of TypeScript test files.
  - `@types/*`: Accurate type definitions for Node, Mocha, and Chai.

---

## 6. Testing Strategy

1. **Deterministic Mocking:** All provider tests must mock HTTP requests/responses. No paid API keys or active internet connections are required to run the test suite.
2. **Strict Typings:** Compile-time verification using `tsc --noEmit`.
3. **Unit Tests per Component:**
   - Provider initialization & error transformation.
   - Prompt sanitization and prompt injection defenses.
   - Unified diff parser & malformed JSON rejection.
   - Retry logic and boundary conditions.
   - Privacy isolation in local mode.
4. **Target Metrics:** 100% passing tests for every committed module.
