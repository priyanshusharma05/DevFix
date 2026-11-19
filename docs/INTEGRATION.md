# DevFix AI Engine — VS Code Subsystem Integration Guide

This guide details how the parent VS Code extension integrates and invokes `devfix-ai-engine`.

## 1. Extension Host Boundary

The parent VS Code extension is responsible for:
- Reading user preferences (active model, temperature, provider choice).
- Retrieving API keys securely via VS Code `SecretStorage` (`context.secrets.get('devfix.apiKey')`).
- Extracting active editor diagnostics (`vscode.languages.getDiagnostics`).
- Workspace Trust verification (`vscode.workspace.isTrusted`).
- Applying unified diffs to the workspace via `vscode.WorkspaceEdit`.

## 2. Instantiating the Engine

```typescript
import { InstantAgent, CloudProvider, ContextBuilder } from 'devfix-ai-engine';

// 1. Inject credentials from VS Code SecretStorage
const apiKey = await context.secrets.get('devfix.apiKey');

// 2. Initialize provider
const provider = new CloudProvider({
  model: 'gpt-4o',
  apiKey,
  temperature: 0.1,
  timeoutMs: 8000, // 8-second target
});

// 3. Initialize Agent
const agent = new InstantAgent(provider);

// 4. Pass IDE diagnostics and source code
const patchResult = await agent.generateFix({
  filePath: document.uri.fsPath,
  fileContent: document.getText(),
  diagnostics: editorDiagnostics,
});

if (patchResult.success && patchResult.isValidated) {
  // Present diff preview to user in VS Code UI
}
```

## 3. Communication with Teammate Subsystems

- **AST Team Member:** Implement `IASTSummary` and pass AST context to `ContextBuilder`.
- **Abhishek (Vector Indexing):** Implement `IVectorIndexService` and supply semantic code chunks.
- **QA / Validation Member:** Implement `IValidationService` to execute linters and compiler checks on proposed patches before they are marked as validated.
