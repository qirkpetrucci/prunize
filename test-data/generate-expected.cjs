#!/usr/bin/env node

const { prunize } = require('../dist/index.js');
const fs = require('fs');
const path = require('path');

// Test datasets
const datasets = [
  {
    name: 'OpenAPI Pet Store',
    input: path.join(__dirname, 'openapi/petstore-api.json'),
    output: path.join(__dirname, 'openapi/expected')
  },
  {
    name: 'Agent Multi-Tool Trace',
    input: path.join(__dirname, 'agent/multi-tool-trace.json'),
    output: path.join(__dirname, 'agent/expected')
  },
  {
    name: 'PRD with Code Snippets',
    input: path.join(__dirname, 'prd/realtime-collab-platform.md'),
    output: path.join(__dirname, 'prd/expected')
  },
  {
    name: 'Large Nested JSON',
    input: path.join(__dirname, 'nested/ecommerce-config.json'),
    output: path.join(__dirname, 'nested/expected')
  },
  {
    name: 'HTML E-commerce Page',
    input: path.join(__dirname, 'html/ecommerce-products.html'),
    output: path.join(__dirname, 'html/expected')
  }
];

console.log('🔄 Generating expected outputs...\n');

datasets.forEach(dataset => {
  console.log(`📦 Processing: ${dataset.name}`);
  
  // Read input
  const input = fs.readFileSync(dataset.input, 'utf8');
  const sizeKB = (input.length / 1024).toFixed(1);
  
  // Run prunize
  const result = prunize(input);
  
  // Create output directory
  if (!fs.existsSync(dataset.output)) {
    fs.mkdirSync(dataset.output, { recursive: true });
  }
  
  // Save output
  const outputPath = path.join(dataset.output, 'auto.txt');
  fs.writeFileSync(outputPath, result.output);
  
  // Save metadata
  const metaPath = path.join(dataset.output, 'auto.meta.json');
  const metadata = {
    format: result.format,
    tokens: result.tokens,
    confidence: result.confidence,
    generated_at: new Date().toISOString()
  };
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  
  console.log(`   Size: ${sizeKB}KB`);
  console.log(`   Format: ${result.format}`);
  console.log(`   Tokens: ${result.tokens.before} → ${result.tokens.after}`);
  console.log(`   Savings: ${result.tokens.savings}`);
  console.log(`   Confidence: ${Math.round(result.confidence * 100)}%`);
  console.log(`   ✅ Output: ${outputPath}\n`);
});

console.log('✨ All expected outputs generated successfully!');
