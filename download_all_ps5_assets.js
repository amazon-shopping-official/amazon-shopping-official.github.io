const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'images', 'ps5');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const imagesToDownload = [
  // 1. PS5 Pro
  { name: 'ps5-pro-front.jpg', url: 'https://blog.playstation.com/tachyon/2024/09/ec940be2cf0740fd67c35af7a1bff97cdb6ecf26.jpg' },
  { name: 'ps5-pro-vertical-bundle.jpg', url: 'https://blog.playstation.com/tachyon/2024/09/9ae4d532324423584e5151313780c0348918b067.jpg' },
  { name: 'ps5-pro-side.jpg', url: 'https://blog.playstation.com/tachyon/2024/09/9dfc19873f8cd02922ce4c7e3cb38d229456b2da.jpg' },
  { name: 'ps5-pro-horizontal.jpg', url: 'https://blog.playstation.com/tachyon/2024/09/435a6548500a060a4b717e1ec70913c6db3fb547.jpg' },
  { name: 'ps5-pro-rear.jpg', url: 'https://blog.playstation.com/tachyon/2024/09/a53e4f9390533d7070704a70a9940df8cc329e6d.jpg' },
  { name: 'ps5-pro-hero.jpg', url: 'https://blog.playstation.com/tachyon/2024/09/16554ba2a0ada3fc7c2f05187300c4a3fb1966f1.jpg' },

  // 2. PS5 Slim & Original Consoles
  { name: 'ps5-slim-disc-box.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-disc-edition-box-image-block-01-en-02apr25?$1600px--t$' },
  { name: 'ps5-slim-digital-box.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-digital-edition-box-image-block-01-en-02apr25?$1600px--t$' },
  { name: 'ps5-consoles-family.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-all-consoles-range-image-block-02-en-07mar25$en-in?$1600px--t$' },
  { name: 'ps5-disc-console.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-buy-now-product-thumbnail-01-en-18mar22?$1600px--t$' },

  // 3. Console Covers / Colorways
  { name: 'cover-white.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-buy-now-product-thumbnail-01-en-18mar22?$1600px--t$' },
  { name: 'cover-midnight-black.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-midnight-black-screenshot-01-en-01dec21?$1600px--t$' },
  { name: 'cover-volcanic-red.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-covers-volcanic-red-screenshot-01-en-04sep23?$1600px--t$' },
  { name: 'cover-cobalt-blue.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-cobalt-blue-screenshot-01-en-04sep23?$1600px--t$' },
  { name: 'cover-sterling-silver.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-covers-sterling-silver-screenshot-01-en-04sep23?$1600px--t$' },
  { name: 'cover-chroma-teal.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-teal-screenshot-01-en-23sep24?$1600px--t$' },
  { name: 'cover-chroma-indigo.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-indigo-screenshot-01-en-23sep24?$1600px--t$' },
  { name: 'cover-chroma-pearl.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-pearl-screenshot-01-en-23sep24?$1600px--t$' },
  { name: 'cover-cosmic-red.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-crimson-red-screenshot-03-en-01dec21?$1600px--t$' },
  { name: 'cover-nova-pink.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-nova-pink-screenshot-03-en-01dec21?$1600px--t$' },
  { name: 'cover-starlight-blue.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-starlight-blue-screenshot-03-en-01dec21?$1600px--t$' },
  { name: 'cover-galactic-purple.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-galactic-purple-screenshot-01-en-25aug23?$1600px--t$' },
  { name: 'cover-gray-camouflage.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-gray-camo-screenshot-03-en-06sep22?$1600px--t$' },
  { name: 'covers-range-hero.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-console-cover-range-image-block-01-en-06jul26?$1600px--t$' },

  // 4. DualSense Controllers
  { name: 'controller-white.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-white-screenshot-01-en-08dec21?$1600px--t$' },
  { name: 'controller-midnight-black.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-midnight-black-screenshot-01-en-14sep21?$1600px--t$' },
  { name: 'controller-volcanic-red.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-volcanic-red-screenshot-01-en-04sep23?$1600px--t$' },
  { name: 'controller-cobalt-blue.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-cobalt-blue-screenshot-01-en-04sep23?$1600px--t$' },
  { name: 'controller-sterling-silver.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-sterling-silver-screenshot-01-en-04sep23?$1600px--t$' },
  { name: 'controller-chroma-teal.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-teal-screenshot-01-en-23sep24?$1600px--t$' },
  { name: 'controller-chroma-indigo.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-indigo-screenshot-01-en-23sep24?$1600px--t$' },
  { name: 'controller-chroma-pearl.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-pearl-screenshot-01-en-23sep24?$1600px--t$' },
  { name: 'controller-cosmic-red.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-cosmic-red-screenshot-01-en-14sep21?$1600px--t$' },
  { name: 'controller-nova-pink.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-nova-pink-screenshot-01-en-08dec21?$1600px--t$' },
  { name: 'controller-starlight-blue.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-starlight-blue-screenshot-01-en-08dec21?$1600px--t$' },
  { name: 'controller-galactic-purple.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-galactic-purple-screenshot-01-en-08dec21?$1600px--t$' },
  { name: 'controller-gray-camo.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-gray-camo-screenshot-01-en-13sep22?$1600px--t$' },
  { name: 'controller-edge.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-edge-midnight-image-block-01-en-16jan25?$1600px--t$' },
  { name: 'controllers-range-hero.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-dualsense-range-image-block-01-en-06jul26?$1600px--t$' },

  // 5. Audio & Headsets
  { name: 'pulse-elite-headset.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/PULSE-Elite-headset-image-block-04-en-08sep23?$1600px--t$' },
  { name: 'pulse-3d-headset.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-overview-headsets-image-block-01-en-09jul24?$1600px--t$' },
  { name: 'pulse-explore-earbuds.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/PULSE-Explore-earbuds-thumbnail-01-en-12sep23?$1600px--t$' },

  // 6. Other Accessories & Bundles
  { name: 'dualsense-charging-station.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-charging-station-image-block-03-en-22nov23?$1600px--t$' },
  { name: 'ps-portal.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps-portal-remote-player-keyart-01-en-18aug23?$1600px--t$' },
  { name: 'ps5-disc-drive.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/disc-drive-image-block-01-en-22nov23?$1600px--t$' },
  { name: 'ps5-vertical-stand.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-vertical-stand-image-block-01-en-22nov23?$1600px--t$' },
  { name: 'ps5-media-remote.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/media-remote-product-thumbnail-01-en-14sep21?$1600px--t$' },
  { name: 'ps-vr2.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps-vr2-overview-headset-and-controllers-image-block-01-en-04nov22?$1600px--t$' },
  { name: 'accessories-bundle-hero.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-overview-accessories-image-block-01-en-21jun24?$1600px--t$' },
  { name: 'ps5-logo-badge.png', url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-black-badge-01-en-11sep20?$1600px--t$' }
];

async function downloadAll() {
  console.log(`Starting download of ${imagesToDownload.length} official PlayStation assets...`);
  let successCount = 0;
  for (const item of imagesToDownload) {
    const dest = path.join(targetDir, item.name);
    try {
      const res = await fetch(item.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) {
        console.warn(`[FAIL] ${item.name} status ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      console.log(`[OK] ${item.name} (${buffer.length} bytes)`);
      successCount++;
    } catch (err) {
      console.error(`[ERR] ${item.name}:`, err.message);
    }
  }
  console.log(`\nCompleted: ${successCount} / ${imagesToDownload.length} downloaded successfully.`);
}

downloadAll();
