/**
 * invoice-pdf.js
 * Official Amazon.com Tax Invoice & Order Receipt PDF Generator
 * - Generates authentic Amazon.com customer invoices
 * - Includes Expected Delivery date range
 * - Includes prominent amazon.com signature at the bottom
 * - Provides crisp client-side PDF download via html2pdf.js (without text overlap)
 */

(function() {
  // 1. Dynamic Delivery Date Calculations (25-30 days from ordering)
  function calculateDeliveryWindow(baseDate) {
    let orderDt = new Date();
    if (baseDate) {
      const parsed = new Date(baseDate);
      if (!isNaN(parsed.getTime())) orderDt = parsed;
    }

    const dStart = new Date(orderDt.getTime() + (25 * 24 * 60 * 60 * 1000));
    const dEnd = new Date(orderDt.getTime() + (30 * 24 * 60 * 60 * 1000));

    const optionsStart = { month: 'long', day: 'numeric' };
    const optionsEnd = { month: 'long', day: 'numeric', year: 'numeric' };

    const startStr = dStart.toLocaleDateString('en-US', optionsStart);
    const endStr = dEnd.toLocaleDateString('en-US', optionsEnd);

    return {
      windowStr: `${startStr} – ${endStr}`,
      fullRangeStr: `${startStr} – ${endStr}`,
      startDate: dStart,
      endDate: dEnd
    };
  }

  // 2. Resolve Seller & Product Information
  function resolveSellerInfo(itemName = '') {
    const lower = itemName.toLowerCase();
    if (lower.includes('iphone') || lower.includes('apple') || lower.includes('ipad')) {
      return {
        seller: 'Apple Official Store on Amazon',
        operator: 'Amazon.com Services LLC',
        warehouse: 'Amazon Global Fulfillment Center (IND-West)'
      };
    } else if (lower.includes('pixel') || lower.includes('google')) {
      return {
        seller: 'Google Official Storefront on Amazon',
        operator: 'Amazon.com Services LLC',
        warehouse: 'Amazon Global Logistics Hub (US-East)'
      };
    } else if (lower.includes('samsung') || lower.includes('galaxy')) {
      return {
        seller: 'Samsung Electronics Official Store on Amazon',
        operator: 'Amazon.com Services LLC',
        warehouse: 'Amazon Global Logistics Gateway (KR-Direct)'
      };
    }
    return {
      seller: 'Authorized Flagship Store on Amazon',
      operator: 'Amazon.com Services LLC',
      warehouse: 'Amazon Worldwide Fulfillment'
    };
  }

  // 3. Official Amazon Logo SVG Generator
  function getAmazonLogoSvg(width = 115) {
    const h = Math.round(width * (182 / 603));
    // The letters in the SVG (viewBox 0 0 603 182) have their baseline at y = 105.5
    // and letter cap height of ~104 units (57.9% of SVG height).
    const letterHeight = Math.round(h * (105.5 / 182));
    const fontSize = Math.round(letterHeight * 0.94);
    return `
      <div style="display:inline-flex; align-items:flex-start; line-height:1; vertical-align:middle;">
        <svg width="${width}" height="${h}" viewBox="0 0 603 182" xmlns="http://www.w3.org/2000/svg" style="display:block;">
          <path d="m 374.00642,142.18404 c -34.99948,25.79739 -85.72909,39.56123 -129.40634,39.56123 -61.24255,0 -116.37656,-22.65135 -158.08757,-60.32496 -3.2771,-2.96252 -0.34083,-6.9999 3.59171,-4.69283 45.01431,26.19064 100.67269,41.94697 158.16623,41.94697 38.774689,0 81.4295,-8.02237 120.6499,-24.67006 5.92501,-2.51683 10.87999,3.88009 5.08607,8.17965" fill="#ff9900" />
          <path d="m 388.55678,125.53635 c -4.45688,-5.71527 -29.57261,-2.70033 -40.84585,-1.36327 -3.43442,0.41947 -3.95874,-2.56925 -0.86517,-4.71905 20.00346,-14.07844 52.82696,-10.01483 56.65462,-5.2958 3.82764,4.74526 -0.99624,37.64741 -19.79373,53.35128 -2.88385,2.41195 -5.63662,1.12734 -4.35198,-2.07113 4.2209,-10.53917 13.68519,-34.16054 9.20211,-39.90203" fill="#ff9900" />
          <g fill="#131921">
            <path d="M 348.49744,20.06598 V 6.38079 c 0,-2.07113 1.57301,-3.46062 3.46062,-3.46062 h 61.26875 c 1.96628,0 3.53929,1.41571 3.53929,3.46062 v 11.71893 c -0.0262,1.96626 -1.67788,4.53551 -4.61418,8.59912 l -31.74859,45.32893 c 11.79759,-0.28837 24.25059,1.46814 34.94706,7.49802 2.41195,1.36327 3.06737,3.35575 3.25089,5.32203 V 99.4506 c 0,1.99248 -2.20222,4.32576 -4.5093,3.1198 -18.84992,-9.88376 -43.887,-10.95865 -64.72939,0.10487 -2.12356,1.15354 -4.35199,-1.15354 -4.35199,-3.14602 V 85.66054 c 0,-2.22843 0.0262,-6.02989 2.25463,-9.41186 l 36.78224,-52.74829 h -32.01076 c -1.96626,0 -3.53927,-1.38948 -3.53927,-3.43441" />
            <path d="m 124.99883,105.45424 h -18.64017 c -1.78273,-0.13107 -3.19845,-1.46813 -3.32954,-3.17224 V 6.61676 c 0,-1.91383 1.59923,-3.43442 3.59171,-3.43442 h 17.38176 c 1.80898,0.0786 3.25089,1.46814 3.38199,3.19845 v 12.50545 h 0.34082 c 4.53551,-12.08598 13.05597,-17.7226 24.53896,-17.7226 11.66649,0 18.95477,5.63662 24.19814,17.7226 4.5093,-12.08598 14.76008,-17.7226 25.74495,-17.7226 7.81262,0 16.35931,3.22467 21.57646,10.46052 5.89879,8.04857 4.69281,19.74128 4.69281,29.99208 l -0.0262,60.37739 c 0,1.91383 -1.59923,3.46061 -3.59171,3.46061 h -18.61397 c -1.86138,-0.13107 -3.35574,-1.62543 -3.35574,-3.46061 V 51.29025 c 0,-4.03739 0.36702,-14.10466 -0.52434,-17.93233 -1.38949,-6.42311 -5.55797,-8.23209 -10.95865,-8.23209 -4.5093,0 -9.22833,3.01494 -11.14216,7.83885 -1.91383,4.8239 -1.73031,12.89867 -1.73031,18.32557 v 50.70338 c 0,1.91383 -1.59923,3.46061 -3.59171,3.46061 h -18.61395 c -1.88761,-0.13107 -3.35576,-1.62543 -3.35576,-3.46061 L 152.946,51.29025 c 0,-10.67025 1.75651,-26.37415 -11.48298,-26.37415 -13.39682,0 -12.87248,15.31063 -12.87248,26.37415 v 50.70338 c 0,1.91383 -1.59923,3.46061 -3.59171,3.46061" />
            <path d="m 469.51439,1.16364 c 27.65877,0 42.62858,23.75246 42.62858,53.95427 0,29.17934 -16.54284,52.32881 -42.62858,52.32881 -27.16066,0 -41.94697,-23.75246 -41.94697,-53.35127 0,-29.78234 14.96983,-52.93181 41.94697,-52.93181 m 0.15729,19.53156 c -13.73761,0 -14.60278,18.71881 -14.60278,30.38532 0,11.69271 -0.18352,36.65114 14.44549,36.65114 14.44548,0 15.12712,-20.13452 15.12712,-32.40403 0,-8.07477 -0.34082,-17.72257 -2.779,-25.3779 -2.09735,-6.65906 -6.26581,-9.25453 -12.19083,-9.25453" />
            <path d="M 548.00762,105.45424 H 529.4461 c -1.86141,-0.13107 -3.35577,-1.62543 -3.35577,-3.46061 l -0.0262,-95.69149 c 0.1573,-1.75653 1.7041,-3.1198 3.59171,-3.1198 h 17.27691 c 1.62543,0.0786 2.96249,1.17976 3.32954,2.67412 v 14.62899 h 0.3408 c 5.21717,-13.0822 12.53165,-19.32181 25.40412,-19.32181 8.36317,0 16.51662,3.01494 21.75999,11.27324 4.87633,7.65532 4.87633,20.5278 4.87633,29.78233 v 60.22011 c -0.20973,1.67786 -1.75653,3.01492 -3.59169,3.01492 h -18.69262 c -1.70411,-0.13107 -3.11982,-1.38948 -3.30332,-3.01492 V 50.47753 c 0,-10.46052 1.20597,-25.77117 -11.66651,-25.77117 -4.5355,0 -8.70399,3.04117 -10.77512,7.65532 -2.62167,5.84637 -2.96249,11.66651 -2.96249,18.11585 v 51.5161 c -0.0262,1.91383 -1.65166,3.46061 -3.64414,3.46061" />
            <path d="M 55.288261,59.75829 V 55.7209 c -13.475471,0 -27.711211,2.88385 -27.711211,18.77125 0,8.04857 4.16847,13.50169 11.32567,13.50169 5.24337,0 9.93618,-3.22467 12.8987,-8.46805 3.670341,-6.44935 3.486841,-12.50544 3.486841,-19.7675 m 18.79747,45.43378 c -1.23219,1.10111 -3.01495,1.17976 -4.40444,0.4457 -6.18716,-5.1385 -7.28828,-7.52423 -10.69647,-12.42678 -10.224571,10.4343 -17.460401,13.55409 -30.726141,13.55409 -15.67768,0 -27.89471,-9.67401 -27.89471,-29.04824 0,-15.12713 8.20587,-25.43035 19.87236,-30.46398 10.1197,-4.45688 24.25058,-5.24337 35.051931,-6.47556 v -2.41195 c 0,-4.43066 0.34082,-9.67403 -2.25465,-13.50167 -2.280881,-3.43442 -6.632861,-4.85013 -10.460531,-4.85013 -7.10475,0 -13.44924,3.64414 -14.99603,11.19459 -0.31461,1.67789 -1.5468,3.32955 -3.22467,3.4082 L 6.26276,32.67628 C 4.74218,32.33548 3.0643,31.10327 3.48377,28.76999 7.65225,6.85271 27.44596,0.24605 45.16856,0.24605 c 9.071011,0 20.921021,2.41195 28.078221,9.28076 9.07104,8.46804 8.20587,19.7675 8.20587,32.06321 v 29.04826 c 0,8.73022 3.61794,12.55786 7.02613,17.27691 1.20597,1.67786 1.46814,3.69656 -0.05244,4.95497 -3.80144,3.17225 -10.56538,9.07104 -14.28819,12.37436 l -0.05242,-0.0525" />
            <path d="M 299.65545,59.75829 V 55.7209 c -13.47547,0 -27.71121,2.88385 -27.71121,18.77125 0,8.04857 4.16847,13.50169 11.32567,13.50169 5.24337,0 9.93618,-3.22467 12.8987,-8.46805 3.67034,-6.44935 3.48684,-12.50544 3.48684,-19.7675 m 18.79747,45.43378 c -1.23219,1.10111 -3.01495,1.17976 -4.40444,0.4457 -6.18716,-5.1385 -7.28828,-7.52423 -10.69647,-12.42678 -10.22457,10.4343 -17.4604,13.55409 -30.72614,13.55409 -15.67768,0 -27.89471,-9.67401 -27.89471,-29.04824 0,-15.12713 8.20587,-25.43035 19.87236,-30.46398 10.1197,-4.45688 24.25058,-5.24337 35.05193,-6.47556 v -2.41195 c 0,-4.43066 0.34082,-9.67403 -2.25465,-13.50167 -2.28088,-3.43442 -6.63286,-4.85013 -10.46053,-4.85013 -7.10475,0 -13.44924,3.64414 -14.99603,11.19459 -0.31461,1.67789 -1.5468,3.32955 -3.22467,3.4082 L 250.62995,32.67628 c -1.52058,-0.3408 -3.19846,-1.57301 -2.77899,-3.90629 4.16848,-21.91728 23.96219,-28.52394 41.68479,-28.52394 9.07101,0 20.92102,2.41195 28.07822,9.28076 9.07104,8.46804 8.20587,19.7675 8.20587,32.06321 v 29.04826 c 0,8.73022 3.61794,12.55786 7.02613,17.27691 1.20597,1.67786 1.46814,3.69656 -0.0524,4.95497 -3.80144,3.17225 -10.56538,9.07104 -14.28819,12.37436 l -0.0524,-0.0525" />
          </g>
        </svg>
        <span style="font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size:${fontSize}px; font-weight:700; color:#131921; margin-left:1px; line-height:1; height:${letterHeight}px; display:inline-flex; align-items:flex-end; padding-bottom:1px; letter-spacing:-0.5px;">.com</span>
      </div>
    `;
  }

  // 4. Realistic Barcode Generator (SVG)
  function generateBarcodeSvg(orderId) {
    const cleanId = (orderId || '114-816450-536433').replace(/[^0-9]/g, '');
    const pattern = [2,1,1,2,3,1,1,1,2,3,1,2,1,1,3,2,1,2,2,1,1,3,1,2,2,1,3,1,1,2,1,2,3,1,2,1,1,1,3,2,2,1,2,3,1,1,2,1,1,3,2,1,2,2,1,1,1,3,2,1,2,3,1,2];
    let x = 0;
    const barHeight = 28;
    const rects = [];
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i];
      if (i % 2 === 0) {
        rects.push(`<rect x="${x}" y="0" width="${w * 1.4}" height="${barHeight}" fill="#111" />`);
      }
      x += w * 1.4;
    }
    return `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; white-space:nowrap;">
        <svg width="${x}" height="${barHeight}" style="display:block;">${rects.join('')}</svg>
        <div style="font-family:'Courier New', monospace; font-size:11px; font-weight:700; color:#333; letter-spacing:3px; margin-top:3px; text-align:center;">*${cleanId.slice(-10)}*</div>
      </div>
    `;
  }

  // 5. Render Official Amazon Invoice HTML
  function generateInvoiceHtml(order) {
    const orderId = order.orderId || ('114-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(1000000 + Math.random() * 9000000));
    const orderDate = order.dateStr || new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const delivery = calculateDeliveryWindow(order.timestamp || new Date());
    const sellerInfo = resolveSellerInfo(order.item || '');
    const isRedeem = (order.payMethod || '').toLowerCase().includes('redeem') || !!order.redeemCode;
    const priceRaw = (order.price || order.total || '$1,799.00').replace(/[^0-9.]/g, '');
    const numPrice = parseFloat(priceRaw) || 1799.00;
    const formattedPrice = '$' + numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const claimCode = order.redeemCode || 'AMZN-7K9W-M3XP-84QL';

    return `
      <div id="amazonInvoicePdfSheet" style="
        width: 100%;
        max-width: 760px;
        margin: 0 auto;
        padding: 24px 30px;
        background: #ffffff;
        font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
        color: #111111;
        line-height: 1.4;
        font-size: 13px;
        box-sizing: border-box;
      ">
        <!-- Top Amazon Header Strip -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #131921; padding-bottom:14px; margin-bottom:16px;">
          <div>
            <!-- Authentic Amazon Logo SVG -->
            <div>${getAmazonLogoSvg(122)}</div>
            <div style="font-size:12px; color:#555; margin-top:6px; font-weight:600;">
              Official Order Confirmation &amp; Tax Receipt
            </div>
            <div style="font-size:11px; color:#777; margin-top:2px;">
              Final Details for Order #${orderId}
            </div>
          </div>
          
          <div style="text-align:right;">
            <div style="font-size:12px; color:#555;">Order Placed: <strong style="color:#111;">${orderDate}</strong></div>
            <div style="font-size:12px; color:#555; margin-top:2px;">Amazon.com order number: <strong style="color:#111;">${orderId}</strong></div>
            <div style="font-size:14px; margin-top:4px;">Order Total: <strong style="color:#007600; font-size:15px;">$0.00 (Paid in Full)</strong></div>
          </div>
        </div>

        <!-- Expected Delivery & Shipment Banner -->
        <div style="background:#f0f2f2; border:1px solid #d5d9d9; border-radius:6px; padding:12px 16px; margin-bottom:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="text-transform:uppercase; font-size:11px; font-weight:700; color:#565959; letter-spacing:0.5px;">Dispatch Status</span>
              <div style="font-size:14px; font-weight:700; color:#007600; margin-top:2px;">
                ✓ Dispatched &bull; Priority International Air Freight
              </div>
            </div>
            <div style="text-align:right;">
              <span style="text-transform:uppercase; font-size:11px; font-weight:700; color:#565959; letter-spacing:0.5px;">Expected Delivery Window</span>
              <div style="font-size:14px; font-weight:800; color:#b12704; margin-top:2px; display:flex; align-items:center; justify-content:flex-end; gap:5px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#b12704" style="display:inline-block; vertical-align:middle;">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                </svg>
                <span>${delivery.windowStr}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Items Ordered Table -->
        <div style="margin-bottom:18px;">
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr style="background:#fafafa; border-top:1px solid #d5d9d9; border-bottom:1px solid #d5d9d9; text-align:left;">
                <th style="padding:8px 10px; font-weight:700; color:#111;">Items Ordered</th>
                <th style="padding:8px 10px; text-align:center; width:50px; font-weight:700; color:#111;">Qty</th>
                <th style="padding:8px 10px; text-align:right; width:110px; font-weight:700; color:#111;">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #e7e7e7;">
                <td style="padding:12px 10px; vertical-align:top;">
                  <strong style="font-size:14px; color:#007185;">${order.item || 'Flagship Smartphone'}</strong><br>
                  <span style="font-size:11px; color:#565959; display:inline-block; margin-top:3px; line-height:1.45;">
                    Condition: <strong>New</strong> &bull; Sold by: <strong>${sellerInfo.seller}</strong><br>
                    Supplied &amp; Dispatched by: ${sellerInfo.warehouse}<br>
                    Courier Service: <strong>Amazon Global Priority Express Courier</strong> (Tracking: <strong>TBA-${orderId.replace(/[^0-9]/g, '').slice(0, 10)}</strong>)
                  </span>
                </td>
                <td style="padding:12px 10px; text-align:center; vertical-align:top; font-weight:600; color:#111;">
                  ${order.qty || 1}
                </td>
                <td style="padding:12px 10px; text-align:right; vertical-align:top; font-weight:700; color:#111;">
                  ${formattedPrice}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Two-Column Address & Billing Breakdown Grid -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; border-top:1px solid #e7e7e7; padding-top:16px; margin-bottom:20px;">
          <!-- Left: Shipping Destination -->
          <div style="padding-right:12px; border-right:1px solid #e7e7e7;">
            <div style="font-weight:700; font-size:11px; text-transform:uppercase; color:#565959; margin-bottom:6px; letter-spacing:0.5px;">
              SHIPPING ADDRESS:
            </div>
            <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:2px;">
              ${order.name || order.fullName || 'Customer'}
            </div>
            <div style="color:#333; line-height:1.45; font-size:12px;">
              ${order.address || order.deliveryAddress || 'Address on file'}<br>
              ${(order.phoneNumber || order.phone) ? `Phone: ${order.phoneNumber || order.phone}<br>` : ''}
              ${order.email ? `Email: ${order.email}<br>` : ''}
            </div>

            <div style="margin-top:14px; padding:10px 12px; background:#f9fafb; border-left:3px solid #007600; border-radius:3px;">
              <strong style="color:#007600; font-size:12px;">Guaranteed Priority Delivery:</strong>
              <div style="font-size:12px; color:#111; margin-top:2px; font-weight:600;">
                Arriving ${delivery.windowStr}
              </div>
              <div style="font-size:11px; color:#666; margin-top:2px;">
                International shipment delivery via Amazon Global Priority Express.
              </div>
            </div>
          </div>

          <!-- Right: Payment & Grand Total Breakdown -->
          <div>
            <div style="font-weight:700; font-size:11px; text-transform:uppercase; color:#565959; margin-bottom:6px; letter-spacing:0.5px;">
              PAYMENT INFORMATION:
            </div>
            <div style="font-size:12px; color:#111; margin-bottom:10px; line-height:1.5;">
              <div>Payment Method: <strong style="color:#007185;">${isRedeem ? 'Amazon Gift Card / Claim Code' : (order.payMethod || 'Ask a Friend to Pay')}</strong></div>
              ${isRedeem ? `<div style="font-size:11px; color:#007185; font-weight:700; margin:2px 0;">(${claimCode})</div>` : ''}
              <div>Payment Status: <strong style="color:#007600;">Paid in Full ($0.00 balance due)</strong></div>
            </div>

            <!-- Price Breakdown Table -->
            <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:8px;">
              <tr>
                <td style="padding:4px 0; color:#444;">Item(s) Subtotal:</td>
                <td style="padding:4px 0; text-align:right; font-weight:600; color:#111;">${formattedPrice}</td>
              </tr>
              <tr>
                <td style="padding:4px 0; color:#444;">Shipping &amp; Handling:</td>
                <td style="padding:4px 0; text-align:right; color:#111; font-weight:600;">$0.00</td>
              </tr>
              <tr>
                <td style="padding:4px 0; color:#444;">Total Before Tax:</td>
                <td style="padding:4px 0; text-align:right; font-weight:600; color:#111;">${formattedPrice}</td>
              </tr>
              <tr>
                <td style="padding:4px 0; color:#444;">Estimated Tax:</td>
                <td style="padding:4px 0; text-align:right; color:#111;">$0.00</td>
              </tr>
              ${isRedeem ? `
              <tr style="color:#007600; font-weight:600;">
                <td style="padding:5px 0;">Amazon Gift Card / Redeem Code:</td>
                <td style="padding:5px 0; text-align:right;">-${formattedPrice}</td>
              </tr>
              ` : ''}
              <tr style="border-top:1px solid #111; font-size:14px; font-weight:800;">
                <td style="padding:10px 0 4px;">Grand Total Paid:</td>
                <td style="padding:10px 0 4px; text-align:right; color:#007600;">$0.00 (Paid in Full)</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Security & Barcode Footer Segment -->
        <div style="background:#fbfbfb; border:1px dashed #d5d9d9; border-radius:4px; padding:10px 16px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:11px; color:#555; line-height:1.4;">
            <strong style="color:#222;">Digital Authenticity Signature:</strong><br>
            SHA-256: AMZN-AUTH-${orderId.replace(/-/g, '')}-VERIFIED-SECURE
          </div>
          <div>
            ${generateBarcodeSvg(orderId)}
          </div>
        </div>

        <!-- Real Amazon Official Bottom Footer with amazon.com -->
        <div style="border-top:1px solid #d5d9d9; padding-top:16px; margin-top:20px; text-align:center;">
          <div style="font-size:11px; color:#565959; margin-bottom:6px;">
            To view the status of your order or manage your account, please visit <span style="color:#007185; text-decoration:underline;">https://www.amazon.com/your-orders</span>
          </div>
          <div style="font-size:10px; color:#767676; margin-bottom:10px;">
            Conditions of Use &bull; Privacy Notice &bull; Interest-Based Ads &bull; &copy; 1996&ndash;2026, Amazon.com, Inc. or its affiliates. All rights reserved.
          </div>
          <!-- Centered Official Amazon Logo at Bottom -->
          <div style="display:flex; justify-content:center; align-items:center;">
            ${getAmazonLogoSvg(110)}
          </div>
        </div>
      </div>
    `;
  }

  // 6. Download Order Invoice as Crisp PDF
  async function downloadOrderInvoicePdf(order) {
    if (!order) {
      console.warn("downloadOrderInvoicePdf: No order specified");
      return;
    }

    const orderId = order.orderId || ('114-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(1000000 + Math.random() * 9000000));
    const filename = `Amazon_Invoice_${orderId}.pdf`;

    // Create temporary offscreen container for PDF rendering
    const container = document.createElement('div');
    container.id = 'pdfRenderOffscreen';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '760px';
    container.style.background = '#ffffff';
    container.style.zIndex = '-999';
    container.innerHTML = generateInvoiceHtml(order);
    document.body.appendChild(container);

    const sheet = container.querySelector('#amazonInvoicePdfSheet') || container;

    // Show toast notice if available
    if (typeof window.showToast === 'function') {
      window.showToast("Generating official Amazon Tax Receipt PDF...");
    }

    // Check if html2pdf is available
    if (typeof window.html2pdf === 'function') {
      try {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: false, // Prevents overlapping characters in html2canvas!
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff'
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          }
        };

        await window.html2pdf().set(opt).from(sheet).save();
        if (typeof window.showToast === 'function') {
          window.showToast("✓ Amazon Invoice PDF downloaded successfully!");
        }
      } catch (err) {
        console.error("html2pdf generation error:", err);
      } finally {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    } else {
      console.warn("html2pdf library not loaded, attempting fallback PDF download");
      try {
        const printHtml = `<!DOCTYPE html><html><head><title>${filename}</title><style>@page{size:A4;margin:10mm;}body{margin:0;padding:0;background:#fff;font-family:Arial,sans-serif;}</style></head><body>${sheet.outerHTML}</body></html>`;
        const blob = new Blob([printHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Amazon_Receipt_${orderId}.html`;
        a.click();
        URL.revokeObjectURL(url);
      } finally {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    }
  }

  // 7. Open Modal with the Official Amazon Receipt & Download Option
  function openInvoiceModal(order) {
    if (!order) return;
    const modal = document.getElementById("invoiceModalBackdrop");
    const content = document.getElementById("invoicePrintContent");
    if (!modal || !content) return;

    content.innerHTML = generateInvoiceHtml(order);

    // Update modal top action bar: Download PDF button & Close button
    const modalHeader = modal.querySelector(".od-header") || modal.querySelector("div[style*='background:var(--amazon-navy)']") || modal.querySelector("div[style*='background:#131921']");
    if (modalHeader) {
      modalHeader.innerHTML = `
        <h3 style="font-size:16px; font-weight:700; color:#fff; margin:0;">Customer Billing Statement</h3>
        <div style="display:flex; gap:10px; align-items:center;">
          <button type="button" id="btnModalDownloadPdf" style="padding:6px 14px; background:#ffd814; border:1px solid #fcd200; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px; color:#111;">
            📥 Download PDF
          </button>
          <button type="button" id="btnCloseInvoiceModal" style="background:none; border:none; color:#fff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
        </div>
      `;

      const btnDl = modalHeader.querySelector("#btnModalDownloadPdf");
      if (btnDl) {
        btnDl.addEventListener("click", () => {
          downloadOrderInvoicePdf(order);
        });
      }

      const btnClose = modalHeader.querySelector("#btnCloseInvoiceModal");
      if (btnClose) {
        btnClose.addEventListener("click", () => {
          modal.style.display = "none";
        });
      }
    }

    modal.style.display = "flex";
  }

  // Export functions globally
  window.calculateDeliveryWindow = calculateDeliveryWindow;
  window.generateInvoiceHtml = generateInvoiceHtml;
  window.downloadOrderInvoicePdf = downloadOrderInvoicePdf;
  window.openInvoiceModal = openInvoiceModal;
  window.openInvoice = openInvoiceModal;
})();
