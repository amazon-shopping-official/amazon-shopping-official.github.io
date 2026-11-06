const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf8');

const ps5Card = `      <!-- Sony PlayStation 5 (PS5 & PS5 Pro) Card -->
      <a href="store/ps5/" class="store-card" style="border: 2px solid #00439c;">
        <span class="card-badge" style="background:#00439c;">⚡ Sony PlayStation 5 • Pro &amp; All Colours</span>
        <div class="card-img-wrap" style="background:#ffffff; border:1px solid #e7e7e7;">
          <img src="images/ps5/ps5-pro-front.jpg" alt="Sony PlayStation 5 Pro &amp; All Variants">
        </div>
        <h2 class="card-title">Sony PlayStation 5 (PS5 Pro, Slim Disc, Digital &amp; All Colours) - 2 TB / 1 TB Gaming Console</h2>
        <div class="card-stars">★★★★★ <span style="color:#007185; font-size:12px;">(12,480)</span></div>
        <div class="card-price"><sup>$</sup>449<sup>.99</sup> &ndash; <sup>$</sup>699<sup>.99</sup></div>
        <span class="card-btn" style="background:#00439c; color:#fff; border-color:#003580;">Open PS5 Console Store &rarr;</span>
      </a>\n\n`;

content = content.replace(/(<div class="cards-grid">\r?\n)/, '$1' + ps5Card);

fs.writeFileSync('index.html', content, 'utf8');
console.log('Successfully updated index.html');
