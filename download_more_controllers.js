const fs = require('fs');
const path = require('path');
const targetDir = path.join(__dirname, 'images', 'ps5');

const moreImages = [
  { name: 'controller-white.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-white-screenshot-04-en-08dec21?$1600px--t$' },
  { name: 'controller-midnight-black.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-midnight-black-screenshot-01-en-08dec21?$1600px--t$' },
  { name: 'controller-cosmic-red.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-cosmic-red-screenshot-01-en-08dec21?$1600px--t$' },
  { name: 'controller-starlight-blue.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-starlight-blue-screenshot-01-en-30nov21?$1600px--t$' },
  { name: 'controller-galactic-purple.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-galactic-purple-screenshot-01-en-30nov21?$1600px--t$' },
  { name: 'controller-techno-red.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-techno-red-screenshot-01-en-07jan26?$1600px--t$' },
  { name: 'controller-remix-green.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-remix-green-screenshot-01-en-07jan26?$1600px--t$' },
  { name: 'controller-rhythm-blue.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-rhythm-blue-screenshot-01-en-07jan26?$1600px--t$' }
];

async function run() {
  for (const item of moreImages) {
    try {
      const res = await fetch(item.url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(path.join(targetDir, item.name), buf);
        console.log(`[OK] ${item.name} (${buf.length} bytes)`);
      } else {
        console.log(`[FAIL] ${item.name} status ${res.status}`);
      }
    } catch(e) {
      console.log(`[ERR] ${item.name} ${e.message}`);
    }
  }
}
run();
