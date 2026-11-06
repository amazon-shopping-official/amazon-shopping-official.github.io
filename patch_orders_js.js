const fs = require('fs');

let code = fs.readFileSync('orders/orders.js', 'utf8');

// 1. Add PS5 check at start of resolveProductDetails
const target1 = "function resolveProductDetails(itemTitle = '') {\n  const title = itemTitle || '';";
const target1CRLF = "function resolveProductDetails(itemTitle = '') {\r\n  const title = itemTitle || '';";

const add1 = `\n  const isPS5 = title.toLowerCase().includes('ps5') || title.toLowerCase().includes('playstation') || title.toLowerCase().includes('dualsense');
  if (isPS5) {
    return {
      image: '../images/ps5/ps5-pro-front.jpg',
      storeUrl: '../store/ps5/',
      brand: 'Sony PlayStation'
    };
  }`;

if (code.includes(target1)) {
  code = code.replace(target1, target1 + add1);
} else if (code.includes(target1CRLF)) {
  code = code.replace(target1CRLF, target1CRLF + add1.replace(/\n/g, '\r\n'));
}

// 2. Add PS5 order fetch
const target2 = "  // 4c. Fetch UrbanGold Necklace orders";
const add2 = `  // 4d. Fetch PS5 orders
  const ps5Orders = await fetchJsonSafely('../store/ps5/orders.json') || await fetchJsonSafely('../store/ps5/order.json');
  if (ps5Orders) fetchedOrders.push(...ps5Orders);\n\n  // 4c. Fetch UrbanGold Necklace orders`;

code = code.replace(target2, add2);

// 3. Add PS5 local storage merge
const target3 = "  // 6. Merge Local Storage MacBook Pro 16 orders";
const add3 = `  // 5b. Merge Local Storage PS5 orders
  try {
    const rawPS5 = localStorage.getItem('ps5_orders_list');
    if (rawPS5) {
      const parsedPS5 = JSON.parse(rawPS5);
      if (Array.isArray(parsedPS5)) fetchedOrders.unshift(...parsedPS5);
    }
  } catch (e) {}\n\n  // 6. Merge Local Storage MacBook Pro 16 orders`;

code = code.replace(target3, add3);

fs.writeFileSync('orders/orders.js', code, 'utf8');
console.log('Successfully patched orders/orders.js');
