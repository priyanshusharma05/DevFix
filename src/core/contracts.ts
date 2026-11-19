/**
 * DevFix AI Engine - Peer Subsystem Integration Contracts
 *
 * Explicit interface boundaries decoupling this AI/LLM module from peer subsystems:
 * - Validation engine (owned by QA / Execution member)
 * - AST parser & symbol analyzer (owned by AST team member)
 * - Vector store & embedding index (owned by Abhishek)
 * - Web search provider (owned by Tools integration)
 */

import { Diagnostic, Range } from './types';

/**
 * Contract for the external validation service.
 * Takes proposed code or unified diff and runs compiler/linter/test verification.
 */
export interface IValidationService {
  validatePatch(filePath: string, proposedContentOrDiff: string): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  executionTimeMs?: number;
}

/**
 * Contract for AST analysis supplied by peer module.
 */
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

/**
 * Contract for the Vector Indexing / Retrieval system (Abhishek's module).
 */
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

/**
 * Contract for Web Search capability.
 */
export interface IWebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

export interface IWebSearchService {
  search(query: string, options?: { limit?: number }): Promise<IWebSearchResult[]>;
}
