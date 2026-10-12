const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (!fullPath.includes(path.join('i18n', 'locales', 'ar.ts'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/[\u0600-\u06FF]/g);
        if (matches && matches.length > 5) {
          results.push({ file: path.relative('c:/MAMP/htdocs/Nextvora/Nextvora', fullPath), count: matches.length });
        }
      }
    }
  });
  return results;
}

const res = walk('src');
res.sort((a,b) => b.count - a.count);
console.log('Files with Arabic characters:');
res.forEach(r => console.log(r.count + ' chars: ' + r.file));
console.log('Total files:', res.length);
