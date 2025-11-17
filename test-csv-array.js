const { prunize } = require('./dist/index.js');

// Test case: Simple array data (should get high savings with CSV)
const arrayData = [
  { id: 1, name: "Alice", role: "Admin", email: "alice@example.com", status: "active" },
  { id: 2, name: "Bob", role: "User", email: "bob@example.com", status: "active" },
  { id: 3, name: "Charlie", role: "User", email: "charlie@example.com", status: "inactive" },
  { id: 4, name: "David", role: "Manager", email: "david@example.com", status: "active" },
  { id: 5, name: "Eve", role: "Admin", email: "eve@example.com", status: "active" },
];

console.log('Testing Array Data (Should Excel with CSV Format)');
console.log('='.repeat(80));
console.log('\nOriginal JSON:');
console.log(JSON.stringify(arrayData, null, 2));
console.log('\nLength:', JSON.stringify(arrayData, null, 2).length, 'chars');

const formats = ['csv', 'toon', 'compact', 'strip'];

formats.forEach(format => {
  const result = prunize(arrayData, { format });
  console.log(`\n${format.toUpperCase()}:`);
  console.log('Output:', result.output);
  console.log('Tokens:', result.tokens.before, '→', result.tokens.after, `(${result.tokens.savings})`);
});

// Auto-detect
console.log('\n' + '='.repeat(80));
console.log('AUTO-DETECT (best format):');
const auto = prunize(arrayData);
console.log('Format chosen:', auto.format);
console.log('Savings:', auto.tokens.savings);
console.log('Output:', auto.output);
