# DevFix AI Engine — API Contracts & Interfaces

This document outlines the contracts governing `devfix-ai-engine`, defining interactions between the AI subsystem and external modules (VS Code extension, AST analysis, Vector DB, and Validation engine).

---

## 1. LLM Provider Interface (`ILLMProvider`)

Defined in [src/providers/LLMProvider.ts](file:///d:/Devfix/src/providers/LLMProvider.ts).

```typescript
export interface ILLMProvider {
  readonly providerName: string;
  readonly providerType: ProviderType;

  /**
   * Executes a chat completion against the target model provider.
   */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Probes endpoint reachability, credentials, and model health.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Returns current active configuration (immutable copy).
   */
  getConfig(): Readonly<LLMConfig>;

  /**
   * Mutates provider configuration dynamically.
   */
  updateConfig(config: Partial<LLMConfig>): void;
}
```

### Request & Response Schemas

#### `LLMRequest`
```typescript
interface LLMRequest {
  messages: ChatMessage[];
  config?: Partial<LLMConfig>;
  responseFormat?: 'text' | 'json_object';
}
```

#### `LLMResponse`
```typescript
interface LLMResponse {
  content: string;
  model: string;
  provider: ProviderType | string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error' | string;
  durationMs: number;
  raw?: unknown;
}
```

---

## 2. Peer Subsystem Contracts (`src/core/contracts.ts`)

### 2.1 Validation Service Contract (`IValidationService`)
Owned by: QA / Action Execution module.  
Consumed by: DevFix `RetryManager`.

```typescript
export interface IValidationService {
  /**
   * Tests whether a proposed patch or updated content compiles and passes linter/test checks.
   */
  validatePatch(filePath: string, proposedContentOrDiff: string): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  executionTimeMs?: number;
}
```

### 2.2 AST Summary Contract (`IASTSummary`)
Owned by: AST Analysis module.  
Consumed by: DevFix `ContextBuilder`.

```typescript
export interface IASTSummary {
  filePath: string;
  enclosingSymbol?: {
    name: string;
    kind: 'function' | 'class' | 'method' | 'variable' | 'interface';
    range: Range;
  };
  referencedSymbols: string[];
  modifiedDependencies?: string[];
}
```

### 2.3 Vector Index Retrieval Contract (`IVectorIndexService`)
Owned by: Abhishek (Vector Indexing subsystem).  
Consumed by: DevFix `ContextBuilder` & `SmartAgent` / `DeepAgent`.

```typescript
export interface IVectorIndexService {
  queryContext(query: string, options?: { topK?: number; minSimilarity?: number }): Promise<RetrievedChunk[]>;
}

export interface RetrievedChunk {
  filePath: string;
  content: string;
  similarity: number;
  startLine?: number;
  endLine?: number;
}
```

### 2.4 Web Search Service Contract (`IWebSearchService`)
Owned by: Tools integration.  
Consumed by: DevFix `WebSearch` tool.

```typescript
export interface IWebSearchService {
  search(query: string, options?: { limit?: number }): Promise<IWebSearchResult[]>;
}

export interface IWebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}
```

---

## 3. Agent Mode Output Contract (`PatchResult`)

All agent modes (`InstantAgent`, `SmartAgent`, `DeepAgent`) normalize their outputs into `PatchResult`:

```typescript
export interface PatchResult {
  success: boolean;
  explanation: string;
  rootCause?: string;
  diff: string;
  filesChanged: string[];
  isValidated: boolean;
  validationErrors?: string[];
  retryCount: number;
  model: string;
  provider: string;
  durationMs: number;
}
```
