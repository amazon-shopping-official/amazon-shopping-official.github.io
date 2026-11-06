const fs = require('fs');
const content = fs.readFileSync('ps5_pro_blog.html', 'utf8');

const regex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
let m;
while ((m = regex.exec(content)) !== null) {
  const fullTag = m[0];
  const src = m[1];
  const alt = (fullTag.match(/alt="([^"]*)"/) || [])[1] || '';
  if (src.includes('tachyon/2024/09') || src.includes('ps5') || alt.toLowerCase().includes('ps5') || alt.toLowerCase().includes('pro')) {
    console.log(`SRC: ${src}`);
    console.log(`ALT: ${alt}\n`);
  }
}
