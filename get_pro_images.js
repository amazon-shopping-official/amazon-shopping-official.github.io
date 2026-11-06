const fs = require('fs');
const content = fs.readFileSync('ps5_pro_blog.html', 'utf8');

const regex = /https:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|webp)/gi;
let m;
const matches = new Set();
while ((m = regex.exec(content)) !== null) {
  matches.add(m[0]);
}

console.log('Images in PS5 Pro Blog:', matches.size);
Array.from(matches).forEach(u => console.log(u));
