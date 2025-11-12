# prunize

**Intelligent prompt optimizer that reduces LLM token usage by 30-83%.**

Auto-detects input types (JSON, YAML, XML, HTML, text) and selects the optimal output format to minimize tokens.

## Why Prunize?

- 💰 **Save costs** - Reduce API bills by 30-83%
- 📊 **Fit more context** - Include more data within token limits
- 🚀 **Speed up** - Fewer tokens = faster processing
- 🤖 **Auto-decision** - Intelligently optimizes snippets (~0.16ms overhead)

## Installation

```bash
npm install prunize
```

## Quick Start

```typescript
import { prunize } from 'prunize';

const data = {
  users: [
    { id: 1, name: "Alice", role: "Admin" },
    { id: 2, name: "Bob", role: "User" }
  ]
};

const result = prunize(data);

console.log(result.output);
// users|id,name,role
// 1,Alice,Admin
// 2,Bob,User

console.log(result.tokens.savings); // "45.2%"
```

## Supported Input Formats

Prunize automatically detects and optimizes various input formats:

| Input Type | Token Efficiency | Cost Savings | Best Output Format |
|------------|------------------|--------------|-------------------|
| **JSON** (uniform arrays) | 60-83% | $1.50-$2.08 per 1M tokens | CSV |
| **JSON** (nested objects) | 40-60% | $1.00-$1.50 per 1M tokens | TOON |
| **JSON** (any structure) | 15-30% | $0.38-$0.75 per 1M tokens | Compact |
| **YAML** | 40-65% | $1.00-$1.63 per 1M tokens | CSV/TOON |
| **XML** | 35-55% | $0.88-$1.38 per 1M tokens | TOON/Compact |
| **HTML** | 30-50% | $0.75-$1.25 per 1M tokens | Strip/Compact |
| **Plain Text** | 5-15% | $0.13-$0.38 per 1M tokens | Strip |

*Cost savings based on GPT-4o pricing ($2.50/1M input tokens)*

## Advanced Usage

### Default Behavior (Auto-Decision Mode)

By default, prunize uses **intelligent auto-decision** to deliver the best optimization:

```typescript
const result = prunize(data);
// Equivalent to:
// prunize(data, {
//   format: undefined,           // Auto-detect best format
//   optimizeSnippets: 'auto',    // Smart auto-decision (DEFAULT)
//   verbose: false               // Silent mode
// })
```

**Auto-Decision Benefits:**
- ✅ **Best optimization** - Automatically enables snippet optimization when beneficial
- ✅ **Smart** - Analyzes content to decide (>15% snippets, ≤20 blocks, optimizable types)
- ✅ **Fast** - Only ~0.16ms overhead (7.5% of execution time)
- ✅ **Safe** - Skips optimization when it won't help

**When Auto-Decision Enables Optimization:**
- Documents with embedded code blocks (JSON, YAML, XML, HTML)
- Snippets comprise >15% of total content
- Reasonable snippet count (≤20 blocks)
- Result: **10-40% additional token savings**

**To Disable Auto-Decision:**

If you find the ~0.16ms overhead too much, disable it:

```typescript
// Disable snippet optimization completely
const result = prunize(data, { optimizeSnippets: false });
// Faster execution, but no snippet optimization
```

### What is Snippet Optimization?

Snippet optimization detects and optimizes **embedded code blocks** within text documents (PRDs, specs, documentation, Jira tickets). Instead of treating the entire document as plain text, prunize identifies code snippets and optimizes them individually.

**Example: Engineering Spec with Mixed Content**

```typescript
const engineeringSpec = `
# User Authentication Service

## Overview
This service handles user authentication using JWT tokens and OAuth2.0 integration.

## Configuration

The service requires this configuration in config.yaml:

\`\`\`yaml
auth:
  jwt:
    secret: your-secret-key
    expiration: 3600
  oauth:
    providers:
      - name: google
        client_id: google-client-id
        client_secret: google-secret
      - name: github
        client_id: github-client-id
        client_secret: github-secret
\`\`\`

## API Response Format

Successful authentication returns this JSON structure:

\`\`\`json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "roles": ["admin", "developer"]
    },
    "token": {
      "access_token": "eyJhbGc...",
      "refresh_token": "eyJhbGc...",
      "expires_in": 3600
    }
  }
}
\`\`\`

## Implementation Notes
- Use bcrypt for password hashing (cost factor: 12)
- Implement rate limiting (max 5 requests per minute)
- Store refresh tokens in Redis with 7-day expiration
`;

// Without snippet optimization (optimizeSnippets: false)
const basic = prunize(engineeringSpec, { optimizeSnippets: false });
console.log(basic.tokens.savings); // "8.2%" - only text whitespace reduction

// With auto-decision (default - recommended)
const optimized = prunize(engineeringSpec);
console.log(optimized.tokens.savings); // "28.5%" - snippets optimized!
console.log(optimized.autoDecision.enabled); // true
console.log(optimized.autoDecision.reason); 
// "2 optimizable snippets (35.2% of content)"
```

**Result Comparison:**

| Mode | Tokens Before | Tokens After | Savings | Speed |
|------|---------------|--------------|---------|-------|
| Basic (no snippets) | 485 | 445 | 8.2% | 0.21ms |
| **Auto-decision** | 485 | 347 | **28.5%** | 0.37ms |

**Additional savings: 20.3%** with only ~0.16ms overhead!

### Manual Snippet Optimization

Force snippet optimization on or off:

### Manual Snippet Optimization

Force snippet optimization on or off:

```typescript
// Force enable (always optimize snippets)
const result = prunize(apiDoc, { optimizeSnippets: true });

// Force disable (never optimize snippets)  
const result = prunize(apiDoc, { optimizeSnippets: false });

// Auto-decision (default - recommended)
const result = prunize(apiDoc, { optimizeSnippets: 'auto' });
```

**Example with Auto-Decision:**

```typescript
const apiDoc = `
# Payment API
\`\`\`json
{"transaction": {"amount": "1000.00"}}
\`\`\`
`;

// Auto-decision analyzes and decides (this is the default)
const result = prunize(apiDoc);

console.log(result.autoDecision.enabled);        // true
console.log(result.autoDecision.reason);         // "1 optimizable snippets (24.8%)"
console.log(result.tokens.savings);              // "30.7%"
```

### Force Format

```typescript
prunize(data, { format: 'csv' });
prunize(data, { format: 'toon' });
prunize(data, { format: 'compact' });
prunize(data, { format: 'strip' });
```

### Verbose Logging

```typescript
const result = prunize(data, { verbose: true });
// [prunize] Detected format: CSV
// [prunize] Confidence: 95.0%
// [prunize] Tokens: 245 → 156 (36.3% savings)
```

## Performance

| Input Type | Before | After | Savings | Format |
|------------|--------|-------|---------|--------|
| Simple JSON | 38 | 31 | 18.4% | TOON |
| Nested JSON | 150 | 91 | 39.3% | TOON |
| Large Array | 2450 | 960 | 60.8% | CSV |
| API Response | 161 | 26 | 83.9% | TOON |
| PRD (auto) | 1965 | 1739 | 11.5% | Strip + Auto |

**Auto-decision overhead:** ~0.16ms (7.5% of execution time)

## Cost Savings

Based on **GPT-4o pricing** ($2.50/1M input tokens):

| Scale | Requests/Month | Before | After | Savings |
|-------|----------------|--------|-------|---------|
| Small | 10,000 (500 tokens) | $12.50 | $8.13 | $4.37/mo |
| Medium | 10,000 (1,200 tokens) | $30 | $18 | $12/mo |
| Enterprise | 100,000 (2,000 tokens) | $500 | $275 | $225/mo |

## API Reference

```typescript
prunize(input: any, options?: {
  format?: 'csv' | 'toon' | 'compact' | 'strip',
  optimizeSnippets?: boolean | 'auto',
  verbose?: boolean
}): {
  format: string,
  output: string,
  tokens: { before: number, after: number, savings: string },
  confidence: number,
  autoDecision?: {
    enabled: boolean,
    reason: string,
    decisionTimeMs: number,
    stats?: { totalSnippets, optimizableSnippets, snippetRatio }
  }
}
```

## How It Works

1. **Auto-Decision** - Analyzes content, decides if snippet optimization needed
2. **Detection** - Identifies input type (JSON/YAML/XML/HTML/text)
3. **Analysis** - Examines structure patterns and complexity
4. **Format Selection** - Picks optimal format (CSV/TOON/Compact/Strip)
5. **Optimization** - Applies transformation while preserving structure
6. **Verification** - Calculates token savings

## Use Cases

- **API Optimization** - Compress responses before LLM processing
- **Documentation** - Optimize docs with code examples
- **Database Results** - Minimize query results
- **Prompt Engineering** - Fit more context in token limits
- **Fine-tuning** - Reduce training dataset size

## License

MIT © 2025 qirkpetrucci