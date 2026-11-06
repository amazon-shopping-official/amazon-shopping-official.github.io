const fs = require('fs');

const files = ['ps5_page.html', 'page_2.html', 'page_3.html', 'page_4.html'];
const allFound = {};

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf8');
  const imgRegex = /https:\/\/gmedia\.playstation\.com\/is\/image\/SIEPDC\/[a-zA-Z0-9_\-\$]+/gi;
  let m;
  while ((m = imgRegex.exec(content)) !== null) {
    const clean = m[0].split('?')[0];
    if (!allFound[clean]) {
      allFound[clean] = [];
    }
    allFound[clean].push(f);
  }
});

const list = Object.keys(allFound);
console.log('Total unique image keys found across all pages:', list.length);
fs.writeFileSync('all_playstation_images.json', JSON.stringify(list, null, 2));

console.log('\n--- KEY ACCESSORIES & CONSOLES ---');
list.filter(k => 
  k.includes('pro') || 
  k.includes('console') || 
  k.includes('cover') || 
  k.includes('color') || 
  k.includes('dualsense') || 
  k.includes('pulse') || 
  k.includes('portal') || 
  k.includes('vr') || 
  k.includes('chroma') ||
  k.includes('deep-earth') ||
  k.includes('midnight') ||
  k.includes('edge') ||
  k.includes('headset')
).forEach(k => console.log(k));
