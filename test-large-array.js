const { prunize } = require('./dist/index.js');

// Generate large array (100 items) - should get very high savings
const largeArray = [];
for (let i = 1; i <= 100; i++) {
  largeArray.push({
    id: i,
    name: `User${i}`,
    email: `user${i}@example.com`,
    role: i % 3 === 0 ? 'Admin' : i % 2 === 0 ? 'Manager' : 'User',
    status: i % 5 === 0 ? 'inactive' : 'active',
    score: Math.floor(Math.random() * 100),
    department: ['Sales', 'Engineering', 'Marketing', 'Support'][i % 4]
  });
}

console.log('Testing Large Array (100 items)');
console.log('='.repeat(80));

const jsonStr = JSON.stringify(largeArray, null, 2);
console.log('Original JSON length:', jsonStr.length, 'chars');

const formats = ['csv', 'toon'];

formats.forEach(format => {
  const result = prunize(largeArray, { format });
  console.log(`\n${format.toUpperCase()}:`);
  console.log('Output length:', result.output.length, 'chars');
  console.log('Tokens:', result.tokens.before, '→', result.tokens.after, `(${result.tokens.savings})`);
});

// Auto-detect
console.log('\n' + '='.repeat(80));
const auto = prunize(largeArray);
console.log('AUTO-DETECT:');
console.log('Format chosen:', auto.format);
console.log('Tokens:', auto.tokens.before, '→', auto.tokens.after);
console.log('🏆 SAVINGS:', auto.tokens.savings);
