const fs = require('fs');
const html = fs.readFileSync('ps5_page.html', 'utf8');

// Find all headings and links
const titles = html.match(/<(?:h1|h2|h3|h4)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|h4)>/gi) || [];
console.log('Headings found:');
titles.forEach(t => console.log(t.replace(/<[^>]+>/g, '').trim()));

console.log('\nSearch for "Pro":');
const proMatches = html.match(/.{0,50}PS5 Pro.{0,50}/gi) || [];
proMatches.slice(0, 10).forEach(m => console.log(m.replace(/\s+/g, ' ')));

console.log('\nSearch for links:');
const linkRegex = /href="([^"]+)"/gi;
let lMatch;
const links = new Set();
while ((lMatch = linkRegex.exec(html)) !== null) {
  if (lMatch[1].includes('ps5') || lMatch[1].includes('accessories') || lMatch[1].includes('pro')) {
    links.add(lMatch[1]);
  }
}
Array.from(links).forEach(l => console.log(l));
