const fs = require('fs');
const files = process.argv.slice(2);
for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let lines = text.split('\n');
  let result = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/[\s]+$/, '');
    const prevLine = result.length > 0 ? result[result.length - 1] : '';
    const prevIsBlank = prevLine.trim() === '';
    const prevIsList = /^(\s*[-*+]|\s*\d+\.)\s/.test(prevLine);
    const curIsList = /^(\s*[-*+]|\s*\d+\.)\s/.test(line);
    const curIsFence = /^```/.test(line);
    const curIsHeading = /^#{1,6}\s/.test(line);
    if (curIsList && !prevIsBlank && !prevIsList && result.length > 0) result.push('');
    if (curIsFence && !prevIsBlank && result.length > 0) result.push('');
    if (curIsHeading && !prevIsBlank && result.length > 0) result.push('');
    result.push(line);
    if (curIsHeading && i + 1 < lines.length) {
      const nextLine = lines[i + 1].replace(/[\s]+$/, '');
      if (nextLine.trim() !== '') result.push('');
    }
  }
  let out = result.join('\n');
  if (!out.endsWith('\n')) out += '\n';
  fs.writeFileSync(file, out);
  console.log('Fixed: ' + file + ' (' + result.length + ' lines)');
}
