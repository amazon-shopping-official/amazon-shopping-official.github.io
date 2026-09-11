/**
 * Amazon.com - Official Apple iPhone 17 Pro Max Showcase & Fluid Checkout
 * 100% Real Official Images, Dynamic Real-Time Dates, Friend-Perspective Ordering
 */

const PRODUCT = {
  title: "Apple iPhone 17 Pro Max",
  colors: {
    "Cosmic Orange": {
      img: "images/iphone17-cosmic-orange.jpg",
      thumb: "images/iphone17-cosmic-orange.jpg",
      swatchClass: "swatch-cosmic-orange"
    },
    "Deep Blue": {
      img: "images/iphone17-deep-blue.jpg",
      thumb: "images/iphone17-deep-blue.jpg",
      swatchClass: "swatch-deep-blue"
    },
    "Silver": {
      img: "images/iphone17-silver.jpg",
      thumb: "images/iphone17-silver.jpg",
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

document.addEventListener("DOMContentLoaded", () => {
  setupProductOptions();
  setupBuyNow();
  setupCheckoutAccordion();
  setupOrdersDrawer();
  setupTrackingModal();
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
      mainPhoto.src = colorData.img;
      mainPhoto.alt = `${PRODUCT.title} in ${state.color}`;
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
        mainPhoto.src = t.dataset.img;
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

// 2. Single "Buy Now" Action
function setupBuyNow() {
  const btnBuyNow = document.getElementById("btnBuyNow");
  const viewProduct = document.getElementById("viewProductPage");
  const viewCheckout = document.getElementById("viewCheckout");
  const logoHomeLink = document.getElementById("logoHomeLink");

  btnBuyNow.addEventListener("click", () => {
    const unit = PRODUCT.storagePrices[state.storage] || 1699;
    const total = unit * state.qty;

    // Populate checkout item details
    document.getElementById("reviewItemTitle").textContent = `${PRODUCT.title} (${state.storage}) - ${state.color}`;
    document.getElementById("reviewItemQty").textContent = state.qty;
    document.getElementById("reviewItemPrice").textContent = formatMoney(total);
    document.getElementById("reviewItemPhoto").src = PRODUCT.colors[state.color]?.thumb || "images/iphone17-cosmic-orange.jpg";

    document.getElementById("csItemsPrice").textContent = formatMoney(total);
    document.getElementById("csTotalPrice").textContent = formatMoney(total);

    // Transition smoothly
    viewProduct.style.display = "none";
    viewCheckout.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  logoHomeLink.addEventListener("click", (e) => {
    e.preventDefault();
    viewCheckout.classList.remove("active");
    viewProduct.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
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

  // 3. Place Order Triggers
  function triggerPlaceOrder() {
    if (!state.address) {
      showToast("Please enter your shipping address first.");
      btnEditAddress.click();
      return;
    }
    finalizeOrderPlacement();
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
  // Expected delivery date is left blank (no auto calculation)
  const dynamicDelivery = "";

  // Populate Confirmation Screen
  document.getElementById("confOrderNumber").textContent = orderNum;
  document.getElementById("confEmailNotice").textContent = state.address.email;
  document.getElementById("confOrderDate").textContent = dynamicOrderDate;
  document.getElementById("confRecipientName").textContent = state.address.fullName;
  document.getElementById("confFullAddress").textContent = state.address.deliveryAddress;
  document.getElementById("confPhone").textContent = state.address.phone;
  const confDeliv = document.getElementById("confDeliveryDate");
  if (confDeliv) confDeliv.textContent = "";
  document.getElementById("confItemName").textContent = `${PRODUCT.title} (${state.storage}) - ${state.color}`;
  document.getElementById("confQty").textContent = state.qty;
  document.getElementById("confTotal").textContent = formatMoney(total);
  
  const confPayMethod = document.getElementById("confPayMethod");
  if (confPayMethod) {
    confPayMethod.textContent = state.paymentMethod;
  }

  const confFriendNoticeBox = document.getElementById("confFriendNoticeBox");
  const confPaymentStatus = document.getElementById("confPaymentStatus");

  if (state.paymentMethod === "Ask a Friend to Pay") {
    if (confFriendNoticeBox) confFriendNoticeBox.style.display = "flex";
    if (confPaymentStatus) confPaymentStatus.textContent = "Status: Awaiting payment by friend";
  } else {
    if (confFriendNoticeBox) confFriendNoticeBox.style.display = "none";
    if (confPaymentStatus) confPaymentStatus.textContent = "Status: Pay in cash on delivery";
  }

  // Save to Client LocalStorage for Seller/Billing Portal
  const orderRecord = {
    orderId: orderNum,
    date: dynamicOrderDate,
    time: new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
    deliveryRange: "",
    fullName: state.address.fullName,
    deliveryAddress: state.address.deliveryAddress,
    phone: state.address.phone,
    email: state.address.email,
    item: `${PRODUCT.title} (${state.storage}) - ${state.color}`,
    qty: state.qty,
    unitPrice: formatMoney(unit),
    total: formatMoney(total),
    paymentMethod: state.paymentMethod
  };

  state.placedOrder = orderRecord;

  try {
    const saved = JSON.parse(localStorage.getItem("amazon_placed_orders") || "[]");
    saved.unshift(orderRecord);
    localStorage.setItem("amazon_placed_orders", JSON.stringify(saved));
  } catch (err) {
    console.error("Storage error:", err);
  }

  // Update Orders Badge Count in Header
  updateOrdersBadge();

  // Show clean Amazon confirmation view
  checkoutGrid.style.display = "none";
  confScreen.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  showToast("Order placed, thank you!");
}

// 5. Track Package Modal (For the Friend)
function setupTrackingModal() {
  const btnTrack = document.getElementById("btnTrackPackage");
  const modal = document.getElementById("trackingModalBackdrop");
  const btnClose = document.getElementById("btnCloseTrackingModal");

  if (btnTrack) {
    btnTrack.addEventListener("click", () => {
      const ord = state.placedOrder || (JSON.parse(localStorage.getItem("amazon_placed_orders") || "[]")[0]);
      if (!ord) return;

      document.getElementById("trackOrderNum").textContent = ord.orderId;
      const trackDeliv = document.getElementById("trackDeliveryDate");
      if (trackDeliv) trackDeliv.textContent = "";
      document.getElementById("trackPlacedDate").textContent = `${ord.date} at ${ord.time || '10:00 AM'}`;
      document.getElementById("trackDestinationSummary").textContent = `Delivering to ${ord.fullName}, ${ord.deliveryAddress}`;

      modal.style.display = "flex";
    });
  }

  if (btnClose) {
    btnClose.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }
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

  // Modal elements
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

  // Covert Trigger 3: Secret Gesture (Triple-click the top-left Amazon logo)
  let logoClickCount = 0;
  let logoClickTimer = null;
  const logoLink = document.getElementById("logoHomeLink");
  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      logoClickCount++;
      clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
      }, 500);

      if (logoClickCount >= 3) {
        e.preventDefault();
        logoClickCount = 0;
        openDrawer();
        showToast("🔒 Secret Seller & Billing Hub Opened");
      }
    });
  }

  // Friend's Normal Perspective: Clicking Returns & Orders opens customer package tracking or status
  if (navOrdersBtn) {
    navOrdersBtn.addEventListener("click", () => {
      const orders = JSON.parse(localStorage.getItem("amazon_placed_orders") || "[]");
      if (state.placedOrder || orders.length > 0) {
        const btnTrack = document.getElementById("btnTrackPackage");
        if (btnTrack) {
          btnTrack.click();
        }
      } else {
        showToast("Your Orders: You have no active orders yet.");
      }
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
    });
  }

  // Export CSV
  if (btnExportCsv) {
    btnExportCsv.addEventListener("click", exportOrdersToCSV);
  }

  // Clear orders
  if (btnClearOrders) {
    btnClearOrders.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all test order records?")) {
        localStorage.removeItem("amazon_placed_orders");
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

// Render Saved Orders in Drawer
function renderOrdersList() {
  const container = document.getElementById("ordersListContainer");
  if (!container) return;

  const orders = JSON.parse(localStorage.getItem("amazon_placed_orders") || "[]");

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

  container.innerHTML = orders.map((ord) => `
    <div class="order-record-card">
      <div class="orc-top">
        <span>Order #${ord.orderId}</span>
        <span>${ord.date} ${ord.time || ''}</span>
      </div>
      <div class="orc-product">${ord.item}</div>
      <div class="orc-details">
        <strong>Recipient:</strong> ${ord.fullName}<br>
        <strong>Address:</strong> ${ord.deliveryAddress}<br>
        <strong>Contact:</strong> ${ord.phone} &bull; ${ord.email}<br>
        <strong>Qty:</strong> ${ord.qty} &bull; <strong>Total:</strong> <span style="color:var(--price-red); font-weight:700;">${ord.total}</span><br>
        <strong>Payment:</strong> <span style="color:#007185; font-weight:600;">${ord.paymentMethod}</span>
      </div>
      <button class="btn-invoice" onclick="openInvoice('${ord.orderId}')">
        🧾 Print Customer Billing Statement
      </button>
    </div>
  `).join("");
}

// Open Printable Billing Invoice Modal (Uses Dynamic Live Order Date)
window.openInvoice = function(orderId) {
  const orders = JSON.parse(localStorage.getItem("amazon_placed_orders") || "[]");
  const ord = orders.find(o => o.orderId === orderId) || orders[0];
  if (!ord) return;

  const modal = document.getElementById("invoiceModalBackdrop");
  const content = document.getElementById("invoicePrintContent");

  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; border-bottom:2px solid #131921; padding-bottom:12px; margin-bottom:16px;">
      <div>
        <h2 style="font-size:20px; font-weight:800; color:#131921; letter-spacing:-0.5px;">amazon.com</h2>
        <div style="font-size:12px; color:#555;">Final Details for Order #${ord.orderId}</div>
      </div>
      <div style="text-align:right;">
        <strong style="font-size:14px;">CUSTOMER INVOICE</strong><br>
        <span style="font-size:12px; color:#555;">Order Date: ${ord.date}</span>
      </div>
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; padding:12px; background:#f9fafb; border-radius:6px; border:1px solid #eee;">
      <div>
        <strong style="font-size:12px; text-transform:uppercase; color:#777;">Shipping Destination:</strong><br>
        <strong style="font-size:14px; color:#111;">${ord.fullName}</strong><br>
        ${ord.deliveryAddress}<br>
        Phone: ${ord.phone}<br>
        Email: ${ord.email}
      </div>
      <div>
        <strong style="font-size:12px; text-transform:uppercase; color:#777;">Payment &amp; Billing:</strong><br>
        Method: <strong>${ord.paymentMethod}</strong><br>
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
          <td style="padding:10px; text-align:center;">${ord.qty}</td>
          <td style="padding:10px; text-align:right;">${ord.total}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:8px 10px; text-align:right;">Item Subtotal:</td>
          <td style="padding:8px 10px; text-align:right;">${ord.total}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:8px 10px; text-align:right;">Shipping &amp; Handling:</td>
          <td style="padding:8px 10px; text-align:right;">$0.00</td>
        </tr>
        <tr style="font-size:15px; font-weight:700; border-top:2px solid #111;">
          <td colspan="2" style="padding:10px; text-align:right;">Grand Total:</td>
          <td style="padding:10px; text-align:right; color:#b12704;">${ord.total}</td>
        </tr>
      </tfoot>
    </table>

    <div style="font-size:11px; color:#777; border-top:1px solid #eee; padding-top:12px; text-align:center;">
      This statement confirms your order and delivery details recorded directly on Amazon.com.
    </div>
  `;

  modal.style.display = "flex";
};

// Export All Collected Orders to CSV File
function exportOrdersToCSV() {
  const orders = JSON.parse(localStorage.getItem("amazon_placed_orders") || "[]");
  if (orders.length === 0) {
    showToast("No orders available to export.");
    return;
  }

  const headers = ["Order ID", "Date", "Full Name", "Delivery Address", "Phone", "Email", "Item", "Quantity", "Total", "Payment Method"];
  const rows = orders.map(o => [
    `"${o.orderId}"`,
    `"${o.date}"`,
    `"${(o.fullName || '').replace(/"/g, '""')}"`,
    `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
    `"${(o.phone || '').replace(/"/g, '""')}"`,
    `"${(o.email || '').replace(/"/g, '""')}"`,
    `"${(o.item || '').replace(/"/g, '""')}"`,
    `"${o.qty}"`,
    `"${o.total}"`,
    `"${o.paymentMethod}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `amazon_orders_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("CSV export downloaded successfully!");
}

// Update Header Orders Badge
function updateOrdersBadge() {
  const badge = document.getElementById("ordersBadgeCount");
  if (!badge) return;
  const orders = JSON.parse(localStorage.getItem("amazon_placed_orders") || "[]");
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
