# DevFix AI Engine — Architecture Documentation

## 1. Overview

`devfix-ai-engine` is the dedicated AI/LLM engineering subsystem for the DevFix AI VS Code debugging extension. It is architected as an autonomous, modular, and dependency-injected TypeScript engine that converts IDE diagnostics, compiler errors, source code context, and stack traces into validated, accurate, and safe code patches.

## 2. System Design Principles

1. **Strict Separation of Concerns:**
   - The engine does NOT directly manipulate the VS Code workspace, file system, or language server protocol (LSP).
   - AST generation, vector database indexing, terminal action execution, and UI presentation are owned by peer modules. DevFix AI Engine consumes their outputs via typed contracts.
2. **Provider Agnosticism:**
   - Agent logic (Instant, Smart, Deep) is completely decoupled from model providers. Agents communicate through the `ILLMProvider` interface.
   - Seamless runtime switching between Cloud providers (OpenAI / Anthropic / Gemini compatible endpoints) and Local providers (Ollama, LocalAI).
3. **Defense-in-Depth Context Sanitization:**
   - Untrusted inputs (source code, repository comments, web search results, user notes) are sanitized and framed with boundary delimiters to prevent prompt injection.
   - Secrets, API keys, credentials, and sensitive files (`.env`, `*.pem`, `id_rsa`) are stripped before prompts are composed.
4. **Validation-Driven Self-Correction:**
   - AI outputs are never assumed to be correct.
   - Proposed patches must be parsed into unified diffs and passed to external validation (linter/compiler/test runner).
   - Validation failures trigger targeted self-correction loops with bounded retry attempts.
5. **Privacy and Local Isolation:**
   - When configured in Local Mode, the engine enforces strict network isolation—no source code or diagnostics ever leave the user's machine.

## 3. Subsystem Components

### 3.1 Core (`src/core/`)

- `types.ts`: Universal interfaces representing diagnostics, chat messages, model configs, context payloads, patches, and task notes.
- `errors.ts`: Hierarchical domain error hierarchy (`DevFixError`, `ProviderError`, `RateLimitError`, `TimeoutError`, `ValidationError`, `PromptInjectionError`).
- `contracts.ts`: External module interface contracts (e.g., `IValidationService`, `IASTProvider`, `IVectorIndexService`).

### 3.2 Provider Layer (`src/providers/`)

- `LLMProvider.ts`: Abstract base class providing common parameter normalization, timeout management, telemetry hooks, and response parsing.
- `CloudProvider.ts`: Standardized OpenAI/Anthropic/Gemini compatible cloud LLM interface.
- `OllamaProvider.ts`: Local Ollama chat interface (`/api/chat`).
- `LocalAIProvider.ts`: LocalAI local endpoint adapter.

### 3.3 Agent Modes (`src/agents/`)

- **Instant Mode (`InstantAgent`):**
  - Ultra-fast, single-call patch generation.
  - Consumes active file source code and targeted diagnostic markers.
  - Formats output as structured JSON containing explanation and unified diff.
  - Optimized for sub-8-second turnaround.
- **Smart Mode (`SmartAgent`):**
  - Complexity-aware debugging.
  - Automatically assesses task difficulty via `ComplexityDetector`.
  - Ingests semantic chunks and related file context from the vector store.
  - Produces detailed diagnostic reasoning and multi-file patches.
- **Deep Mode (`DeepAgent`):**
  - Multi-step reasoning for intricate architectural or runtime bugs.
  - Handles cross-module stack traces, failing integration tests, and AST summaries.
  - Employs self-questioning and token-budgeted reasoning passes.

### 3.4 Context & Prompt Engineering (`src/context/`, `src/prompts/`)

- `ContextBuilder`: Assembles multi-source context (AST summaries, diagnostics, retrieved chunks, stack traces) into normalized structures.
- `ContextSanitizer`: Redacts sensitive tokens and wraps code inside defensive XML/Markdown boundaries.
- `PromptTemplates`: Declarative templates for bug diagnosis, code fix generation, root-cause analysis, and self-correction.

### 3.5 Validation & Self-Correction (`src/validation/`, `src/response/`)

- `ResponseParser`: Validates JSON schema of model responses, sanitizes markdown code blocks, and validates unified diff structure.
- `RetryManager`: Orchestrates the feedback loop:
  1. Patch generated -> 2. Sent to `IValidationService` -> 3. Passes? Return validated fix. -> 4. Fails? Construct self-correction prompt with compiler/linter error feedback -> 5. Retry until threshold or success.

### 3.6 Embeddings & Root-Cause (`src/embeddings/`)

- `EmbeddingProvider`: Text chunk embedding generation conforming to the vector indexing contract for Abhishek's module.

### 3.7 Tools & Task Notes (`src/tools/`, `src/notes/`)

- `WebSearch`: Safely fetches relevant documentation or error references, treating all fetched text as untrusted data.
- `TaskNotes`: Compiles structured records of each debugging session (root cause, fix rationale, diff preview, validation status, duration).

## 4. Data Flow

```
[Diagnostics + Source Code]
            │
            ▼
   ContextSanitizer (Redact secrets & sanitize)
            │
            ▼
   ComplexityDetector (Simple -> InstantAgent | Medium -> SmartAgent | Complex -> DeepAgent)
            │
            ▼
   Prompt Builder (System Guardrails + Structured Context)
            │
            ▼
   LLMProvider (Cloud or Local Ollama/LocalAI)
            │
            ▼
   ResponseParser (JSON & Unified Diff Validation)
            │
            ▼
      RetryManager ◄────────┐
            │               │ (Failure: Self-correction feedback)
            ▼               │
   IValidationService ──────┘
            │
     (Pass / Max Retries)
            │
            ▼
    TaskNotesGenerator ──► [Final Validated Result]
```
