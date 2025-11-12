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

# Or run specific example
npm run example:large-text
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

## Why This Matters

These examples use the **published npm package** from the registry, exactly as end users would install and use it. This ensures:

- ✅ Real-world usage patterns
- ✅ Integration validation
- ✅ Published package verification
- ✅ Documentation accuracy

For development and unit testing, see the `__tests__/` folder in the root project.
