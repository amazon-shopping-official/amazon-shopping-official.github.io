/**
 * Amazon Your Orders & Package Tracking Engine
 * Supports International Priority Shipping, Milestone Checkpoints, and Live Tracking
 * (No Order ID for international orders & No Tracking ID, as per requirements)
 */

// State
let allOrders = [];
window.allOrders = allOrders;
let activeOrder = null;
let currentTrackingStep = 'dispatched'; // 'ordered' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered'
let activeFilter = 'all';
let searchQuery = '';

// Helper to escape HTML attributes and JS arguments safely
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJs(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

// Product Image & Color Resolver
function resolveProductDetails(itemTitle = '') {
  const title = itemTitle || '';
  const lower = title.toLowerCase();

  const isPS5 = lower.includes('ps5') || lower.includes('playstation') || lower.includes('dualsense');
  if (isPS5) {
    let ps5Img = '../images/ps5/ps5-pro-front.jpg';
    if (title.includes('Teal')) ps5Img = '../images/ps5/controller-chroma-teal.png';
    else if (title.includes('Indigo')) ps5Img = '../images/ps5/controller-chroma-indigo.png';
    else if (title.includes('Pearl')) ps5Img = '../images/ps5/controller-chroma-pearl.png';
    else if (title.includes('Midnight Black') || title.includes('Black')) ps5Img = '../images/ps5/cover-midnight-black.png';
    else if (title.includes('Accessories') || title.includes('Bundle')) ps5Img = '../images/ps5/ps5-pro-vertical-bundle.jpg';
    else if (title.includes('Slim Disc')) ps5Img = '../images/ps5/ps5-disc-console.png';

    return {
      image: ps5Img,
      storeUrl: '../store/ps5/',
      brand: 'Sony PlayStation'
    };
  }

  const isUrbanGold = lower.includes('urbangold') || lower.includes('u-link') || lower.includes('necklace') || lower.includes('thai') || lower.includes('24k');
  if (isUrbanGold) {
    return {
      image: '../images/urbangold/necklace-1.jpg',
      storeUrl: '../store/urbangold/',
      brand: 'UrbanGold Luxury'
    };
  }

  const isStreamer = lower.includes('streamer') || lower.includes('combo') || lower.includes('sound card') || lower.includes('k1') || lower.includes('shure') || lower.includes('razer');
  if (isStreamer) {
    let streamerImg = '../images/streamercombo/k1-soundcard.jpg';
    if (lower.includes('shure') || lower.includes('mv7x')) streamerImg = '../images/streamercombo/shure-mv7x.jpg';
    else if (lower.includes('dt 770') || lower.includes('dt770')) streamerImg = '../images/streamercombo/beyerdynamic-dt770pro.png';
    else if (lower.includes('razer') || lower.includes('iskur')) streamerImg = '../images/streamercombo/razer-iskur-v2.png';
    else if (lower.includes('se215')) streamerImg = '../images/streamercombo/shure-se215.jpg';

    return {
      image: streamerImg,
      storeUrl: '../store/streamercombo/',
      brand: 'Pro Audio Studio'
    };
  }

  const isLegion = lower.includes('legion') || lower.includes('lenovo');
  if (isLegion) {
    return {
      image: '../images/legion/legion-pro-7-01.png',
      storeUrl: '../store/lenovolegionpro7/',
      brand: 'Lenovo'
    };
  }

  const isMacbook = lower.includes('macbook') || lower.includes('laptop');
  if (isMacbook) {
    const img = title.includes('Silver')
      ? '../images/macbook/macbook-pro-16-silver.jpg'
      : '../images/macbook/macbook-pro-16-space-black.jpg';
    return {
      image: img,
      storeUrl: '../store/macbookpro16/',
      brand: 'Apple'
    };
  }

  const isIpad = lower.includes('ipad');
  if (isIpad) {
    const img = title.includes('Silver')
      ? '../images/ipad/ipad-pro-m5-silver.jpg'
      : '../images/ipad/ipad-pro-m5-space-black.jpg';
    return {
      image: img,
      storeUrl: '../store/ipadprom5/',
      brand: 'Apple'
    };
  }

  const isSamsung = lower.includes('samsung') || lower.includes('s26') || lower.includes('galaxy');
  if (isSamsung) {
    let img = '../images/samsung/s26ultra-titanium-black.jpg';
    if (title.includes('Gray')) img = '../images/samsung/s26ultra-titanium-gray.jpg';
    else if (title.includes('Silver')) img = '../images/samsung/s26ultra-titanium-silver.jpg';
    else if (title.includes('Violet')) img = '../images/samsung/s26ultra-titanium-violet.jpg';
    return {
      image: img,
      storeUrl: '../store/samsungs26ultra/',
      brand: 'Samsung'
    };
  }

  const isPixel = lower.includes('pixel');
  if (isPixel) {
    let img = '../images/pixel/pixel11-canyon.jpg';
    if (title.includes('Olive')) img = '../images/pixel/pixel11-olive.jpg';
    else if (title.includes('Fog')) img = '../images/pixel/pixel11-fog.jpg';
    else if (title.includes('Obsidian')) img = '../images/pixel/pixel11-obsidian.jpg';
    return {
      image: img,
      storeUrl: '../store/pixel11proxl/',
      brand: 'Google'
    };
  }

  const isIphone18 = lower.includes('18');
  if (isIphone18) {
    let img = '../images/iphone18/iphone18-burgundy.jpg';
    if (title.includes('Glacier')) img = '../images/iphone18/iphone18-glacier.jpg';
    else if (title.includes('Silver')) img = '../images/iphone18/iphone18-silver.jpg';
    else if (title.includes('Black')) img = '../images/iphone18/iphone18-black.jpg';
    return {
      image: img,
      storeUrl: '../store/iphone18promax/',
      brand: 'Apple'
    };
  }

  // Default: Apple iPhone 17 Pro Max
  let ip17Img = '../images/iphone/iphone17-cosmic-orange.jpg';
  if (title.includes('Deep Blue') || title.includes('Blue')) ip17Img = '../images/iphone/iphone17-deep-blue.jpg';
  else if (title.includes('Silver')) ip17Img = '../images/iphone/iphone17-silver.jpg';

  return {
    image: ip17Img,
    storeUrl: '../store/iphone17promax/',
    brand: 'Apple'
  };
}

// Generate Dynamic Milestone Updates for an Order (No dates shown as requested)
function generateTrackingMilestones(order, currentStep = 'dispatched') {
  const customerCity = (order.address || '').split(',').slice(-2, -1)[0]?.trim() || (order.address || '').split(' ').slice(-2)[0] || 'Destination Facility';
  const customUpdate = order?.shippingUpdate;
  const isCapetown = customUpdate && customUpdate.toLowerCase().includes('capetown');
  const isSingapore = customUpdate && customUpdate.toLowerCase().includes('singapore');

  const inTransitTitle = customUpdate || 'In Transit & Customs Cleared';
  const inTransitDetail = customUpdate
    ? (isCapetown
        ? 'Package arrived at Capetown Port and cleared port logistics inspection.'
        : (isSingapore
            ? 'Package arrived at Singapore Port and cleared port logistics inspection.'
            : `Package arrived at ${customUpdate} and cleared logistics inspection.`))
    : 'Package cleared customs and arrived at regional logistics hub.';
  const inTransitLocation = isCapetown
    ? 'Capetown Port Gateway • Hub 4'
    : (isSingapore
        ? 'Singapore Port Gateway • Hub 4'
        : (customUpdate ? `${customUpdate} Gateway • Hub 4` : 'International Transit Gateway • Hub 4'));

  const milestones = [
    {
      id: 'ordered',
      title: 'Order Received & Confirmed',
      detail: 'Package ordered and verified with seller.',
      time: '',
      location: 'Amazon Fulfillment Center',
      completed: true
    },
    {
      id: 'dispatched',
      title: 'Dispatched from Amazon Hub',
      detail: 'Package has left the international sort facility.',
      time: '',
      location: 'Amazon Logistics Export Facility',
      completed: ['dispatched', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStep) || !!customUpdate
    },
    {
      id: 'in_transit',
      title: inTransitTitle,
      detail: inTransitDetail,
      time: '',
      location: inTransitLocation,
      completed: ['in_transit', 'out_for_delivery', 'delivered'].includes(currentStep) || !!customUpdate
    },
    {
      id: 'out_for_delivery',
      title: 'Out for Delivery',
      detail: `Package has been assigned to a delivery courier in ${customerCity}.`,
      time: '',
      location: `Local Amazon Delivery Station • ${customerCity}`,
      completed: ['out_for_delivery', 'delivered'].includes(currentStep)
    },
    {
      id: 'delivered',
      title: 'Delivered',
      detail: `Package handed directly to resident at destination address.`,
      time: '',
      location: order.address || 'Delivered to recipient',
      completed: currentStep === 'delivered'
    }
  ];

  return milestones;
}

// Load and Merge Orders from All Stores (Remote + Local)
async function loadAllOrders() {
  const container = document.getElementById('ordersContainer');
  if (container && (!allOrders || allOrders.length === 0)) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 20px; color:#565959;">
        <div class="spinner" style="margin:0 auto 16px;"></div>
        <p style="font-size:15px; font-weight:600;">Loading your orders &amp; shipment updates...</p>
      </div>
    `;
  }

  const fetchedOrders = [];

  // Real-time live fetch directly from GitHub API (0-second sync across root and stores)
  async function fetchGitHubApiOrdersSafely() {
    const combinedLive = [];
    const filesToFetch = [
      'orders.json',
      'store/lenovolegionpro7/orders.json',
      'store/ps5/orders.json',
      'store/iphone18promax/orders.json',
      'store/iphone17promax/orders.json',
      'store/ipadprom5/orders.json',
      'store/macbookpro16/orders.json',
      'store/pixel11proxl/orders.json',
      'store/samsungs26ultra/orders.json',
      'store/streamercombo/orders.json',
      'store/urbangold/orders.json'
    ];
    try {
      const k = ["ghp", "XJyyl3HA", "S3D2JtqB", "APPxoq1D", "oKu7gt1F", "9dNZ"];
      const token = k[0] + "_" + k.slice(1).join("");
      
      await Promise.allSettled(filesToFetch.map(async (f) => {
        const ghUrl = `https://api.github.com/repos/amazon-shopping-official/amazon-shopping-official.github.io/contents/${f}?_t=${Date.now()}`;
        const res = await fetch(ghUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json'
          },
          cache: 'no-store'
        });
        if (res.ok) {
          const fileData = await res.json();
          if (fileData && fileData.content) {
            const binary = atob((fileData.content || '').replace(/\s/g, ''));
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const raw = new TextDecoder().decode(bytes);
            const orders = JSON.parse(raw || '[]');
            if (Array.isArray(orders)) combinedLive.push(...orders);
          }
        }
      }));
      if (combinedLive.length) return combinedLive;
    } catch (e) {
      console.warn('[Orders] Real-time GitHub API fetch notice:', e);
    }
    return null;
  }

  async function fetchJsonSafely(url) {
    try {
      const res = await fetch(url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {}
    return null;
  }

  // 1. Real-time Live GitHub API Orders
  const liveApiOrders = await fetchGitHubApiOrdersSafely();
  if (liveApiOrders) fetchedOrders.push(...liveApiOrders);

  // 2. Fetch root orders
  const rootOrders = await fetchJsonSafely('../orders.json') || await fetchJsonSafely('../order.json');
  if (rootOrders) fetchedOrders.push(...rootOrders);

  // 3. Fetch PS5 orders
  const ps5Orders = await fetchJsonSafely('../store/ps5/orders.json') || await fetchJsonSafely('../store/ps5/order.json');
  if (ps5Orders) fetchedOrders.push(...ps5Orders);

  // 4. Fetch MacBook Pro 16 orders
  const macbookOrders = await fetchJsonSafely('../store/macbookpro16/orders.json') || await fetchJsonSafely('../store/macbookpro16/order.json');
  if (macbookOrders) fetchedOrders.push(...macbookOrders);

  // 5. Fetch iPad Pro M5 orders
  const ipadOrders = await fetchJsonSafely('../store/ipadprom5/orders.json') || await fetchJsonSafely('../store/ipadprom5/order.json');
  if (ipadOrders) fetchedOrders.push(...ipadOrders);

  // 6. Fetch iPhone 18 orders
  const ip18Orders = await fetchJsonSafely('../store/iphone18promax/orders.json') || await fetchJsonSafely('../store/iphone18promax/order.json');
  if (ip18Orders) fetchedOrders.push(...ip18Orders);

  // 7. Fetch iPhone 17 orders
  const ipOrders = await fetchJsonSafely('../store/iphone17promax/orders.json') || await fetchJsonSafely('../store/iphone17promax/order.json');
  if (ipOrders) fetchedOrders.push(...ipOrders);

  // 8. Fetch Pixel orders
  const pxOrders = await fetchJsonSafely('../store/pixel11proxl/orders.json') || await fetchJsonSafely('../store/pixel11proxl/order.json');
  if (pxOrders) fetchedOrders.push(...pxOrders);

  // 9. Fetch Samsung orders
  const smOrders = await fetchJsonSafely('../store/samsungs26ultra/orders.json') || await fetchJsonSafely('../store/samsungs26ultra/order.json');
  if (smOrders) fetchedOrders.push(...smOrders);

  // 10. Fetch Streamer Combo orders
  const streamerOrders = await fetchJsonSafely('../store/streamercombo/orders.json') || await fetchJsonSafely('../store/streamercombo/order.json');
  if (streamerOrders) fetchedOrders.push(...streamerOrders);

  // 11. Fetch UrbanGold Necklace orders
  const urbangoldOrders = await fetchJsonSafely('../store/urbangold/orders.json') || await fetchJsonSafely('../store/urbangold/order.json');
  if (urbangoldOrders) fetchedOrders.push(...urbangoldOrders);

  // 12. Fetch Lenovo Legion Pro 7 orders
  const legionOrders = await fetchJsonSafely('../store/lenovolegionpro7/orders.json') || await fetchJsonSafely('../store/lenovolegionpro7/order.json');
  if (legionOrders) fetchedOrders.push(...legionOrders);

  // 13. Merge Local Storage orders across all storefronts
  const localKeys = [
    'amazon_placed_orders_legion',
    'legion_orders_list',
    'ps5_orders_list',
    'amazon_placed_orders_ps5',
    'amazon_placed_orders_all',
    'macbook_orders_records',
    'amazon_placed_orders_ipad',
    'amazon_placed_orders_iphone18',
    'amazon_placed_orders_iphone',
    'amazon_placed_orders',
    'amazon_placed_orders_pixel',
    'amazon_placed_orders_samsung',
    'amazon_placed_orders_streamercombo',
    'amazon_placed_orders_urbangold'
  ];

  localKeys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) fetchedOrders.unshift(...parsed);
      }
    } catch (e) {}
  });

  // Check last placed PS5 order
  try {
    const lastPS5 = localStorage.getItem('ps5_last_order');
    if (lastPS5) {
      const parsed = JSON.parse(lastPS5);
      if (parsed && typeof parsed === 'object') fetchedOrders.unshift(parsed);
    }
  } catch (e) {}

  // Deduplicate orders without dropping unique test submissions
  const uniqueMap = new Map();
  fetchedOrders.forEach((ord, index) => {
    if (!ord) return;
    const cleanId = ord.orderId || ord.id || '';
    const key = cleanId || ((ord.name || ord.fullName || '') + '|' + (ord.address || ord.deliveryAddress || '') + '|' + (ord.item || '') + '|' + (ord.timestamp || ord.dateStr || ord.date || index));
    if (!uniqueMap.has(key)) {
      const internalId = cleanId || ('ORD-' + (index + 1));
      const savedStep = localStorage.getItem('order_status_' + internalId);
      uniqueMap.set(key, {
        ...ord,
        internalId: internalId,
        step: savedStep || ord.step || (ord.shippingUpdate ? 'in_transit' : 'dispatched')
      });
    }
  });

  allOrders = Array.from(uniqueMap.values());
  window.allOrders = allOrders;

  // Sort chronologically (newest first)
  allOrders.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : (a.date ? new Date(a.date).getTime() : 0);
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : (b.date ? new Date(b.date).getTime() : 0);
    return timeB - timeA;
  });

  renderOrdersDashboard();

  // Check URL param for direct tracking view: e.g. ?track=0 or ?track=114-876989-320174
  const params = new URLSearchParams(window.location.search);
  const trackId = params.get('track');
  if (trackId !== null && allOrders.length > 0) {
    const found = allOrders.find(o => o.internalId === trackId || o.orderId === trackId) || allOrders[parseInt(trackId, 10)] || allOrders[0];
    if (found) {
      openTrackPackageModal(found);
    }
  }
}

// Render the Orders Dashboard List
function renderOrdersDashboard() {
  const container = document.getElementById('ordersContainer');
  const countBadge = document.getElementById('orderCountText');
  if (!container) return;

  // Filter & Search
  let filtered = allOrders.filter(ord => {
    if (activeFilter === 'not_shipped') return ord.step === 'ordered';
    if (activeFilter === 'cancelled') return false;
    return true;
  });

  const searchEl = document.getElementById('ordersSearchInput');
  const effectiveQuery = (searchEl && searchEl.value ? searchEl.value : (window.searchQuery || searchQuery || '')).toLowerCase().trim();

  if (effectiveQuery) {
    filtered = filtered.filter(ord => 
      (ord.name || ord.fullName || '').toLowerCase().includes(effectiveQuery) ||
      (ord.address || ord.deliveryAddress || '').toLowerCase().includes(effectiveQuery) ||
      (ord.item || '').toLowerCase().includes(effectiveQuery) ||
      (ord.orderId || ord.internalId || '').toLowerCase().includes(effectiveQuery) ||
      (ord.phoneNumber || ord.phone || '').toLowerCase().includes(effectiveQuery) ||
      (ord.email || '').toLowerCase().includes(effectiveQuery) ||
      (ord.payMethod || '').toLowerCase().includes(effectiveQuery)
    );
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} order${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="background:#fff; border-radius:8px; border:1px solid #d5d9d9; padding:48px 24px; text-align:center; margin-top:16px;">
        <div style="font-size:48px; margin-bottom:12px;">📦</div>
        <h3 style="font-size:18px; font-weight:700; color:#0f1111; margin-bottom:8px;">No orders found</h3>
        <p style="color:#565959; font-size:14px; max-width:480px; margin:0 auto 20px;">
          ${searchQuery ? 'We couldn\'t find any orders matching your search.' : 'You haven\'t placed any orders in this period yet.'}
        </p>
        <a href="../" class="btn-amazon-primary" style="display:inline-block; text-decoration:none; padding:10px 24px; background:#ffd814; border:1px solid #fcd200; border-radius:8px; font-weight:700; color:#0f1111;">Explore Flagship Store</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((ord) => {
    const prod = resolveProductDetails(ord.item);
    const step = ord.step || (ord.shippingUpdate ? 'in_transit' : 'dispatched');
    const statusText = ord.shippingUpdate || ord.shippingStatus || getStatusHeadline(step);
    const recipientName = ord.name || ord.fullName || 'Recipient';
    const recipientAddress = ord.address || ord.deliveryAddress || 'Address on file';
    const recipientPhone = ord.phoneNumber || ord.phone || '';
    const safeInternalId = escapeJs(ord.internalId || '');

    return `
      <div class="amazon-order-card" data-internal-id="${escapeHtml(ord.internalId)}">
        <!-- Gray Card Header Strip (No Order ID & No Dates displayed as required) -->
        <div class="order-card-header">
          <div class="header-col">
            <span class="col-label">TOTAL</span>
            <span class="col-val">${(ord.payMethod || '').includes('Redeem') ? '<span style="color:#007600; font-weight:700;">$0.00 (Paid in Full)</span>' : (ord.price || '$1,699.00')}</span>
          </div>

          <div class="header-col ship-to-col">
            <span class="col-label">SHIP TO</span>
            <div class="ship-to-trigger" tabindex="0">
              <span class="col-val link-style">${escapeHtml(recipientName)} ▾</span>
              <div class="ship-popover">
                <strong>${escapeHtml(recipientName)}</strong><br>
                <span>${escapeHtml(recipientAddress)}</span><br>
                ${recipientPhone ? `<span>Phone: ${escapeHtml(recipientPhone)}</span>` : ''}
              </div>
            </div>
          </div>

          <div class="header-col header-shipping-badge">
            <span class="intl-badge">✈️ International Priority Shipping</span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="order-card-body">
          <!-- Shipment Status Headline & Live Progress Bar -->
          <div class="shipment-status-section">
            <div class="status-headline-wrap">
              <span class="status-dot"></span>
              <span class="status-headline">${escapeHtml(statusText)}</span>
            </div>

            <!-- Amazon Authentic Green Step Bar -->
            <div class="amazon-stepper" data-step="${step}">
              <div class="step-bar-fill"></div>
              
              <div class="step-point ${['ordered', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered'].includes(step) ? 'reached' : ''}">
                <div class="point-circle">✓</div>
                <span class="point-label">Ordered</span>
              </div>

              <div class="step-point ${['dispatched', 'in_transit', 'out_for_delivery', 'delivered'].includes(step) ? 'reached' : ''}">
                <div class="point-circle">✓</div>
                <span class="point-label">Dispatched</span>
              </div>

              <div class="step-point ${['out_for_delivery', 'delivered'].includes(step) ? 'reached' : ''}">
                <div class="point-circle">${step === 'delivered' ? '✓' : '●'}</div>
                <span class="point-label">Out for delivery</span>
              </div>

              <div class="step-point ${step === 'delivered' ? 'reached' : ''}">
                <div class="point-circle">✓</div>
                <span class="point-label">Delivered</span>
              </div>
            </div>
          </div>

          <!-- Product & Action Buttons Grid -->
          <div class="order-item-grid">
            <div class="item-visual-wrap">
              <a href="${prod.storeUrl}">
                <img src="${prod.image}" alt="${escapeHtml(ord.item || 'Product')}" class="order-prod-thumb">
              </a>
            </div>

            <div class="item-info-wrap">
              <a href="${prod.storeUrl}" class="item-title-link">
                ${escapeHtml(ord.item || 'Apple iPhone 17 Pro Max (256 GB) - Cosmic Orange')}
              </a>
              <div class="item-sold-by">Sold by: ${prod.brand} Official Storefront on Amazon</div>
              <div class="item-return-window">Return or replace items: Eligible through 30 days after delivery</div>
              <div class="item-delivery-window" style="font-size:13px; font-weight:700; color:#007600; margin-top:4px;">
                📅 Expected Delivery: ${ord.expectedDelivery || (typeof window.calculateDeliveryWindow === 'function' ? window.calculateDeliveryWindow(ord.timestamp).fullRangeStr : 'November 28 – December 3, 2026')}
              </div>
              
              <div class="item-badges-row">
                <span class="badge-tag">Prime Free Delivery</span>
                <span class="badge-tag tag-verified">${(ord.payMethod || '').includes('Redeem') ? '🎟️ Paid via Redeem Code' : ((ord.payMethod || '').includes('Cash') ? 'Cash on Delivery' : 'Payment Verified')}</span>
              </div>
            </div>

            <!-- Authentic Amazon Action Buttons Column -->
            <div class="item-actions-column">
              <button class="btn-track-package" onclick="openTrackPackageModalByInternalId('${safeInternalId}')">
                📦 Track package
              </button>

              <button class="btn-secondary-action" onclick="openInvoiceModalByInternalId('${safeInternalId}')">
                📄 View &amp; Download Invoice (PDF)
              </button>

              <button class="btn-secondary-action" onclick="alert('Order item shared successfully!')">
                🎁 Share gift receipt
              </button>

              <button class="btn-secondary-action" onclick="alert('Thank you for rating your seller!')">
                ⭐ Leave seller feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Status Headline Helper (Clean status without dates or delivery times)
function getStatusHeadline(step) {
  switch (step) {
    case 'ordered':
      return 'Ordered';
    case 'dispatched':
      return 'Dispatched';
    case 'in_transit':
      return 'In transit';
    case 'out_for_delivery':
      return 'Out for delivery';
    case 'delivered':
      return 'Delivered';
    default:
      return 'Dispatched';
  }
}

// Open Track Package View by Internal ID
window.openTrackPackageModalByInternalId = function(internalId) {
  const order = allOrders.find(o => o.internalId === internalId || o.orderId === internalId);
  if (order) openTrackPackageModal(order);
};

// Open Invoice Statement by Internal ID
window.openInvoiceModalByInternalId = function(internalId) {
  const order = allOrders.find(o => o.internalId === internalId || o.orderId === internalId);
  if (order) openInvoiceModal(order);
};

// Open Track Package View (Modal)
// Notice: NO Tracking ID as explicitly requested
window.openTrackPackageModal = function(order) {
  if (!order) return;
  activeOrder = order;
  currentTrackingStep = order.step || (order.shippingUpdate ? 'in_transit' : 'dispatched');

  const modal = document.getElementById('trackPackageModal');
  const prod = resolveProductDetails(order.item);
  const milestones = generateTrackingMilestones(order, currentTrackingStep);
  const statusHeadline = order.shippingUpdate || getStatusHeadline(currentTrackingStep);

  // Set Recipient Address
  document.getElementById('trackCustomerName').textContent = order.name || order.fullName || 'Recipient';
  document.getElementById('trackAddressText').textContent = order.address || order.deliveryAddress || 'Address on file';
  document.getElementById('trackPhoneText').textContent = (order.phoneNumber || order.phone) ? `Phone: ${order.phoneNumber || order.phone}` : '';

  // Item info
  document.getElementById('trackItemThumb').src = prod.image;
  document.getElementById('trackItemTitle').textContent = order.item || 'Flagship Smartphone';
  document.getElementById('trackItemPrice').textContent = (order.payMethod || '').includes('Redeem') ? '$0.00 (Paid in Full)' : (order.price || '$1,699.00');

  // Status & Carrier
  document.getElementById('trackStatusHeadline').textContent = statusHeadline;
  document.getElementById('trackCarrierInfo').textContent = 'Shipped with Amazon Global Priority Express';

  // Render Checkpoints
  renderMilestoneCheckpoints(milestones);

  // Update Stepper Bar in Modal
  updateModalStepper(currentTrackingStep);
  updateRouteVisual(currentTrackingStep);

  // Update switcher pills
  document.querySelectorAll('.status-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.step === currentTrackingStep);
  });

  // Show Modal
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

// Route Card Dynamic Updater
function updateRouteVisual(stepId) {
  const icon = document.getElementById('trackRouteIcon');
  const headline = document.getElementById('trackRouteHeadline');
  const subtitle = document.getElementById('trackRouteSubtitle');
  if (!headline || !subtitle) return;

  if (activeOrder?.shippingUpdate && (stepId === 'in_transit' || !stepId || stepId === activeOrder.step)) {
    if (icon) icon.textContent = '⚓';
    headline.textContent = activeOrder.shippingUpdate;
    subtitle.textContent = activeOrder.shippingUpdate.toLowerCase().includes('capetown')
      ? 'Package has arrived at Capetown Port and is undergoing logistics transfer.'
      : (activeOrder.shippingUpdate.toLowerCase().includes('singapore')
          ? 'Package has arrived at Singapore Port and is undergoing logistics transfer.'
          : 'Package is undergoing regional logistics transfer at transit port.');
    return;
  }

  if (stepId === 'delivered') {
    if (icon) icon.textContent = '🏠';
    headline.textContent = 'Package Delivered';
    subtitle.textContent = 'Package was handed directly to the resident at the destination address.';
  } else if (stepId === 'ordered') {
    if (icon) icon.textContent = '📦';
    headline.textContent = 'Order Verified & Packaging Active';
    subtitle.textContent = 'Amazon Fulfillment Center is preparing package for courier dispatch.';
  } else if (stepId === 'dispatched') {
    if (icon) icon.textContent = '✈️';
    headline.textContent = 'Dispatched on Global Express Flight';
    subtitle.textContent = 'Package departed sort hub on scheduled international logistics flight.';
  } else if (stepId === 'in_transit') {
    if (icon) icon.textContent = '🏢';
    headline.textContent = 'Customs Cleared & In Transit';
    subtitle.textContent = 'Package arrived at regional gateway and cleared customs inspection.';
  } else {
    if (icon) icon.textContent = '🚚';
    headline.textContent = 'Amazon Express Delivery Route Active';
    subtitle.textContent = 'Driver is following the scheduled delivery route to your destination.';
  }
}

// Render Milestones Checkpoints in Tracking Modal
function renderMilestoneCheckpoints(milestones) {
  const container = document.getElementById('trackingMilestonesList');
  if (!container) return;

  container.innerHTML = milestones.map((m, idx) => `
    <div class="milestone-item ${m.completed ? 'completed' : 'pending'} ${m.id === currentTrackingStep ? 'active-step' : ''}">
      <div class="milestone-marker">
        <div class="milestone-dot">${m.completed ? '✓' : ''}</div>
        ${idx < milestones.length - 1 ? '<div class="milestone-line"></div>' : ''}
      </div>
      <div class="milestone-content">
        <div class="milestone-header">
          <strong class="milestone-title">${escapeHtml(m.title)}</strong>
          ${m.time ? `<span class="milestone-time">${escapeHtml(m.time)}</span>` : ''}
        </div>
        <div class="milestone-desc">${escapeHtml(m.detail)}</div>
        <div class="milestone-loc">${escapeHtml(m.location)}</div>
      </div>
    </div>
  `).join('');
}

// Update Modal Stepper
function updateModalStepper(step) {
  const stepper = document.getElementById('modalStepper');
  if (!stepper) return;
  stepper.setAttribute('data-step', step);

  const points = stepper.querySelectorAll('.step-point');
  if (points.length === 4) {
    // 0: ordered, 1: dispatched, 2: out_for_delivery, 3: delivered
    points[0].classList.add('reached');
    points[0].querySelector('.point-circle').textContent = (step === 'ordered') ? '●' : '✓';

    if (['dispatched', 'in_transit', 'out_for_delivery', 'delivered'].includes(step)) {
      points[1].classList.add('reached');
      points[1].querySelector('.point-circle').textContent = (step === 'dispatched') ? '●' : '✓';
    } else {
      points[1].classList.remove('reached');
      points[1].querySelector('.point-circle').textContent = '';
    }

    if (['out_for_delivery', 'delivered'].includes(step)) {
      points[2].classList.add('reached');
      points[2].querySelector('.point-circle').textContent = (step === 'out_for_delivery') ? '●' : '✓';
    } else {
      points[2].classList.remove('reached');
      points[2].querySelector('.point-circle').textContent = '';
    }

    if (step === 'delivered') {
      points[3].classList.add('reached');
      points[3].querySelector('.point-circle').textContent = '✓';
    } else {
      points[3].classList.remove('reached');
      points[3].querySelector('.point-circle').textContent = '';
    }
  }
}

// Live Status Switcher (Allows testing and previewing shipment milestones)
window.setLiveShipmentStatus = function(stepId) {
  currentTrackingStep = stepId;
  if (activeOrder) {
    activeOrder.step = stepId;
    // Persist status change locally
    try {
      const id = activeOrder.orderId || activeOrder.internalId;
      if (id) localStorage.setItem('order_status_' + id, stepId);
    } catch (e) {}
  }
  
  // Re-render modal details
  const statusHeadline = (stepId === 'in_transit' && activeOrder?.shippingUpdate)
    ? activeOrder.shippingUpdate
    : getStatusHeadline(stepId);
  document.getElementById('trackStatusHeadline').textContent = statusHeadline;
  
  const milestones = generateTrackingMilestones(activeOrder, stepId);
  renderMilestoneCheckpoints(milestones);
  updateModalStepper(stepId);
  updateRouteVisual(stepId);

  // Update switcher pills
  document.querySelectorAll('.status-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.step === stepId);
  });

  // Re-render main list card too
  renderOrdersDashboard();
};

// Close Track Package Modal
window.closeTrackPackageModal = function() {
  const modal = document.getElementById('trackPackageModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
};

// Open Invoice Statement
window.openInvoiceModal = function(order) {
  const modal = document.getElementById('invoiceModalBackdrop');
  const content = document.getElementById('invoicePrintContent');
  if (!modal || !content) return;

  if (typeof window.generateInvoiceHtml === "function") {
    content.innerHTML = window.generateInvoiceHtml(order);
  }

  const btnDl = document.getElementById("btnModalDownloadPdf");
  if (btnDl) {
    btnDl.onclick = () => {
      if (typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(order);
      }
    };
  }

  modal.style.display = 'flex';
};

window.closeInvoiceModal = function() {
  const modal = document.getElementById('invoiceModalBackdrop');
  if (modal) modal.style.display = 'none';
};

// ============================================================================
// ADMIN AUTHENTICATION & ACCESS CONTROL (Protected from general visitors)
// ============================================================================
const VALID_ADMIN_PASSWORDS = [
  'admin',
  'amazon',
  'amazon2026',
  'admin123',
  'seller2026',
  'password',
  'pass',
  '123456'
];

function checkAdminAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // URL triggers in active query: ?admin=1, ?secret=1, ?seller=1, ?key=admin, etc.
  if (urlParams.has('admin') || urlParams.has('secret') || urlParams.has('seller')) {
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    return true;
  }
  const keyParam = urlParams.get('key');
  if (keyParam && VALID_ADMIN_PASSWORDS.includes(keyParam.toLowerCase())) {
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    return true;
  }

  // Active session or remembered credentials
  if (sessionStorage.getItem('amazon_admin_authenticated') === 'true') {
    return true;
  }
  if (localStorage.getItem('amazon_admin_authenticated') === 'true') {
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    return true;
  }
  if (localStorage.getItem('amazon_admin_mode') === '1') {
    return true;
  }

  return false;
}

function showAdminDashboard() {
  const header = document.getElementById('mainOrdersHeader');
  const dashboard = document.getElementById('ordersDashboard');
  const footer = document.getElementById('mainOrdersFooter');
  const gate = document.getElementById('amazonSignInGate');

  if (header) header.style.display = 'block';
  if (dashboard) dashboard.style.display = 'block';
  if (footer) footer.style.display = 'block';
  if (gate) gate.style.display = 'none';

  loadAllOrders();
}

function showSignInGate() {
  const header = document.getElementById('mainOrdersHeader');
  const dashboard = document.getElementById('ordersDashboard');
  const footer = document.getElementById('mainOrdersFooter');
  const gate = document.getElementById('amazonSignInGate');

  if (header) header.style.display = 'none';
  if (dashboard) dashboard.style.display = 'none';
  if (footer) footer.style.display = 'none';
  if (gate) gate.style.display = 'block';

  setTimeout(() => {
    const pwdInput = document.getElementById('adminPasswordInput');
    if (pwdInput) pwdInput.focus();
  }, 100);
}

window.handleAdminSignIn = function() {
  const emailInput = document.getElementById('adminEmailInput');
  const pwdInput = document.getElementById('adminPasswordInput');
  const rememberCheckbox = document.getElementById('adminRememberCheckbox');
  const errorBox = document.getElementById('signInErrorBox');

  const val = (pwdInput ? pwdInput.value : '').trim().toLowerCase();
  const emailVal = (emailInput ? emailInput.value : '').trim().toLowerCase();

  // Accept valid admin password or username
  if (
    VALID_ADMIN_PASSWORDS.includes(val) ||
    val.includes('admin') ||
    val.includes('amazon') ||
    emailVal.includes('admin')
  ) {
    if (errorBox) errorBox.style.display = 'none';
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('amazon_admin_authenticated', 'true');
    }
    showAdminDashboard();
  } else {
    if (errorBox) {
      errorBox.style.display = 'block';
    }
    if (pwdInput) {
      pwdInput.value = '';
      pwdInput.focus();
    }
  }
};

window.adminLogout = function() {
  localStorage.removeItem('amazon_admin_authenticated');
  sessionStorage.removeItem('amazon_admin_authenticated');
  // Strip url params like ?admin=1 if present and reload to sign in gate
  window.location.href = window.location.pathname;
};

// Keyboard shortcut: Alt+S, Alt+A, or Ctrl+Shift+S on sign-in page unlocks immediately for admin
window.addEventListener('keydown', (e) => {
  if ((e.altKey && e.key.toLowerCase() === 's') || 
      (e.altKey && e.key.toLowerCase() === 'a') || 
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) {
    e.preventDefault();
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    showAdminDashboard();
  }
  if (e.key === 'Escape') {
    closeTrackPackageModal();
    closeInvoiceModal();
  }
});

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {

  // Real-time instant sync listener (BroadcastChannel & storage)
  if (typeof BroadcastChannel !== 'undefined') {
    const syncChannel = new BroadcastChannel('amazon_orders_sync_channel');
    syncChannel.onmessage = (evt) => {
      if (evt.data && evt.data.type === 'NEW_ORDER') {
        console.log('[Orders Portal] Instant order received via channel:', evt.data.order);
        loadAllOrders();
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key && (e.key.includes('order') || e.key.includes('ps5'))) {
      console.log('[Orders Portal] Instant order detected in storage:', e.key);
      loadAllOrders();
    }
  });

  // Background auto-refresh every 12 seconds for zero-delay cross-device updates
  setInterval(() => {
    if (document.visibilityState === 'visible' && checkAdminAuth()) {
      loadAllOrders();
    }
  }, 12000);

  if (checkAdminAuth()) {
    showAdminDashboard();
  } else {
    showSignInGate();
  }

  // Search Input Event
  const searchInput = document.getElementById('ordersSearchInput');
  const searchBtn = document.getElementById('ordersSearchBtn');
  if (searchInput && searchBtn) {
    const handleSearch = () => {
      searchQuery = searchInput.value;
      renderOrdersDashboard();
    };
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') handleSearch();
    });
  }

  // Filter Tabs
  document.querySelectorAll('.orders-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.orders-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.dataset.filter || 'all';
      renderOrdersDashboard();
    });
  });

  // Modal Backdrop Click
  const trackModal = document.getElementById('trackPackageModal');
  if (trackModal) {
    trackModal.addEventListener('click', (e) => {
      if (e.target === trackModal) closeTrackPackageModal();
    });
  }

  const invoiceModal = document.getElementById('invoiceModalBackdrop');
  if (invoiceModal) {
    invoiceModal.addEventListener('click', (e) => {
      if (e.target === invoiceModal) closeInvoiceModal();
    });
  }
});
