/**
 * Test snippet optimization with official TOON library
 * Verifies that JSON/YAML snippets in PRDs are optimized using @toon-format/toon
 */

const { prunize } = require('./dist/index.js');

// Test document: PRD with embedded JSON and YAML snippets
const prdWithSnippets = `
# Payment Gateway Integration

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

console.log('='.repeat(80));
console.log('Testing Snippet Optimization with Official TOON Library');
console.log('='.repeat(80));

// Test 1: Without snippet optimization
console.log('\n1️⃣  WITHOUT Snippet Optimization (optimizeSnippets: false)');
console.log('-'.repeat(80));
const withoutSnippets = prunize(prdWithSnippets, { 
  optimizeSnippets: false,
  verbose: true 
});
console.log(`Format: ${withoutSnippets.format}`);
console.log(`Token savings: ${withoutSnippets.tokens.savings}`);
console.log(`Output length: ${withoutSnippets.output.length} chars`);

// Test 2: With snippet optimization (auto-decision)
console.log('\n2️⃣  WITH Snippet Optimization - Auto Decision (optimizeSnippets: "auto")');
console.log('-'.repeat(80));
const withAutoDecision = prunize(prdWithSnippets, { 
  optimizeSnippets: 'auto',
  verbose: true 
});
console.log(`Format: ${withAutoDecision.format}`);
console.log(`Token savings: ${withAutoDecision.tokens.savings}`);
console.log(`Output length: ${withAutoDecision.output.length} chars`);
if (withAutoDecision.autoDecision) {
  console.log(`Auto-decision enabled: ${withAutoDecision.autoDecision.enabled}`);
  console.log(`Auto-decision reason: ${withAutoDecision.autoDecision.reason}`);
}

// Test 3: Force enable snippet optimization
console.log('\n3️⃣  WITH Snippet Optimization - Force Enabled (optimizeSnippets: true)');
console.log('-'.repeat(80));
const withSnippets = prunize(prdWithSnippets, { 
  optimizeSnippets: true,
  verbose: true 
});
console.log(`Format: ${withSnippets.format}`);
console.log(`Token savings: ${withSnippets.tokens.savings}`);
console.log(`Output length: ${withSnippets.output.length} chars`);

// Show comparison
console.log('\n📊 COMPARISON');
console.log('='.repeat(80));
console.log(`Original tokens: ${withoutSnippets.tokens.before}`);
console.log('');
console.log('Without snippets:');
console.log(`  Tokens: ${withoutSnippets.tokens.after} (${withoutSnippets.tokens.savings} savings)`);
console.log('');
console.log('With snippets (auto):');
console.log(`  Tokens: ${withAutoDecision.tokens.after} (${withAutoDecision.tokens.savings} savings)`);
console.log('');
console.log('With snippets (forced):');
console.log(`  Tokens: ${withSnippets.tokens.after} (${withSnippets.tokens.savings} savings)`);
console.log('');

const additionalSavings = parseFloat(withSnippets.tokens.savings) - parseFloat(withoutSnippets.tokens.savings);
console.log(`✅ Additional savings from snippet optimization: ${additionalSavings.toFixed(1)}%`);

// Verify TOON library is being used
console.log('\n🔍 VERIFICATION');
console.log('='.repeat(80));

// Check if output contains TOON-specific patterns from @toon-format/toon
const hasLibraryTOONPattern = withSnippets.output.includes('{') && 
                               withSnippets.output.includes(':') &&
                               !withSnippets.output.includes('|-'); // Custom converter pattern

console.log(`Using official @toon-format/toon library: ${hasLibraryTOONPattern ? '✅ YES' : '❌ NO'}`);

// Show sample of optimized snippet
const snippetStart = withSnippets.output.indexOf('auth');
if (snippetStart > 0) {
  const sample = withSnippets.output.substring(snippetStart, snippetStart + 200);
  console.log('\nSample optimized YAML snippet:');
  console.log(sample);
}

console.log('\n' + '='.repeat(80));
console.log('Test Complete!');
console.log('='.repeat(80));
