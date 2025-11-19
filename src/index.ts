import { detectFormat, isYAMLString, isXMLString, isHTMLString } from "./detector.js";
import { formatAs } from "./formatters.js";
import { convertToToon } from "./converter.js";
import { estimateTokens, parseSimpleYAML, parseSimpleXML, parseSimpleHTML, detectSnippets } from "./utils.js";

/**
 * Output format types (compact is now an option, not a format)
 */
export type OutputFormat = "csv" | "toon" | "strip";

export interface PrunizeOptions {
  /**
   * Output format selection
   * - `undefined` (default): Auto-detect best format based on input structure
   * - `'csv'`: Force CSV table format
   * - `'toon'`: Force TOON object notation
   * - `'strip'`: Force plain text format
   */
  format?: OutputFormat;
  /**
   * Remove whitespace for maximum token savings (default: true)
   * - `true` (default): Strip whitespace, newlines, indentation for compact output
   * - `false`: Keep readable formatting (useful for debugging)
   * 
   * Works with all formats (TOON, CSV, Strip)
   */
  compact?: boolean;
  verbose?: boolean;
  /**
   * Enable snippet detection & optimization for large text documents
   * Detects embedded JSON, YAML, XML, HTML snippets and optimizes them
   * 
   * - `'auto'`: Let prunize decide based on content analysis (default - recommended)
   * - `true`: Force enable snippet optimization
   * - `false`: Disable snippet optimization
   * 
   * When enabled: Adds ~0.16ms overhead but saves 10-40% more tokens
   * Use for: PRDs, Jira tickets, specs, documentation with code examples
   */
  optimizeSnippets?: boolean | 'auto';
  /**
   * Maximum input size in bytes (default: 100KB)
   * Set to 0 to disable limit
   */
  maxInputSize?: number;
  /**
   * Maximum object nesting depth (default: 100)
   * Prevents stack overflow on deeply nested objects
   * Set to 0 to disable depth checking
   */
  maxDepth?: number;
}

export interface PrunizeResult {
  format: "csv" | "toon" | "strip";
  output: string;
  tokens: {
    before: number;
    after: number;
    savings: string; // Percentage string like "39.2%"
  };
  confidence: number; // Detection confidence 0-1
  /**
   * Auto-decision metadata (only present when optimizeSnippets: 'auto')
   */
  autoDecision?: {
    enabled: boolean;
    reason: string;
    decisionTimeMs: number;
    stats?: {
      totalSnippets: number;
      optimizableSnippets: number;
      snippetRatio: number;
    };
  };
}

/**
 * Checks if input has circular references
 * @param obj - Object to check
 * @param maxDepth - Maximum nesting depth to check (default: 100)
 */
function hasCircularReference(obj: any, maxDepth: number = 100): boolean {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const seen = new WeakSet<object>();
  
  const check = (value: any, depth: number): boolean => {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    
    // Check depth limit
    if (maxDepth > 0 && depth > maxDepth) {
      throw new Error(
        `Maximum nesting depth (${maxDepth}) exceeded. ` +
        `Your data has more than ${maxDepth} levels of nesting. ` +
        `Consider flattening your data structure or increase maxDepth option.`
      );
    }
    
    if (seen.has(value)) {
      return true;  // Circular detected!
    }
    
    seen.add(value);
    
    if (Array.isArray(value)) {
      return value.some(item => check(item, depth + 1));
    }
    
    return Object.values(value).some(val => check(val, depth + 1));
  };
  
  return check(obj, 0);
}

/**
 * Apply compaction to output based on format
 * Removes whitespace, newlines, and indentation for maximum token savings
 * 
 * @param output - Formatted output string
 * @param format - Output format type
 * @param compact - Whether to apply compaction
 * @returns Compacted output string
 */
function compactOutput(output: string, format: OutputFormat | "strip", compact: boolean): string {
  if (!compact) {
    return output; // Keep readable formatting
  }
  
  switch (format) {
    case "toon":
      // TOON compaction: Remove newlines and extra spaces
      // Pattern: "users[2]{id,name}:\n  1,Alice\n  2,Bob"
      // Result: "users[2]{id,name}:1,Alice;2,Bob"
      return output
        .replace(/:\s*\n\s*/g, ':') // Remove newlines after colons
        .replace(/\n\s*/g, ';') // Replace newlines with semicolons
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    
    case "csv":
      // CSV compaction: Replace newlines with semicolons
      // Pattern: "id,name\n1,Alice\n2,Bob"
      // Result: "id,name;1,Alice;2,Bob"
      return output
        .replace(/\n/g, ';')
        .trim();
    
    case "strip":
      // Strip compaction: Collapse whitespace and newlines
      return output
        .replace(/\n+/g, ' ')       // Replace all newlines with space
        .replace(/\s+/g, ' ')       // Collapse multiple spaces
        .trim();
    
    default:
      // Default: Collapse whitespace
      return output
        .replace(/\s+/g, ' ')
        .trim();
  }
}

/**
 * Auto-decision result for snippet optimization
 */
interface AutoDecisionResult {
  shouldOptimize: boolean;
  reason: string;
  decisionTimeMs: number;
  stats?: {
    totalSnippets: number;
    optimizableSnippets: number;
    snippetRatio: number;
  };
}

/**
 * Intelligently decide if snippet optimization should be used
 * Based on content analysis and cost-benefit estimation
 * 
 * @param content - Input text content to analyze
 * @param verbose - Whether to log decision details
 * @returns Decision result with reasoning
 */
function shouldUseSnippetOptimization(content: string, verbose: boolean): AutoDecisionResult {
  const startTime = performance.now();
  
  // 1. Quick check: Does content have code snippets?
  const snippetRegex = /```[\s\S]*?```/g;
  const snippets = content.match(snippetRegex);
  
  if (!snippets || snippets.length === 0) {
    const decisionTimeMs = performance.now() - startTime;
    return {
      shouldOptimize: false,
      reason: "No code snippets detected",
      decisionTimeMs
    };
  }

  // 2. Classify snippet types
  const optimizableTypes = ['json', 'yaml', 'yml', 'xml', 'html'];
  let optimizableCount = 0;
  
  for (const snippet of snippets) {
    const langMatch = snippet.match(/```(\w+)/);
    const lang = langMatch ? langMatch[1].toLowerCase() : '';
    
    if (optimizableTypes.includes(lang)) {
      optimizableCount++;
    } else if (!lang) {
      // Detect by content if no language specified
      const content = snippet.replace(/```[\s\S]*?\n/, '').replace(/\n```$/, '').trim();
      const firstChar = content.charAt(0);
      
      // Quick heuristic: JSON starts with { or [, YAML with key:, XML/HTML with <
      if (firstChar === '{' || firstChar === '[' || content.startsWith('<') || content.includes(':\n')) {
        optimizableCount++;
      }
    }
  }

  // 3. Calculate snippet content ratio
  const totalSnippetChars = snippets.reduce((sum, s) => sum + s.length, 0);
  const snippetRatio = totalSnippetChars / content.length;

  const stats = {
    totalSnippets: snippets.length,
    optimizableSnippets: optimizableCount,
    snippetRatio: parseFloat((snippetRatio * 100).toFixed(1))
  };

  const decisionTimeMs = performance.now() - startTime;

  // 4. Apply decision rules
  const hasOptimizableSnippets = optimizableCount > 0;
  const significantContent = snippetRatio > 0.15; // >15% of content
  const reasonableCount = snippets.length <= 20; // Not too many

  // Decision tree
  if (!hasOptimizableSnippets) {
    return {
      shouldOptimize: false,
      reason: "No JSON/YAML/XML/HTML snippets found",
      decisionTimeMs,
      stats
    };
  }

  if (!significantContent) {
    return {
      shouldOptimize: false,
      reason: `Snippet content ${stats.snippetRatio}% < 15% threshold`,
      decisionTimeMs,
      stats
    };
  }

  if (!reasonableCount) {
    return {
      shouldOptimize: false,
      reason: `Too many snippets (${snippets.length} > 20)`,
      decisionTimeMs,
      stats
    };
  }

  return {
    shouldOptimize: true,
    reason: `${optimizableCount} optimizable snippets (${stats.snippetRatio}% of content)`,
    decisionTimeMs,
    stats
  };
}

/**
 * Intelligently optimizes input for LLM prompting by detecting the best format
 * 
 * @param input - Any JSON-serializable value or text document
 * @param options - Optimization options
 * @returns Optimization result with format, output, and token statistics
 * 
 * @example
 * ```ts
 * // Example 1: JSON object
 * const jsonInput = {
 *   title: "Weekly Report",
 *   items: [
 *     { id: 1, task: "Setup test", status: "Done" },
 *     { id: 2, task: "Review code", status: "In Progress" }
 *   ]
 * };
 * 
 * const result = jtune(jsonInput, { verbose: true });
 * console.log(result.format); // "toon"
 * console.log(result.output); // TOON formatted output
 * console.log(result.tokens.savings); // 39.2
 * 
 * // Example 2: Large text with embedded snippets (PRD, spec, Jira ticket)
 * const prdDocument = `
 * # Payment Gateway Integration
 * 
 * ## Configuration
 * The system uses this config:
 * \`\`\`json
 * {
 *   "gateway": "stripe",
 *   "apiKey": "sk_test_...",
 *   "supportedCurrencies": ["USD", "EUR", "GBP"]
 * }
 * \`\`\`
 * 
 * ## Requirements
 * - Support multiple payment methods
 * - 99.9% uptime
 * `;
 * 
 * const result2 = prunize(prdDocument, { optimizeSnippets: true, verbose: true });
 * // Detects and optimizes the JSON snippet inside the document
 * // Saves 10-40% more tokens compared to basic strip
 * 
 * // Example 3: Auto-decision mode (recommended)
 * const result3 = prunize(prdDocument, { optimizeSnippets: 'auto', verbose: true });
 * // Prunize analyzes content and decides whether to optimize snippets
 * // Provides autoDecision metadata explaining the decision
 * ```
 */
export function prunize(input: any, options?: PrunizeOptions): PrunizeResult {
  // BACKWARD COMPATIBILITY: Handle deprecated format: 'compact'
  if ((options as any)?.format === 'compact') {
    // Show deprecation warning in development or verbose mode
    if (options?.verbose || process.env.NODE_ENV === 'development') {
      console.warn(
        '[prunize] DEPRECATION: format: "compact" is deprecated in v0.3.0.\n' +
        'Use compact: true instead. Example: prunize(data, { compact: true })\n' +
        'This fallback will be removed in v1.0.0.'
      );
    }
    
    // Auto-migrate to new API
    (options as any).format = undefined; // Auto-detect format
    options = { ...options, compact: true };
  }
  
  // Constants
  const MAX_INPUT_SIZE = options?.maxInputSize !== undefined ? options.maxInputSize : 100 * 1024; // 100KB default
  const MAX_DEPTH = options?.maxDepth !== undefined ? options.maxDepth : 100; // 100 levels default
  const COMPACT = options?.compact !== undefined ? options.compact : true; // Compact by default
  
  // Validate input size
  if (MAX_INPUT_SIZE > 0) {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
    const inputSize = new TextEncoder().encode(inputStr).length;
    
    if (inputSize > MAX_INPUT_SIZE) {
      throw new Error(
        `Input size (${(inputSize / 1024).toFixed(2)} KB) exceeds maximum allowed size (${(MAX_INPUT_SIZE / 1024).toFixed(0)} KB). ` +
        `Consider chunking your data or increase maxInputSize option.`
      );
    }
    
    // Warn for large inputs (between 100KB and limit)
    if (options?.verbose && inputSize > 100 * 1024 && inputSize <= MAX_INPUT_SIZE) {
      console.warn(
        `[prunize] Large input detected (${(inputSize / 1024).toFixed(0)} KB). ` +
        `Processing may be slow. Consider chunking your data for better performance.`
      );
    }
  }
  
  let autoDecision: AutoDecisionResult | undefined;
  
  // Set default optimizeSnippets to 'auto' if not specified
  const snippetMode = options?.optimizeSnippets !== undefined ? options.optimizeSnippets : 'auto';
  
  // AUTO-DECISION: Determine if snippet optimization should be used
  if (typeof input === "string" && input.length > 500) {
    if (snippetMode === 'auto') {
      autoDecision = shouldUseSnippetOptimization(input, options?.verbose || false);
      
      if (options?.verbose) {
        console.log(`[prunize] Auto-decision: ${autoDecision.shouldOptimize ? 'ENABLE' : 'SKIP'} snippet optimization`);
        console.log(`[prunize] Reason: ${autoDecision.reason}`);
        console.log(`[prunize] Decision time: ${autoDecision.decisionTimeMs.toFixed(3)}ms`);
        if (autoDecision.stats) {
          console.log(`[prunize] Stats: ${autoDecision.stats.optimizableSnippets}/${autoDecision.stats.totalSnippets} snippets, ${autoDecision.stats.snippetRatio}% of content`);
        }
      }
      
      // Use the auto-decision result
      options = { ...options, optimizeSnippets: autoDecision.shouldOptimize };
    } else {
      // Use explicit true/false value
      options = { ...options, optimizeSnippets: snippetMode };
    }
  }
  
  // Special handling for large text documents with embedded snippets
  if (options?.optimizeSnippets && typeof input === "string" && input.length > 500) {
    if (options?.verbose) {
      console.log(`[prunize] Snippet optimization enabled - scanning for embedded code/data blocks`);
    }
    
    try {
      const segments = detectSnippets(input);
      
      // Count detected snippets
      const snippetCount = segments.filter(s => s.type !== "text").length;
      
      if (snippetCount > 0) {
        if (options?.verbose) {
          console.log(`[prunize] Detected ${snippetCount} snippet(s) in document`);
          segments.filter(s => s.type !== "text").forEach(s => {
            console.log(`  - ${s.type.toUpperCase()} snippet (${s.content.length} chars)`);
          });
        }
        
        // Optimize each snippet
        const optimizedSegments: string[] = [];
        
        for (const segment of segments) {
          if (segment.type === "text") {
            optimizedSegments.push(segment.content);
          } else {
            try {
              let parsed: any = null;
              
              if (segment.type === "json") {
                parsed = JSON.parse(segment.content);
              } else if (segment.type === "yaml") {
                parsed = parseSimpleYAML(segment.content);
              } else if (segment.type === "xml") {
                parsed = parseSimpleXML(segment.content);
              } else if (segment.type === "html") {
                parsed = parseSimpleHTML(segment.content);
              }
              
              if (parsed !== null) {
                // Detect best format for this snippet
                const analysis = detectFormat(parsed);
                
                // Use library-based conversion for safety and spec compliance
                let optimizedSnippet: string;
                if (analysis.format === 'toon') {
                  // Use official @toon-format/toon library via convertToToon
                  optimizedSnippet = convertToToon(parsed, {
                    useTOONLibrary: true,
                    validateBeforeEncode: true,
                    preprocessData: true,
                    verbose: false // Avoid nested verbose logs
                  });
                } else {
                  // Use other formatters (CSV, strip)
                  optimizedSnippet = formatAs(parsed, analysis.format);
                }
                
                // Apply compaction to snippet
                optimizedSnippet = compactOutput(optimizedSnippet, analysis.format, COMPACT);
                
                // Use optimized snippet directly without wrapper
                optimizedSegments.push(optimizedSnippet);
                
                if (options?.verbose) {
                  const originalLen = segment.content.length;
                  const optimizedLen = optimizedSnippet.length;
                  const saved = ((originalLen - optimizedLen) / originalLen * 100).toFixed(1);
                  console.log(`  ✓ ${segment.type} → ${analysis.format} (${saved}% smaller, ${analysis.format === 'toon' ? 'library-based' : 'custom'})`);
                }
              } else {
                // Option 2: For unparseable YAML/code snippets, apply text-based compaction
                let optimizedSnippet = segment.content;
                
                if (segment.type === 'yaml') {
                  // Compact YAML snippet (couldn't parse to object)
                  optimizedSnippet = segment.content
                    .replace(/\n\s+/g, '\n')        // Remove indentation
                    .replace(/:\s+/g, ':')          // Remove space after colons
                    .replace(/\n/g, ';')            // Replace newlines with semicolons
                    .replace(/  +/g, ' ')           // Collapse spaces
                    .trim();
                  
                  if (options?.verbose) {
                    const originalLen = segment.content.length;
                    const optimizedLen = optimizedSnippet.length;
                    const saved = ((originalLen - optimizedLen) / originalLen * 100).toFixed(1);
                    console.log(`  ✓ yaml → compact (${saved}% smaller, text-based)`);
                  }
                } else if (segment.type === 'code') {
                  // Try to detect if it's SQL
                  const lowerContent = segment.content.toLowerCase();
                  if (lowerContent.includes('select ') || lowerContent.includes('create table') || 
                      lowerContent.includes('insert into') || lowerContent.includes('update ')) {
                    // Compact SQL snippet
                    optimizedSnippet = segment.content
                      .replace(/\s+/g, ' ')           // Collapse all whitespace
                      .replace(/\(\s+/g, '(')         // Remove space after (
                      .replace(/\s+\)/g, ')')         // Remove space before )
                      .replace(/,\s+/g, ',')          // Remove space after commas
                      .trim();
                    
                    if (options?.verbose) {
                      const originalLen = segment.content.length;
                      const optimizedLen = optimizedSnippet.length;
                      const saved = ((originalLen - optimizedLen) / originalLen * 100).toFixed(1);
                      console.log(`  ✓ sql → compact (${saved}% smaller, text-based)`);
                    }
                  }
                }
                
                optimizedSegments.push(optimizedSnippet);
              }
            } catch (error) {
              // Failed to optimize this snippet, keep original
              optimizedSegments.push(segment.content);
              
              if (options?.verbose) {
                console.log(`  ✗ ${segment.type} optimization failed, keeping original`);
              }
            }
          }
        }
        
        const originalTokens = estimateTokens(input);
        const optimizedText = optimizedSegments.join("");
        const optimizedTokens = estimateTokens(optimizedText);
        
        const savingsPercent = originalTokens > 0
          ? ((originalTokens - optimizedTokens) / originalTokens) * 100
          : 0;
        
        if (options?.verbose) {
          console.log(`[prunize] Snippet optimization complete`);
          console.log(`[prunize] Original tokens: ${originalTokens}, Optimized: ${optimizedTokens}, Savings: ${savingsPercent.toFixed(1)}%`);
        }
        
        // Detect format from actual input for accurate reporting
        const inputAnalysis = typeof input === 'string' 
          ? { format: 'strip' as OutputFormat, confidence: 0.85 }
          : detectFormat(input);
        
        const result: PrunizeResult = {
          format: inputAnalysis.format,
          output: optimizedText,
          tokens: {
            before: originalTokens,
            after: optimizedTokens,
            savings: `${savingsPercent.toFixed(1)}%`
          },
          confidence: inputAnalysis.confidence
        };
        
        // Add auto-decision metadata if available
        if (autoDecision) {
          result.autoDecision = {
            enabled: autoDecision.shouldOptimize,
            reason: autoDecision.reason,
            decisionTimeMs: autoDecision.decisionTimeMs,
            stats: autoDecision.stats
          };
        }
        
        return result;
      } else {
        if (options?.verbose) {
          console.log(`[prunize] No snippets detected - using standard optimization`);
        }
        // Fall through to standard processing
      }
    } catch (error) {
      if (options?.verbose) {
        console.log(`[prunize] Snippet detection failed: ${error instanceof Error ? error.message : error}`);
        console.log(`[prunize] Falling back to standard optimization`);
      }
      // Fall through to standard processing
    }
  }
  
  // Auto-detect and parse YAML strings
  if (typeof input === "string" && isYAMLString(input)) {
    try {
      const parsed = parseSimpleYAML(input);
      
      if (options?.verbose) {
        console.log(`[prunize] YAML string detected - parsing to object for optimization`);
      }
      
      // Continue with parsed object
      input = parsed;
    } catch (error) {
      if (options?.verbose) {
        console.log(`[prunize] YAML parsing failed, treating as text: ${error instanceof Error ? error.message : error}`);
      }
      // Fall through to normal string processing
    }
  }
  
  // Auto-detect and parse HTML strings (check before XML since HTML is subset of XML)
  else if (typeof input === "string" && isHTMLString(input)) {
    try {
      const parsed = parseSimpleHTML(input);
      
      if (options?.verbose) {
        console.log(`[prunize] HTML string detected - parsing to object for optimization`);
      }
      
      // Continue with parsed object
      input = parsed;
    } catch (error) {
      if (options?.verbose) {
        console.log(`[prunize] HTML parsing failed, treating as text: ${error instanceof Error ? error.message : error}`);
      }
      // Fall through to normal string processing
    }
  }
  
  // Auto-detect and parse XML strings
  else if (typeof input === "string" && isXMLString(input)) {
    try {
      const parsed = parseSimpleXML(input);
      
      if (options?.verbose) {
        console.log(`[prunize] XML string detected - parsing to object for optimization`);
      }
      
      // Continue with parsed object
      input = parsed;
    } catch (error) {
      if (options?.verbose) {
        console.log(`[prunize] XML parsing failed, treating as text: ${error instanceof Error ? error.message : error}`);
      }
      // Fall through to normal string processing
    }
  }
  
  // Check for circular references before processing
  if (hasCircularReference(input, MAX_DEPTH)) {
    if (options?.verbose) {
      console.log(`[prunize] Warning: Circular reference detected in input`);
    }
    
    // Return input as JSON string with circular reference handling
    const seen = new WeakSet<object>();
    const output = "[Circular Reference Detected] " + JSON.stringify(input, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    });
    
    const tokens = estimateTokens(output);
    
    return {
      format: "strip",
      output,
      tokens: {
        before: tokens,
        after: tokens,
        savings: "0.0%"
      },
      confidence: 0.5
    };
  }

  // Check if input is already TOON format (string with TOON pattern)
  // Pattern: [count]{keys}: or [count]{key{nested}}:
  if (typeof input === "string" && /^\S+\[\d+\]\{[\w,{}]+\}:\s*$/m.test(input)) {
    const tokens = estimateTokens(input);
    
    if (options?.verbose) {
      console.log(`[prunize] Input already in TOON format - returning as-is`);
      console.log(`[prunize] Tokens: ${tokens}`);
    }
    
    return {
      format: "toon",
      output: input,
      tokens: {
        before: tokens,
        after: tokens,
        savings: "0.0%"
      },
      confidence: 1.0
    };
  }
  
  // Detect best format (or use forced format from options)
  const analysis = options?.format 
    ? { format: options.format, reason: "User-specified format", confidence: 1.0 }
    : detectFormat(input);
  
  // Convert to original JSON for comparison
  const originalJson = JSON.stringify(input);
  const originalTokens = estimateTokens(originalJson);
  
  // Apply detected/forced format
  let optimizedOutput = formatAs(input, analysis.format);
  
  // Apply compaction if enabled (default: true)
  optimizedOutput = compactOutput(optimizedOutput, analysis.format, COMPACT);
  
  const optimizedTokens = estimateTokens(optimizedOutput);
  
  // Calculate savings percentage
  const savingsPercent = originalTokens > 0
    ? ((originalTokens - optimizedTokens) / originalTokens) * 100
    : 0;
  
  // Verbose logging
  if (options?.verbose) {
    console.log(`[prunize] Detected format: ${analysis.format.toUpperCase()}`);
    console.log(`[prunize] Reason: ${analysis.reason}`);
    console.log(`[prunize] Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    console.log(`[prunize] Compaction: ${COMPACT ? 'enabled' : 'disabled'}`);
    console.log(`[prunize] Original tokens: ${originalTokens}, Optimized: ${optimizedTokens}, Savings: ${savingsPercent.toFixed(1)}%`);
  }
  
  const result: PrunizeResult = {
    format: analysis.format,
    output: optimizedOutput,
    tokens: {
      before: originalTokens,
      after: optimizedTokens,
      savings: `${savingsPercent.toFixed(1)}%`
    },
    confidence: analysis.confidence
  };
  
  // Add auto-decision metadata if available
  if (autoDecision) {
    result.autoDecision = {
      enabled: autoDecision.shouldOptimize,
      reason: autoDecision.reason,
      decisionTimeMs: autoDecision.decisionTimeMs,
      stats: autoDecision.stats
    };
  }
  
  return result;
}

// Re-export types and utilities
export type { FormatType, StructureAnalysis } from "./detector.js";
export { detectFormat, calculateComplexity } from "./detector.js";
export { formatAs, toCSV, toTOON, toCompact, toStrip } from "./formatters.js";
