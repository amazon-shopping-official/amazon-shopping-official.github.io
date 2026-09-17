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
  const isPixel = title.toLowerCase().includes('pixel');
  
  let image = isPixel 
    ? '../images/pixel/pixel11-canyon.jpg' 
    : '../images/iphone/iphone17-cosmic-orange.jpg';
  let storeUrl = isPixel ? '../store/pixel11proxl/' : '../store/iphone17promax/';
  let brand = isPixel ? 'Google' : 'Apple';

  if (isPixel) {
    if (title.includes('Olive')) image = '../images/pixel/pixel11-olive.jpg';
    else if (title.includes('Fog')) image = '../images/pixel/pixel11-fog.jpg';
    else if (title.includes('Obsidian')) image = '../images/pixel/pixel11-obsidian.jpg';
    else image = '../images/pixel/pixel11-canyon.jpg';
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
      completed: ['dispatched', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStep)
    },
    {
      id: 'in_transit',
      title: 'In Transit & Customs Cleared',
      detail: 'Package cleared customs and arrived at regional logistics hub.',
      time: '',
      location: `International Transit Gateway • Hub 4`,
      completed: ['in_transit', 'out_for_delivery', 'delivered'].includes(currentStep)
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

  // 1. Fetch Remote iPhone orders
  try {
    const res = await fetch('../store/iphone17promax/orders.json?_t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) fetchedOrders.push(...data);
    }
  } catch (err) {
    console.warn('Could not load remote iPhone orders:', err);
  }

  // 2. Fetch Remote Pixel orders
  try {
    const res = await fetch('../store/pixel11proxl/orders.json?_t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) fetchedOrders.push(...data);
    }
  } catch (err) {
    console.warn('Could not load remote Pixel orders:', err);
  }

  // 3. Merge Local Storage iPhone orders
  try {
    const localIphone = JSON.parse(localStorage.getItem('amazon_placed_orders_iphone') || localStorage.getItem('amazon_placed_orders') || '[]');
    if (Array.isArray(localIphone)) fetchedOrders.unshift(...localIphone);
  } catch (e) {}

  // 4. Merge Local Storage Pixel orders
  try {
    const localPixel = JSON.parse(localStorage.getItem('amazon_placed_orders_pixel') || '[]');
    if (Array.isArray(localPixel)) fetchedOrders.unshift(...localPixel);
  } catch (e) {}

  // Deduplicate orders
  const uniqueMap = new Map();
  fetchedOrders.forEach((ord, index) => {
    const key = (ord.name || '') + '|' + (ord.address || '') + '|' + (ord.item || '');
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        ...ord,
        internalId: 'ORD-' + (index + 1),
        step: 'dispatched'
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
    const step = ord.step || 'dispatched';
    const statusText = getStatusHeadline(step);

    return `
      <div class="amazon-order-card" data-index="${idx}">
        <!-- Gray Card Header Strip (No Order ID & No Dates displayed) -->
        <div class="order-card-header">
          <div class="header-col">
            <span class="col-label">TOTAL</span>
            <span class="col-val">${ord.price || '$1,699.00'}</span>
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
              
              <div class="item-badges-row">
                <span class="badge-tag">Prime Free Delivery</span>
                <span class="badge-tag tag-verified">Payment Verified</span>
              </div>
            </div>

            <!-- Authentic Amazon Action Buttons Column -->
            <div class="item-actions-column">
              <button class="btn-track-package" onclick="openTrackPackageModal(allOrders[${idx}])">
                📦 Track package
              </button>

              <button class="btn-secondary-action" onclick="openInvoiceModal(allOrders[${idx}])">
                📄 View or print invoice
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
  currentTrackingStep = order.step || 'dispatched';

  const modal = document.getElementById('trackPackageModal');
  const prod = resolveProductDetails(order.item);
  const milestones = generateTrackingMilestones(order, currentTrackingStep);
  const statusHeadline = getStatusHeadline(currentTrackingStep);

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
  const stepOrder = ['ordered', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered'];
  const currentIndex = stepOrder.indexOf(step);

  points.forEach((pt, pIdx) => {
    if (pIdx <= currentIndex) {
      pt.classList.add('reached');
      pt.querySelector('.point-circle').textContent = (pIdx === currentIndex && step !== 'delivered') ? '●' : '✓';
    } else {
      pt.classList.remove('reached');
      pt.querySelector('.point-circle').textContent = '';
    }
  });
}

// Live Status Switcher (Allows testing and previewing shipment milestones)
window.setLiveShipmentStatus = function(stepId) {
  currentTrackingStep = stepId;
  if (activeOrder) {
    activeOrder.step = stepId;
  }
  
  // Re-render modal details
  const statusHeadline = getStatusHeadline(stepId);
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

  const prod = resolveProductDetails(order.item);

  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; border-bottom:2px solid #131921; padding-bottom:12px; margin-bottom:16px;">
      <div>
        <h2 style="font-size:20px; font-weight:800; color:#131921; letter-spacing:-0.5px;">amazon.com</h2>
        <div style="font-size:12px; color:#555;">Details for ${order.name || 'Customer'}</div>
      </div>
      <div style="text-align:right;">
        <strong style="font-size:14px;">INTERNATIONAL ORDER STATEMENT</strong><br>
        <span style="font-size:11px; color:#007600; font-weight:600;">Status: Dispatched</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; padding:12px; background:#f9fafb; border-radius:6px; border:1px solid #eee;">
      <div>
        <strong style="font-size:12px; text-transform:uppercase; color:#777;">Shipping Address:</strong><br>
        <strong style="font-size:14px; color:#111;">${order.name}</strong><br>
        ${order.address}<br>
        ${order.phoneNumber ? `Phone: ${order.phoneNumber}<br>` : ''}
        ${order.email ? `Email: ${order.email}` : ''}
      </div>
      <div>
        <strong style="font-size:12px; text-transform:uppercase; color:#777;">Shipping Method:</strong><br>
        Amazon Global Priority Shipping<br>
        <span style="color:#007600; font-weight:600;">Status: Paid in Full</span>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
      <thead>
        <tr style="border-bottom:1px solid #ccc; text-align:left; background:#f0f2f2;">
          <th style="padding:8px 10px;">Item Description</th>
          <th style="padding:8px 10px; text-align:center;">Qty</th>
          <th style="padding:8px 10px; text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px;">
            <strong>${order.item}</strong><br>
            <span style="font-size:11px; color:#666;">Sold by: ${prod.brand} Official Storefront on Amazon</span>
          </td>
          <td style="padding:10px; text-align:center;">1</td>
          <td style="padding:10px; text-align:right;">${order.price || '$1,699.00'}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="font-size:15px; font-weight:700; border-top:2px solid #111;">
          <td colspan="2" style="padding:10px; text-align:right;">Grand Total:</td>
          <td style="padding:10px; text-align:right; color:#b12704;">${order.price || '$1,699.00'}</td>
        </tr>
      </tfoot>
    </table>

    <div style="font-size:11px; color:#777; border-top:1px solid #eee; padding-top:12px; text-align:center;">
      This statement confirms details recorded directly on Amazon.com.
    </div>
  `;

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
  
  // URL triggers: ?admin=1, ?secret=1, ?seller=1, or ?key=admin
  if (urlParams.has('admin') || urlParams.has('secret') || urlParams.has('seller')) {
    localStorage.setItem('amazon_admin_authenticated', 'true');
    return true;
  }
  const keyParam = urlParams.get('key');
  if (keyParam && VALID_ADMIN_PASSWORDS.includes(keyParam.toLowerCase())) {
    localStorage.setItem('amazon_admin_authenticated', 'true');
    return true;
  }

  return localStorage.getItem('amazon_admin_authenticated') === 'true' || 
         sessionStorage.getItem('amazon_admin_authenticated') === 'true';
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
  const rememberCb = document.getElementById('adminRememberCheckbox');

  if (!pwdInput) return;
  const val = pwdInput.value.trim().toLowerCase();

  if (VALID_ADMIN_PASSWORDS.includes(val) || val.includes('admin')) {
    if (errorBox) errorBox.style.display = 'none';
    if (rememberCb && rememberCb.checked) {
      localStorage.setItem('amazon_admin_authenticated', 'true');
    } else {
      sessionStorage.setItem('amazon_admin_authenticated', 'true');
    }
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
  // Strip url params like ?admin=1 if present
  window.location.href = window.location.pathname;
};

// Keyboard shortcut: Alt+S or Alt+A on sign-in page unlocks immediately
window.addEventListener('keydown', (e) => {
  if ((e.altKey && e.key.toLowerCase() === 's') || 
      (e.altKey && e.key.toLowerCase() === 'a') || 
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) {
    e.preventDefault();
    localStorage.setItem('amazon_admin_authenticated', 'true');
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
