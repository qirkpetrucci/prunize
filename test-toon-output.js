const { encode } = require('@toon-format/toon');

// Test 1: null value
console.log('=== NULL VALUE ===');
const t1 = { name: 'Bob', age: null };
console.log(encode(t1));

// Test 2: empty array
console.log('\n=== EMPTY ARRAY ===');
const t2 = { items: [] };
console.log(encode(t2));

// Test 3: nested object
console.log('\n=== NESTED OBJECT ===');
const t3 = { user: { name: 'Charlie', contact: { email: 'charlie@example.com' }}};
console.log(encode(t3));
