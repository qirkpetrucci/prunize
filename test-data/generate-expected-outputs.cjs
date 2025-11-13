#!/usr/bin/env node

/**
 * Generate Expected Outputs for Golden Datasets
 * 
 * This script runs prunize on each golden dataset input and saves
 * the optimized outputs as expected results for regression testing.
 */

const fs = require('fs');
const path = require('path');
const { prunize } = require('../dist/index.js');

const datasets = [
  {
    name: 'OpenAPI Specification',
    input: 'openapi/large-api-spec.json',
    expectedDir: 'openapi/expected',
    options: [
      { name: 'auto' }
    ]
  },
  {
    name: 'Agent Function Calls',
    input: 'agent-traces/function-calls.json',
    expectedDir: 'agent-traces/expected',
    options: [
      { name: 'auto' }
    ]
  },
  {
    name: 'RAG Mixed Retrieval',
    input: 'rag-metadata/mixed-retrieval.json',
    expectedDir: 'rag-metadata/expected',
    options: [
      { name: 'auto' }
    ]
  },
  {
    name: 'Large Codebase File Tree',
    input: 'file-trees/large-codebase.json',
    expectedDir: 'file-trees/expected',
    options: [
      { name: 'auto' }
    ]
  },
  {
    name: 'PRD with Code Snippets',
    input: 'documents/large-prd-with-snippets.md',
    expectedDir: 'documents/expected',
    options: [
      { name: 'auto', optimizeSnippets: 'auto' },
      { name: 'auto-enabled', optimizeSnippets: true },
      { name: 'auto-disabled', optimizeSnippets: false }
    ]
  }
];

console.log('🚀 Generating expected outputs for golden datasets...\n');

let totalProcessed = 0;
let totalErrors = 0;

for (const dataset of datasets) {
  console.log(`📦 ${dataset.name}`);
  console.log(`   Input: ${dataset.input}`);
  
  const inputPath = path.join(__dirname, dataset.input);
  const expectedDir = path.join(__dirname, dataset.expectedDir);
  
  // Read input
  let input;
  try {
    const content = fs.readFileSync(inputPath, 'utf8');
    
    // Parse if JSON
    if (inputPath.endsWith('.json')) {
      input = JSON.parse(content);
    } else {
      input = content;
    }
  } catch (error) {
    console.error(`   ❌ Failed to read input: ${error.message}`);
    totalErrors++;
    continue;
  }
  
  // Create expected directory if doesn't exist
  if (!fs.existsSync(expectedDir)) {
    fs.mkdirSync(expectedDir, { recursive: true });
  }
  
  // Generate outputs for each option
  for (const option of dataset.options) {
    try {
      const result = prunize(input, option);
      
      const outputFileName = `${option.name}.txt`;
      const outputPath = path.join(expectedDir, outputFileName);
      const metaFileName = `${option.name}.meta.json`;
      const metaPath = path.join(expectedDir, metaFileName);
      
      // Save optimized output
      fs.writeFileSync(outputPath, result.output, 'utf8');
      
      // Save metadata (tokens, format, confidence, etc.)
      const metadata = {
        format: result.format,
        tokens: result.tokens,
        confidence: result.confidence,
        autoDecision: result.autoDecision,
        generatedAt: new Date().toISOString(),
        inputFile: dataset.input,
        options: option
      };
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');
      
      console.log(`   ✅ ${option.name}: ${result.tokens.before} → ${result.tokens.after} tokens (${result.tokens.savings})`);
      totalProcessed++;
      
    } catch (error) {
      console.error(`   ❌ Failed to generate ${option.name}: ${error.message}`);
      totalErrors++;
    }
  }
  
  console.log('');
}

console.log('─'.repeat(60));
console.log(`✨ Generation complete!`);
console.log(`   Processed: ${totalProcessed} outputs`);
console.log(`   Errors: ${totalErrors}`);

if (totalErrors > 0) {
  process.exit(1);
}
