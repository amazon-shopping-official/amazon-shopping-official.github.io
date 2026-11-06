const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'index.html',
  'ps5.html',
  'ps5-app.js',
  'store/ps5/index.html',
  'store/ps5/orders.json',
  'store/ps5/order.json',
  'images/ps5/ps5-pro-front.jpg',
  'images/ps5/ps5-pro-hero.jpg',
  'images/ps5/ps5-slim-disc-box.png',
  'images/ps5/ps5-slim-digital-box.png',
  'images/ps5/ps5-disc-console.png',
  'images/ps5/cover-white.png',
  'images/ps5/cover-midnight-black.png',
  'images/ps5/cover-chroma-teal.png',
  'images/ps5/cover-chroma-indigo.png',
  'images/ps5/cover-chroma-pearl.png',
  'images/ps5/cover-volcanic-red.png',
  'images/ps5/cover-cobalt-blue.png',
  'images/ps5/cover-sterling-silver.png',
  'images/ps5/cover-cosmic-red.png',
  'images/ps5/cover-nova-pink.png',
  'images/ps5/cover-starlight-blue.png',
  'images/ps5/cover-galactic-purple.png',
  'images/ps5/cover-gray-camouflage.png',
  'images/ps5/controller-white.png',
  'images/ps5/controller-midnight-black.png',
  'images/ps5/controller-chroma-teal.png',
  'images/ps5/controller-volcanic-red.png',
  'images/ps5/controller-cobalt-blue.png',
  'images/ps5/controller-sterling-silver.png',
  'images/ps5/controller-gray-camo.png',
  'images/ps5/pulse-elite-headset.png',
  'images/ps5/ps-portal.png',
  'images/ps5/dualsense-charging-station.png',
  'images/ps5/ps5-vertical-stand.png',
  'images/ps5/ps5-media-remote.png'
];

let allExist = true;
requiredFiles.forEach(f => {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) {
    console.error(`[MISSING] ${f}`);
    allExist = false;
  } else {
    const size = fs.statSync(p).size;
    if (size === 0 && !f.endsWith('.json')) {
      console.error(`[EMPTY] ${f}`);
      allExist = false;
    }
  }
});

if (allExist) {
  console.log(`All ${requiredFiles.length} critical files and assets exist and are verified!`);
} else {
  process.exit(1);
}
