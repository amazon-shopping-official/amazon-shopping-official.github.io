const fs = require('fs');
let code = fs.readFileSync('orders/orders.js', 'utf8');

// Replace the nested ternary with clean readable logic
const oldBlockRegex = /let image = isPS5[\s\S]*?let brand = isPS5[\s\S]*?;\n/m;

const newBlock = `let image = '../images/ps5/ps5-pro-front.jpg';
  let storeUrl = '../store/ps5/';
  let brand = 'Sony PlayStation';

  if (isUrbanGold) {
    image = '../images/urbangold/necklace-1.jpg';
    storeUrl = '../store/urbangold/';
    brand = 'UrbanGold Luxury';
  } else if (isStreamer) {
    image = '../images/streamercombo/k1-soundcard.jpg';
    storeUrl = '../store/streamercombo/';
    brand = 'Pro Audio Studio';
  } else if (isMacbook) {
    image = '../images/macbook/macbook-pro-16-space-black.jpg';
    storeUrl = '../store/macbookpro16/';
    brand = 'Apple';
  } else if (isIpad) {
    image = '../images/ipad/ipad-pro-m5-space-black.jpg';
    storeUrl = '../store/ipadprom5/';
    brand = 'Apple';
  } else if (isSamsung) {
    image = '../images/samsung/s26ultra-titanium-black.jpg';
    storeUrl = '../store/samsungs26ultra/';
    brand = 'Samsung';
  } else if (isPixel) {
    image = '../images/pixel/pixel11-canyon.jpg';
    storeUrl = '../store/pixel11proxl/';
    brand = 'Google';
  } else if (isIphone18) {
    image = '../images/iphone18/iphone18-burgundy.jpg';
    storeUrl = '../store/iphone18promax/';
    brand = 'Apple';
  } else if (isPS5) {
    image = '../images/ps5/ps5-pro-front.jpg';
    storeUrl = '../store/ps5/';
    brand = 'Sony PlayStation';
  } else {
    image = '../images/iphone/iphone17-cosmic-orange.jpg';
    storeUrl = '../store/iphone17promax/';
    brand = 'Apple';
  }
`;

code = code.replace(oldBlockRegex, newBlock);
fs.writeFileSync('orders/orders.js', code, 'utf8');
console.log('Cleaned up orders/orders.js logic');
