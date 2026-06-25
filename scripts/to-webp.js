const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '..', 'imgs');

(async () => {
  const files = fs.readdirSync(dir).filter(f => /\.jpe?g$/i.test(f));
  for (const file of files) {
    const input = path.join(dir, file);
    const output = path.join(dir, file.replace(/\.jpe?g$/i, '.webp'));
    await sharp(input).webp({ quality: 80 }).toFile(output);
    const inSize = fs.statSync(input).size;
    const outSize = fs.statSync(output).size;
    console.log(`${file} -> ${path.basename(output)}  ${(inSize/1024).toFixed(0)}KB -> ${(outSize/1024).toFixed(0)}KB`);
  }
})();
