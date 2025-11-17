const { prunize } = require('./dist/index.js');

// Test different array sizes
const sizes = [10, 50, 100, 200, 500];

console.log('🔍 Testing Maximum Savings with Different Array Sizes');
console.log('='.repeat(80));

sizes.forEach(size => {
  const array = [];
  for (let i = 1; i <= size; i++) {
    array.push({
      id: i,
      name: `User${i}`,
      email: `user${i}@example.com`,
      role: i % 3 === 0 ? 'Admin' : i % 2 === 0 ? 'Manager' : 'User',
      status: i % 5 === 0 ? 'inactive' : 'active'
    });
  }
  
  const result = prunize(array);
  const savings = parseFloat(result.tokens.savings);
  
  console.log(`\n${size} items: ${result.tokens.before} → ${result.tokens.after} tokens (${result.tokens.savings})`);
});

console.log('\n' + '='.repeat(80));
console.log('📊 Finding Maximum Possible Savings...\n');

// Try with 1000 items
const massiveArray = [];
for (let i = 1; i <= 1000; i++) {
  massiveArray.push({
    id: i,
    name: `User${i}`,
    email: `user${i}@example.com`,
    status: 'active'
  });
}

const massive = prunize(massiveArray);
console.log('1000 items:', massive.tokens.before, '→', massive.tokens.after, `(${massive.tokens.savings})`);

console.log('\n🏆 MAXIMUM SAVINGS ACHIEVED:', massive.tokens.savings);

if (parseFloat(massive.tokens.savings) >= 83) {
  console.log('✅ 83% claim VERIFIED!');
} else {
  console.log(`⚠️  Maximum is ${massive.tokens.savings}, not 83%`);
  console.log(`   Recommended update: "6-${Math.ceil(parseFloat(massive.tokens.savings))}%"`);
}
