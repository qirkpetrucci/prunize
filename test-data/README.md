# Golden Dataset for Prunize

This directory contains real-world test data for comprehensive testing and regression prevention.

## Structure

```
test-data/
├── openapi/              # OpenAPI specification (1 large spec ~100KB)
├── agent-traces/         # LLM agent execution traces
├── rag-metadata/         # RAG retrieval results
├── file-trees/           # Large codebase directory structures
└── documents/            # PRDs and specs with embedded code snippets
```

## Datasets

### 1. OpenAPI Specification
- **File**: `openapi/large-api-spec.json`
- **Size**: ~100KB
- **Purpose**: Test optimization of large API specifications
- **Expected Format**: TOON (nested structure)

### 2. Agent Traces
- **File**: `agent-traces/function-calls.json`
- **Purpose**: Test optimization of agent tool execution logs
- **Expected Format**: TOON (structured tool results)

### 3. RAG Metadata
- **File**: `rag-metadata/mixed-retrieval.json`
- **Purpose**: Test optimization of vector DB + SQL combined results
- **Expected Format**: CSV (uniform array structure)

### 4. File Trees
- **File**: `file-trees/large-codebase.json`
- **Purpose**: Test optimization of large repository structures
- **Expected Format**: TOON (nested tree structure)

### 5. Documents
- **File**: `documents/large-prd-with-snippets.md`
- **Purpose**: Test snippet optimization in mixed content
- **Expected Format**: Strip with optimized snippets

## Usage

```typescript
import { loadTestData } from './loader';

// Load input data
const data = loadTestData('openapi/large-api-spec.json');

// Load expected output
const expected = loadTestData('openapi/expected/large-api-spec.toon');
```

## Generating Expected Outputs

To regenerate expected outputs after code changes:

```bash
npm run generate-expected
```

This will run prunize on all input files and save expected outputs.

## Adding New Datasets

1. Add input file to appropriate category folder
2. Run `npm run generate-expected`
3. Review generated expected output
4. Commit both input and expected files
