const fs = require('fs');

let code = fs.readFileSync('orders/orders.js', 'utf8');

// 1. Add isPS5 check
const searchStr1 = "const isUrbanGold = title.toLowerCase().includes('gold') || title.toLowerCase().includes('necklace') || title.toLowerCase().includes('u-link');";
const addStr1 = "const isPS5 = title.toLowerCase().includes('ps5') || title.toLowerCase().includes('playstation') || title.toLowerCase().includes('dualsense');\n  " + searchStr1;

if (code.includes(searchStr1)) {
  code = code.replace(searchStr1, addStr1);
}

// 2. Add PS5 image & storeUrl
const searchStr2 = "let image = isUrbanGold";
const replaceStr2 = "let image = isPS5 ? '../images/ps5/ps5-pro-front.jpg' : (isUrbanGold";
if (code.includes(searchStr2)) {
  code = code.replace(searchStr2, replaceStr2);
  // Also adjust trailing paren
  code = code.replace("': '../images/iphone/iphone17-cosmic-orange.jpg'))))))", "': '../images/iphone/iphone17-cosmic-orange.jpg')))))))");
}

const searchStr3 = "let storeUrl = isUrbanGold";
const replaceStr3 = "let storeUrl = isPS5 ? '../store/ps5/' : (isUrbanGold";
if (code.includes(searchStr3)) {
  code = code.replace(searchStr3, replaceStr3);
  code = code.replace("': '../store/iphone17promax/'))))))", "': '../store/iphone17promax/')))))))");
}

const searchStrBrand = "let brand = isUrbanGold";
const replaceStrBrand = "let brand = isPS5 ? 'Sony PlayStation' : (isUrbanGold";
if (code.includes(searchStrBrand)) {
  code = code.replace(searchStrBrand, replaceStrBrand);
  code = code.replace("': 'Apple')))));", "': 'Apple'))))));");
}

// 3. Add fetch PS5 orders
const searchFetch = "  // 4c. Fetch UrbanGold Necklace orders";
const addFetch = `  // 4d. Fetch PS5 orders
  const ps5Orders = await fetchJsonSafely('../store/ps5/orders.json') || await fetchJsonSafely('../store/ps5/order.json');
  if (ps5Orders) fetchedOrders.push(...ps5Orders);

  // 4c. Fetch UrbanGold Necklace orders`;

if (code.includes(searchFetch)) {
  code = code.replace(searchFetch, addFetch);
}

// 4. Add PS5 local storage merge
const searchLocal = "  // 6. Merge Local Storage MacBook Pro 16 orders";
const addLocal = `  // 5b. Merge Local Storage PS5 orders
  try {
    const rawPS5 = localStorage.getItem('ps5_orders_list');
    if (rawPS5) {
      const parsedPS5 = JSON.parse(rawPS5);
      if (Array.isArray(parsedPS5)) fetchedOrders.push(...parsedPS5);
    }
  } catch(e) {}

  // 6. Merge Local Storage MacBook Pro 16 orders`;

if (code.includes(searchLocal)) {
  code = code.replace(searchLocal, addLocal);
}

fs.writeFileSync('orders/orders.js', code, 'utf8');
console.log('Successfully updated orders/orders.js with PS5 integration');
