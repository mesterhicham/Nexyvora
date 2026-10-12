const fs = require('fs');

const en = fs.readFileSync('src/i18n/locales/en.ts', 'utf8');
const lines = en.split('\n');
const topKeys = [];
lines.forEach(line => {
  const m = line.match(/^  "([^"]+)": \{/);
  if (m) topKeys.push(m[1]);
});

console.log('Top keys in en.ts:');
console.log(topKeys);

const start = en.indexOf('"bonusPools": {');
const end = en.indexOf('  },', start);
console.log(en.substring(start, end + 4));

