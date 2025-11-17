const { prunize } = require('./dist/index.js');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Maximum Token Savings Across All Test Data\n');
console.log('='.repeat(80));

// Test data files
const testFiles = [
  { name: 'OpenAPI Pet Store', path: 'test-data/openapi/petstore-api.json', type: 'json' },
  { name: 'Agent Multi-Tool Trace', path: 'test-data/agent/multi-tool-trace.json', type: 'json' },
  { name: 'PRD with Code Snippets', path: 'test-data/prd/realtime-collab-platform.md', type: 'text' },
  { name: 'Large Nested JSON', path: 'test-data/nested/ecommerce-config.json', type: 'json' }
];

const results = [];

testFiles.forEach(file => {
  const data = fs.readFileSync(file.path, 'utf8');
  let parsed = data;
  
  if (file.type === 'json') {
    parsed = JSON.parse(data);
  }
  
  // Test all formats
  const formats = ['csv', 'toon', 'compact', 'strip'];
  
  console.log(`\n📄 ${file.name}`);
  console.log('-'.repeat(80));
  
  formats.forEach(format => {
    try {
      const result = prunize(parsed, { format });
      const savings = parseFloat(result.tokens.savings);
      
      console.log(`  ${format.toUpperCase().padEnd(10)} - ${result.tokens.before} → ${result.tokens.after} tokens (${result.tokens.savings})`);
      
      results.push({
        dataset: file.name,
        format,
        savings,
        tokensBefore: result.tokens.before,
        tokensAfter: result.tokens.after
      });
    } catch (error) {
      console.log(`  ${format.toUpperCase().padEnd(10)} - ERROR: ${error.message}`);
    }
  });
});

// Find maximum
console.log('\n' + '='.repeat(80));
console.log('📊 MAXIMUM SAVINGS FOUND');
console.log('='.repeat(80));

const sorted = results.sort((a, b) => b.savings - a.savings);
const top5 = sorted.slice(0, 5);

top5.forEach((r, i) => {
  console.log(`${i + 1}. ${r.dataset} (${r.format.toUpperCase()}): ${r.savings.toFixed(1)}% (${r.tokensBefore} → ${r.tokensAfter} tokens)`);
});

const maxSavings = sorted[0];
console.log('\n🏆 MAXIMUM TOKEN SAVINGS: ' + maxSavings.savings.toFixed(1) + '%');
console.log(`   Dataset: ${maxSavings.dataset}`);
console.log(`   Format: ${maxSavings.format.toUpperCase()}`);
console.log(`   Tokens: ${maxSavings.tokensBefore} → ${maxSavings.tokensAfter}`);

if (maxSavings.savings >= 83) {
  console.log('\n✅ CLAIM VERIFIED: Achieved 83%+ savings!');
} else {
  console.log(`\n⚠️  CLAIM NOT VERIFIED: Maximum savings is ${maxSavings.savings.toFixed(1)}%, not 83%`);
  console.log(`   Recommended claim: "6-${Math.ceil(maxSavings.savings)}%"`);
}
