const fs = require('fs');
const imgs = JSON.parse(fs.readFileSync('all_playstation_images.json', 'utf8'));

console.log('Dualsense controllers:');
imgs.filter(i => i.includes('dualsense-white') || i.includes('dualsense-midnight') || i.includes('dualsense-cosmic') || i.includes('dualsense-nova') || i.includes('dualsense-starlight') || i.includes('dualsense-galactic') || i.includes('vr2')).forEach(i => console.log(i));
