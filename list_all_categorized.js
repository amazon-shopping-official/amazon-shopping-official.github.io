const fs = require('fs');
const imgs = JSON.parse(fs.readFileSync('all_playstation_images.json', 'utf8'));

console.log('--- CONSOLE COVERS / COLOURS ---');
imgs.filter(i => i.includes('cover')).forEach(i => console.log(i));

console.log('\n--- CONSOLES ---');
imgs.filter(i => i.includes('console')).forEach(i => console.log(i));

console.log('\n--- HEADSETS & AUDIO ---');
imgs.filter(i => i.includes('headset') || i.includes('pulse') || i.includes('audio')).forEach(i => console.log(i));

console.log('\n--- ACCESSORIES & PORTAL ---');
imgs.filter(i => i.includes('portal') || i.includes('station') || i.includes('remote') || i.includes('camera') || i.includes('vr') || i.includes('access')).forEach(i => console.log(i));
