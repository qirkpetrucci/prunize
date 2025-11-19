const { prunize } = require('./dist/index.js');

// Test 1: RAG Metadata (nested object with text)
const ragMetadata = {
  query: "What are the best practices for implementing authentication in microservices?",
  retrieval_timestamp: "2025-11-13T14:22:35Z",
  sources: [
    {
      source_type: "vector_db",
      source_name: "technical_docs_embeddings",
      results: [
        {
          id: "vec_auth_001",
          score: 0.92,
          content: "Authentication in microservices requires careful consideration of token propagation. Use JWT tokens with short expiration times (15 minutes) for access tokens and longer-lived refresh tokens (7 days). Implement token validation at the API gateway level to reduce redundant validation across services.",
          metadata: {
            document_id: "doc_microservices_auth_guide",
            section: "Token Management",
            page: 12,
            author: "Jane Smith",
            published_date: "2024-08-15",
            url: "https://docs.example.com/microservices/authentication",
            tags: ["authentication", "jwt", "microservices", "security"]
          }
        }
      ]
    }
  ]
};

// Test 2: Simple nested object
const simpleNested = {
  user: {
    name: "Alice",
    settings: {
      theme: "dark",
      notifications: true
    }
  }
};

// Test 3: Flat array of objects
const flatArray = [
  { id: 1, name: "Alice", role: "Admin" },
  { id: 2, name: "Bob", role: "User" }
];

// Test 4: Text-heavy but not nested
const textHeavy = {
  title: "Long Article",
  content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
};

console.log('\n=== Format Detection Tests ===\n');

console.log('1. RAG Metadata (nested + text-heavy):');
const result1 = prunize(ragMetadata);
console.log(`   Format: ${result1.format}`);
console.log(`   Confidence: ${(result1.confidence * 100).toFixed(1)}%`);
console.log(`   Tokens: ${result1.tokens.before} → ${result1.tokens.after} (${result1.tokens.savings})`);

console.log('\n2. Simple Nested Object:');
const result2 = prunize(simpleNested);
console.log(`   Format: ${result2.format}`);
console.log(`   Confidence: ${(result2.confidence * 100).toFixed(1)}%`);
console.log(`   Tokens: ${result2.tokens.before} → ${result2.tokens.after} (${result2.tokens.savings})`);

console.log('\n3. Flat Array of Objects:');
const result3 = prunize(flatArray);
console.log(`   Format: ${result3.format}`);
console.log(`   Confidence: ${(result3.confidence * 100).toFixed(1)}%`);
console.log(`   Tokens: ${result3.tokens.before} → ${result3.tokens.after} (${result3.tokens.savings})`);

console.log('\n4. Text-Heavy (not nested):');
const result4 = prunize(textHeavy);
console.log(`   Format: ${result4.format}`);
console.log(`   Confidence: ${(result4.confidence * 100).toFixed(1)}%`);
console.log(`   Tokens: ${result4.tokens.before} → ${result4.tokens.after} (${result4.tokens.savings})`);

console.log('\n');
