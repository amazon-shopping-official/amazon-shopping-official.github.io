const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const userDataDir = path.join(__dirname, '.chrome_profile');
const targetUrl = "file:///" + path.join(__dirname, "store", "ps5", "index.html").replace(/\\/g, '/');

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('1. Starting Headless Chrome with Remote Debugging...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,1024',
    targetUrl
  ], { detached: false });

  // Wait for remote debugging endpoint to become ready
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      const res = await fetch('http://127.0.0.1:9222/json');
      if (res.ok) {
        const list = await res.json();
        if (list && list.length && list[0].webSocketDebuggerUrl) {
          wsUrl = list[0].webSocketDebuggerUrl;
          console.log('2. Connected to Chrome Debugger WebSocket:', wsUrl);
          break;
        }
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome debugging port.');
    chromeProc.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pending = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  console.log('3. WebSocket open. Enabling Page and Runtime...');

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  // Wait for DOM to settle
  await sleep(1000);

  console.log('4. Executing DOM Interaction: Selecting Chroma Teal and clicking Buy Now...');
  const step1Result = await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        // Click Chroma Teal swatch
        const tealBtn = document.querySelector('[data-color="Chroma Teal"]');
        if (tealBtn) tealBtn.click();
        
        // Click Buy Now
        const btnBuyNow = document.getElementById('btnBuyNow');
        if (!btnBuyNow) return { error: 'btnBuyNow not found' };
        btnBuyNow.click();

        return {
          title: document.getElementById('productTitle').textContent,
          colorText: document.getElementById('currentColorText').textContent,
          sidePrice: document.getElementById('sidePrice').textContent,
          modalDisplay: document.getElementById('checkoutModal').style.display
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Step 1 (Select & Open Checkout):', step1Result.result.value);

  await sleep(600);

  console.log('5. Executing DOM Interaction: Submitting Address Form & Applying Redeem Code...');
  const step2Result = await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        // Fill Address Form
        document.getElementById('inputFullName').value = 'John Doe (Live DOM Test)';
        document.getElementById('inputAddress').value = '2200 Sony PlayStation Way';
        document.getElementById('inputCity').value = 'San Mateo';
        document.getElementById('inputPostal').value = '94404';
        document.getElementById('inputPhone').value = '+1 (800) 345-7669';
        document.getElementById('inputEmail').value = 'johndoe.playstation@gmail.com';

        // Submit address
        document.getElementById('formAddress').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));

        // Apply Redeem Code
        const codeInput = document.getElementById('inputRedeemCode');
        codeInput.value = 'PS5-PRO-8K9V-3M7X-4W2L';
        document.getElementById('btnApplyRedeemCode').click();

        // Continue to Review
        document.getElementById('btnContinueToReview').click();

        return {
          addressSummary: document.getElementById('stepAddressSummary').textContent.trim().replace(/\\s+/g, ' '),
          redeemCode: codeInput.value,
          redeemMsg: document.getElementById('redeemStatusMsg').textContent.trim(),
          orderTotalInSummary: document.getElementById('csTotalPrice').textContent.trim()
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Step 2 (Address & Redeem Code):', step2Result.result.value);

  await sleep(600);

  console.log('6. Executing DOM Interaction: Placing Order in the DOM...');
  const step3Result = await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        const btnPlace = document.getElementById('btnFinalPlaceOrder');
        if (!btnPlace) return { error: 'btnFinalPlaceOrder not found' };
        btnPlace.click();
        return { clicked: true };
      })()
    `,
    returnByValue: true
  });

  // Wait for confirmation screen and state persistence
  await sleep(2000);

  console.log('7. Reading Order Confirmation Screen from the DOM...');
  const confResult = await sendCommand('Runtime.evaluate', {
    expression: `
      (function() {
        return {
          orderId: document.getElementById('confDisplayOrderId') ? document.getElementById('confDisplayOrderId').textContent : 'N/A',
          orderDate: document.getElementById('confOrderDate') ? document.getElementById('confOrderDate').textContent : 'N/A',
          deliveryWindow: document.getElementById('confDeliveryWindow') ? document.getElementById('confDeliveryWindow').textContent : 'N/A',
          itemTitle: document.getElementById('confItemTitle') ? document.getElementById('confItemTitle').textContent : 'N/A',
          shipName: document.getElementById('confShipName') ? document.getElementById('confShipName').textContent : 'N/A',
          shipAddress: document.getElementById('confShipAddress') ? document.getElementById('confShipAddress').textContent : 'N/A',
          totalPaid: document.getElementById('confTotal') ? document.getElementById('confTotal').textContent : 'N/A',
          redeemAlertVisible: document.getElementById('confRedeemNoticeBox') ? document.getElementById('confRedeemNoticeBox').style.display : 'none',
          confScreenVisible: document.getElementById('orderConfirmationScreen') ? document.getElementById('orderConfirmationScreen').style.display : 'none',
          lastOrderInLocalStorage: localStorage.getItem('ps5_last_order')
        };
      })()
    `,
    returnByValue: true
  });

  console.log('\n======================================================');
  console.log('🎉 LIVE DOM ORDER PLACEMENT RESULTS:');
  console.log('======================================================');
  const details = confResult.result.value;
  console.log(`Order ID:            ${details.orderId}`);
  console.log(`Order Placed:        ${details.orderDate}`);
  console.log(`Estimated Delivery:  ${details.deliveryWindow}`);
  console.log(`Item Ordered:        ${details.itemTitle}`);
  console.log(`Recipient:           ${details.shipName}`);
  console.log(`Shipping Address:    ${details.shipAddress}`);
  console.log(`Total Paid:          ${details.totalPaid}`);
  console.log(`Redeem Box Display:  ${details.redeemAlertVisible}`);
  console.log(`Confirmation Screen: ${details.confScreenVisible}`);

  console.log('\n8. Capturing Screenshot of the Live Placed Order DOM...');
  const screenshotResult = await sendCommand('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false
  });

  if (screenshotResult && screenshotResult.data) {
    const screenshotPath = path.join(__dirname, 'ps5_order_dom_confirmation.png');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshotResult.data, 'base64'));
    console.log(`✓ Screenshot saved to: ${screenshotPath} (${screenshotResult.data.length} bytes)`);
  }

  ws.close();
  chromeProc.kill();
  console.log('\n✓ Demo order automation completed successfully!');
}

run().catch(err => {
  console.error('Error during demo run:', err);
  process.exit(1);
});
