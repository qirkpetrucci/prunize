# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2025-11-13

### Added
- **Depth protection** - New `maxDepth` option (default: 100 levels)
  - Prevents stack overflow on deeply nested objects
  - Clear error message when depth limit exceeded
  - Set to 0 to disable depth checking
- **Size warnings** - Warns when processing large inputs (>100KB)
  - Helpful guidance to consider chunking data
  - Only shown in verbose mode
- **Input size limit documentation** - Added comprehensive section in README
  - Examples of customizing `maxInputSize`
  - Best practices and recommendations
  - Error handling examples

### Improved
- **Error messages** - More descriptive and actionable
  - Input size errors now suggest increasing `maxInputSize` or chunking
  - Depth errors explain the issue and suggest solutions
  - All errors include relevant context (size, depth, etc.)
- **Circular reference detection** - Now respects `maxDepth` limit
  - Prevents infinite recursion on pathological inputs
  - Better performance on deeply nested structures

### Documentation
- Added comparison paragraph with prompt-optimizer library
  - Explains structural vs semantic compression approaches
  - Clarifies when to use each tool
- Enhanced API Reference with `maxDepth` option
- Added Input Size Limits section with examples

## [0.1.3] - 2025-11-12

### Added
- RAG Integration documentation in README
  - Practical examples for optimizing vector store metadata
  - Cost impact analysis ($25/month savings for 100K queries)
  - Best practices for structured metadata vs plain text
- Agentic AI Integration documentation in README
  - Function calling optimization examples (50-70% savings)
  - Multi-agent communication patterns
  - Memory management strategies
  - Cost impact: $937/month savings for 100K workflows

### Documentation
- Internal feature roadmap created (`docs/feature-plan.md`)
  - 10 proposed features for v0.2.0-v0.5.0+
  - Priority matrix and timelines
  - Detailed specifications and code examples
  - Not included in npm package (internal planning)

## [0.1.2] - 2025-11-12

### Added
- Professional test infrastructure with hybrid approach
  - ✅ 44 comprehensive unit tests using Vitest
  - ✅ Unit tests in `__tests__/` directory (detector, formatters, integration)
  - ✅ Integration tests in `examples/` using published npm package
  - ✅ Test coverage support with `@vitest/coverage-v8`
  - ✅ All tests passing (100% success rate)

### Fixed
- Fixed `examples/tsconfig.json` TypeScript configuration
  - Resolved `rootDir` conflict with parent tsconfig
  - Created standalone config with `"rootDir": "."` for examples folder
  - Eliminated TypeScript errors for files outside `src/` directory

### Documentation
- Enhanced README.md with comprehensive testing instructions
  - Added "Real-World Examples" section with `npm run examples` guide
  - Added "Development Testing" section with test commands
  - Documented test structure (44 tests across 3 files)
- Created `docs/TEST_FIXES.md` documenting test correction process

### Known Issues
- `toTOON` circular reference detection has a bug with nested objects
  - Nested objects are incorrectly flagged as `[Circular]`
  - Affects deeply nested object structures
  - Workaround: Use shallow object structures
  - Fix planned for future release

## [0.1.1] - 2025-11-12

### Fixed
- Repository URL in package.json now points to GitHub instead of GitLab

## [0.1.0] - 2025-11-12

### Added
- Initial release
- 🤖 Auto-decision mode for smart snippet optimization (~0.16ms overhead)
- 🔍 Auto-detection for JSON, YAML, XML, HTML, and plain text
- 📊 Multiple output formats: CSV, TOON (spec v2.0 compliant), Compact JSON, Strip
- ⚡ Blazing fast performance (0.31ms average execution)
- 💰 30-83% token reduction for LLM API calls
- 🎯 Full TypeScript support with type definitions
- 📈 Token analytics with savings calculation and confidence scores
- 🔒 Circular reference detection and error handling
- 🌀 Zero dependencies

### Performance
- Simple JSON: 18-40% token savings
- Array data: 60-83% token savings
- PRD documents: 11-28% savings (with auto-snippets)

[unreleased]: https://github.com/qirkpetrucci/prunize/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/qirkpetrucci/prunize/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/qirkpetrucci/prunize/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/qirkpetrucci/prunize/releases/tag/v0.1.0
