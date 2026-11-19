/**
 * DevFix AI Engine - Core Type Definitions
 *
 * Universal data models and interfaces shared across agents, providers,
 * context builders, validators, and external consumers.
 */

export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
  name?: string;
}

export type ProviderType = 'cloud' | 'ollama' | 'localai' | 'mock';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LLMConfig {
  /** The model identifier (e.g., 'gpt-4o', 'claude-3-5-sonnet-20241022', 'llama3') */
  model: string;
  /** Sampling temperature between 0.0 and 2.0. Defaults to 0.1 for deterministic code fixes */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Nucleus sampling probability */
  topP?: number;
  /** Stop sequences to truncate completion */
  stop?: string[];
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Injected API Key (provided by parent extension, never stored or hardcoded) */
  apiKey?: string;
  /** Base URL for endpoint (e.g., Ollama or custom Cloud proxy) */
  baseUrl?: string;
  /** Optional organization or project ID */
  organization?: string;
  /** Custom extra headers */
  headers?: Record<string, string>;
}

export interface LLMRequest {
  messages: ChatMessage[];
  config?: Partial<LLMConfig>;
  responseFormat?: 'text' | 'json_object';
}

export interface LLMResponse {
  /** Generated textual or JSON content */
  content: string;
  /** Model that served the response */
  model: string;
  /** Identifier of the provider */
  provider: ProviderType | string;
  /** Token usage statistics if reported by provider */
  usage?: TokenUsage;
  /** Reason why model finished generating */
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error' | string;
  /** Roundtrip execution duration in milliseconds */
  durationMs: number;
  /** Raw response payload for debugging/telemetry (omits credentials) */
  raw?: unknown;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'information' | 'hint';

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Diagnostic {
  message: string;
  range: Range;
  severity: DiagnosticSeverity;
  code?: string | number;
  source?: string;
  relatedInformation?: Array<{
    message: string;
    filePath: string;
    range: Range;
  }>;
}

export type ComplexityLevel = 'simple' | 'medium' | 'complex';

export type AgentMode = 'instant' | 'smart' | 'deep';

export interface CodeContext {
  filePath: string;
  fileContent: string;
  languageId?: string;
  selection?: Range;
  diagnostics: Diagnostic[];
  relatedFiles?: Array<{
    filePath: string;
    content: string;
    reason?: string;
  }>;
  retrievedChunks?: Array<{
    filePath: string;
    content: string;
    similarity: number;
  }>;
  stackTrace?: string;
  testFailure?: string;
}

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

export interface TaskNote {
  id: string;
  timestamp: string;
  userRequestSummary: string;
  problemDescription: string;
  aiExplanation: string;
  proposedChanges: string[];
  validationOutcome: 'PASSED' | 'FAILED' | 'SKIPPED';
  retryCount: number;
  model: string;
  provider: string;
  webSearchReferences?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  executionDurationMs: number;
}
