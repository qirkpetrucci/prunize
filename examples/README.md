# Prunize Examples

Real-world usage examples using the published npm package.

These examples demonstrate prunize's capabilities with actual use cases and large data sets. All examples use the **published npm package** (`prunize`), not the local source code, making them perfect references for real-world integration.

## Setup

```bash
# Install dependencies
cd examples
npm install
```

## Run Examples

```bash
# Run all examples
npm run examples

# Or run specific examples
npm run example:large-text
npm run compare:toon
```

## What's Inside

### `large-text.ts`
Comprehensive test demonstrating token efficiency with:
- 📄 **Large PRD** - Product Requirements Document (~6KB)
- ⚙️ **JSON Config** - Complex nested configuration
- 📊 **Transaction Data** - Array of 100+ records

**Expected Results:**
- Overall efficiency: **46.76% token reduction**
- Cost savings: **$7,707.50 per 1M requests** (GPT-4o pricing)
- Performance: **~0.31ms average execution time**

### `compare-toon.ts`
Comprehensive comparison between **prunize** and **@toon-format/toon** for JSON to TOON conversion:
- 📊 **Array of Objects** - Table format comparison
- 🔗 **Nested Objects** - Deep nesting handling
- 🎯 **Mixed Data Types** - Complex data structures
- 📈 **Large Datasets** - API response simulation
- 🔤 **Special Characters** - String escaping comparison

**Key Findings:**
- **prunize**: Uses TOON format from official library for arrays/objects
- **prunize**: Switches to compact format for simple key-values
- **@toon-format/toon**: Consistent TOON format with better readability
- **Token Efficiency**: Mostly tied, prunize slightly better with compact format
- **Readability**: TOON official has better human readability
- **Use Cases**: 
  - prunize: Auto-detects best format (TOON/compact/CSV)
  - toon: Standard TOON format with bidirectional support

**Comparison Results:**
| Test Case | Winner | Difference |
|-----------|--------|------------|
| Array of Objects | Tie | 0.0% |
| Nested Objects | Tie | 0.0% |
| Mixed Data Types | Tie | 0.0% |
| Complex Nested | Tie | 0.0% |
| Large Dataset | Tie | 0.0% |
| Special Chars | prunize | 8.7% smaller |
| Simple Key-Value | toon | 17.6% smaller |

**Run:** `npm run compare:toon`

**Full Results**: See [COMPARISON-RESULTS.md](./COMPARISON-RESULTS.md) for detailed analysis.

**Risk Analysis**: See [TOON-RISKS-ANALYSIS.md](./TOON-RISKS-ANALYSIS.md) for safety considerations when using prunize TOON format for LLM prompts.

## Why This Matters

These examples use the **published npm package** from the registry, exactly as end users would install and use it. This ensures:

- ✅ Real-world usage patterns
- ✅ Integration validation
- ✅ Published package verification
- ✅ Documentation accuracy

For development and unit testing, see the `__tests__/` folder in the root project.
