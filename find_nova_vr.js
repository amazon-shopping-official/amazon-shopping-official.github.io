const fs = require('fs');
const imgs = JSON.parse(fs.readFileSync('all_playstation_images.json', 'utf8'));

console.log('Nova & VR:');
imgs.filter(i => i.includes('nova') || i.includes('vr')).forEach(i => console.log(i));
