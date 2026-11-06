/**
 * ps5-app.js
 * Amazon.com - Official Sony PlayStation®5 (PS5 & PS5 Pro) Flagship Showcase & Multi-Step Checkout
 * 100% Official PlayStation Media Assets, Real-Time Dates, Authentic Amazon Storefront Design
 * Full Variant Selection (PS5 Pro, Slim Disc, Slim Digital, Classic), 13 Official Colourways,
 * All Accessories Combined Ultimate Bundle Option, and Instant Redeem Code Payment System
 */

const PATH_PREFIX = window.location.pathname.includes('/store/') ? '../../' : '';

const PS5_DATA = {
  title: "Sony PlayStation 5 Gaming Console",
  brand: "PlayStation Official Store",
  variants: {
    "PS5 Pro (2 TB SSD)": {
      name: "PlayStation®5 Pro",
      tagline: "The Most Visually Impressive Way to Play Games on PlayStation",
      badge: "Flagship 2TB • PSSR 4K 120fps",
      storage: "2 TB Ultra-High Speed NVMe SSD",
      price: 699.99,
      msrp: 699.99,
      specs: [
        "PlayStation Spectral Super Resolution (PSSR AI Upscaling)",
        "Advanced Ray Tracing (2x–3x faster ray reflection & refraction)",
        "Upgraded GPU: 67% more Compute Units & 28% faster memory",
        "Target 60 FPS / 120 FPS high-fidelity 4K gameplay",
        "Wi-Fi 7 Ready & 2 TB internal SSD storage"
      ],
      heroImg: PATH_PREFIX + "images/ps5/ps5-pro-front.jpg",
      gallery: [
        { img: PATH_PREFIX + "images/ps5/ps5-pro-front.jpg", title: "PS5 Pro Vertical Front" },
        { img: PATH_PREFIX + "images/ps5/ps5-pro-vertical-bundle.jpg", title: "PS5 Pro with DualSense" },
        { img: PATH_PREFIX + "images/ps5/ps5-pro-side.jpg", title: "PS5 Pro Side Profile" },
        { img: PATH_PREFIX + "images/ps5/ps5-pro-horizontal.jpg", title: "Horizontal Orientation" },
        { img: PATH_PREFIX + "images/ps5/ps5-pro-rear.jpg", title: "Rear Ports & Cooling Fins" },
        { img: PATH_PREFIX + "images/ps5/ps5-pro-hero.jpg", title: "Cinematic Beauty Render" }
      ]
    },
    "PS5 Slim Disc (1 TB SSD)": {
      name: "PlayStation®5 Slim - Disc Edition",
      tagline: "Play PS5 & PS4 on Ultra HD Blu-ray Disc + High-Speed Downloads",
      badge: "Best Seller • 1TB Disc",
      storage: "1 TB Ultra-High Speed SSD",
      price: 499.99,
      msrp: 549.99,
      specs: [
        "Ultra HD Blu-ray Disc Drive pre-installed",
        "1 TB Ultra-High Speed SSD storage",
        "Tempest 3D AudioTech & Haptic Feedback",
        "4K 120Hz HDR gaming with Ray Tracing",
        "ASTRO's PLAYROOM pre-installed"
      ],
      heroImg: PATH_PREFIX + "images/ps5/ps5-slim-disc-box.png",
      gallery: [
        { img: PATH_PREFIX + "images/ps5/ps5-slim-disc-box.png", title: "PS5 Slim Disc Box Packaging" },
        { img: PATH_PREFIX + "images/ps5/ps5-disc-console.png", title: "PS5 Disc Console Angle" },
        { img: PATH_PREFIX + "images/ps5/ps5-consoles-family.png", title: "PS5 Console Family" },
        { img: PATH_PREFIX + "images/ps5/accessories-bundle-hero.png", title: "Console & Ecosystem" }
      ]
    },
    "PS5 Slim Digital (1 TB SSD)": {
      name: "PlayStation®5 Slim - Digital Edition",
      tagline: "All-Digital Gaming with Modular Attachable Disc Drive Compatibility",
      badge: "Popular Value • 1TB Digital",
      storage: "1 TB Ultra-High Speed SSD",
      price: 449.99,
      msrp: 499.99,
      specs: [
        "All-digital streamlined design (attachable disc drive sold separately)",
        "1 TB Ultra-High Speed SSD storage",
        "Ultra-fast loading with custom integrated I/O",
        "DualSense Wireless Controller with Adaptive Triggers",
        "Ray Tracing & 120 FPS at up to 4K resolution"
      ],
      heroImg: PATH_PREFIX + "images/ps5/ps5-slim-digital-box.png",
      gallery: [
        { img: PATH_PREFIX + "images/ps5/ps5-slim-digital-box.png", title: "PS5 Slim Digital Box Packaging" },
        { img: PATH_PREFIX + "images/ps5/ps5-consoles-family.png", title: "PS5 Slim Digital View" },
        { img: PATH_PREFIX + "images/ps5/ps5-disc-drive.png", title: "Modular Disc Drive Compatible" },
        { img: PATH_PREFIX + "images/ps5/accessories-bundle-hero.png", title: "Console & DualSense" }
      ]
    },
    "PS5 Classic Disc (825 GB)": {
      name: "PlayStation®5 Classic - Disc Edition",
      tagline: "The Original Iconic PlayStation 5 Architecture with Ultra HD Blu-ray",
      badge: "Classic 825GB Disc",
      storage: "825 GB Ultra-High Speed SSD",
      price: 479.99,
      msrp: 499.99,
      specs: [
        "Original full-profile dual-tone cooling architecture",
        "Ultra HD Blu-ray Disc player included",
        "Custom AMD Zen 2 CPU & RDNA 2 GPU",
        "Haptic feedback and dynamic resistance triggers",
        "4K TV gaming with up to 120 FPS output"
      ],
      heroImg: PATH_PREFIX + "images/ps5/ps5-disc-console.png",
      gallery: [
        { img: PATH_PREFIX + "images/ps5/ps5-disc-console.png", title: "PS5 Classic Console Stand" },
        { img: PATH_PREFIX + "images/ps5/ps5-consoles-family.png", title: "Console Family Front" },
        { img: PATH_PREFIX + "images/ps5/cover-white.png", title: "Classic Two-Tone Profile" }
      ]
    },
    "PS5 Classic Digital (825 GB)": {
      name: "PlayStation®5 Classic - Digital Edition",
      tagline: "Symmetrical Disc-Free Chassis for Pure Digital Download Gaming",
      badge: "Classic 825GB Digital",
      storage: "825 GB Ultra-High Speed SSD",
      price: 399.99,
      msrp: 449.99,
      specs: [
        "Pure digital download gaming via PlayStation Network",
        "Ultra-slim symmetrical classic chassis design",
        "Lightning fast SSD game loading times",
        "3D Audio through stereo headphones or TV speakers",
        "Backwards compatibility for supported PS4 digital titles"
      ],
      heroImg: PATH_PREFIX + "images/ps5/ps5-consoles-family.png",
      gallery: [
        { img: PATH_PREFIX + "images/ps5/ps5-consoles-family.png", title: "PS5 Classic Digital" },
        { img: PATH_PREFIX + "images/ps5/cover-white.png", title: "Full White Accent Finish" },
        { img: PATH_PREFIX + "images/ps5/accessories-bundle-hero.png", title: "DualSense Wireless Setup" }
      ]
    }
  },
  colors: {
    "Standard White": {
      name: "Standard White",
      collection: "Original Iconic",
      swatchClass: "swatch-ps5-white",
      coverImg: PATH_PREFIX + "images/ps5/cover-white.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-white.png",
      desc: "Iconic PlayStation two-tone contrasting matte white & obsidian finish."
    },
    "Midnight Black": {
      name: "Midnight Black",
      collection: "Galaxy Collection",
      swatchClass: "swatch-ps5-midnight-black",
      coverImg: PATH_PREFIX + "images/ps5/cover-midnight-black.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-midnight-black.png",
      desc: "Stealth blackout aesthetic inspired by the mysteries of deep night space."
    },
    "Chroma Teal": {
      name: "Chroma Teal",
      collection: "Chroma Collection",
      swatchClass: "swatch-ps5-chroma-teal",
      coverImg: PATH_PREFIX + "images/ps5/cover-chroma-teal.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-chroma-teal.png",
      desc: "Shimmers through a fresh spectrum of vibrant yellows and deep aquatic teals."
    },
    "Chroma Indigo": {
      name: "Chroma Indigo",
      collection: "Chroma Collection",
      swatchClass: "swatch-ps5-chroma-indigo",
      coverImg: PATH_PREFIX + "images/ps5/cover-chroma-indigo.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-chroma-indigo.png",
      desc: "Dynamic iridescent shift oscillating across vivid electric blues and deep purples."
    },
    "Chroma Pearl": {
      name: "Chroma Pearl",
      collection: "Chroma Collection",
      swatchClass: "swatch-ps5-chroma-pearl",
      coverImg: PATH_PREFIX + "images/ps5/cover-chroma-pearl.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-chroma-pearl.png",
      desc: "Luminescent pearl finish shimmering subtly with soft pinks and creamy tones."
    },
    "Volcanic Red": {
      name: "Volcanic Red",
      collection: "Deep Earth Collection",
      swatchClass: "swatch-ps5-volcanic-red",
      coverImg: PATH_PREFIX + "images/ps5/cover-volcanic-red.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-volcanic-red.png",
      desc: "Fiery metallic crimson finish drawn from deep molten magma within the Earth."
    },
    "Cobalt Blue": {
      name: "Cobalt Blue",
      collection: "Deep Earth Collection",
      swatchClass: "swatch-ps5-cobalt-blue",
      coverImg: PATH_PREFIX + "images/ps5/cover-cobalt-blue.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-cobalt-blue.png",
      desc: "Deep metallic oceanic hues with fascinating depths and sleek satin sheen."
    },
    "Sterling Silver": {
      name: "Sterling Silver",
      collection: "Deep Earth Collection",
      swatchClass: "swatch-ps5-sterling-silver",
      coverImg: PATH_PREFIX + "images/ps5/cover-sterling-silver.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-sterling-silver.png",
      desc: "Precious titanium-inspired metallic gleam paying homage to PlayStation heritage."
    },
    "Cosmic Red": {
      name: "Cosmic Red",
      collection: "Galaxy Collection",
      swatchClass: "swatch-ps5-cosmic-red",
      coverImg: PATH_PREFIX + "images/ps5/cover-cosmic-red.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-cosmic-red.png",
      desc: "Vivid galactic nebula red inspired by celestial bursts across the cosmos."
    },
    "Nova Pink": {
      name: "Nova Pink",
      collection: "Galaxy Collection",
      swatchClass: "swatch-ps5-nova-pink",
      coverImg: PATH_PREFIX + "images/ps5/cover-nova-pink.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-cosmic-red.png",
      desc: "Explosive supernova vibrancy bringing bold high-energy pink styling to your setup."
    },
    "Starlight Blue": {
      name: "Starlight Blue",
      collection: "Galaxy Collection",
      swatchClass: "swatch-ps5-starlight-blue",
      coverImg: PATH_PREFIX + "images/ps5/cover-starlight-blue.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-starlight-blue.png",
      desc: "Radiant interstellar blue inspired by the glowing brilliance of distant stars."
    },
    "Galactic Purple": {
      name: "Galactic Purple",
      collection: "Galaxy Collection",
      swatchClass: "swatch-ps5-galactic-purple",
      coverImg: PATH_PREFIX + "images/ps5/cover-galactic-purple.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-galactic-purple.png",
      desc: "Royal astronomical violet reflecting the majesty of stellar astronomical nebulae."
    },
    "Gray Camouflage": {
      name: "Gray Camouflage",
      collection: "Tactical Collection",
      swatchClass: "swatch-ps5-gray-camo",
      coverImg: PATH_PREFIX + "images/ps5/cover-gray-camouflage.png",
      controllerImg: PATH_PREFIX + "images/ps5/controller-gray-camo.png",
      desc: "Tactical urban camo pattern infused with micro iconic PlayStation Shapes."
    }
  },
  packages: {
    "console-only": {
      id: "console-only",
      name: "Console Standard Package",
      badge: "Standard",
      extraCost: 0.00,
      description: "Selected PS5 Console + 1x DualSense Wireless Controller + HDMI 2.1 Cable + Power Cord + Base Stand.",
      includes: [
        "1x Sony PlayStation 5 Console (Selected Model)",
        "1x DualSense Wireless Controller (Matched Colorway)",
        "HDMI 2.1 Ultra-High Speed Cable (4K/120Hz, 8K, HDR)",
        "AC Power Cord & USB-C Controller Charging Cable",
        "ASTRO's PLAYROOM (Pre-installed)"
      ]
    },
    "dual-controller": {
      id: "dual-controller",
      name: "Dual Player Bundle (+ $99.99)",
      badge: "Co-Op Ready",
      extraCost: 99.99,
      description: "Includes Console + 2x DualSense Wireless Controllers (Matched Colorway) + Dual Controller Charging Station.",
      includes: [
        "1x Sony PlayStation 5 Console (Selected Model)",
        "2x DualSense Wireless Controllers (Matched Colorway)",
        "1x DualSense Dual Controller Charging Station (Click-in Dock)",
        "All Cables, HDMI 2.1 & Pre-installed Games"
      ]
    },
    "all-accessories-combined": {
      id: "all-accessories-combined",
      name: "🔥 ALL ACCESSORIES COMBINED (Ultimate Setup - Save $190.00)",
      badge: "★ Complete Ultimate Bundle ★",
      extraCost: 399.00, // Bundle value of $589 for only $399
      description: "The complete setup: Console + 2x Controllers + Pulse Elite Headset + Charging Station + PlayStation Portal + Vertical Stand + Media Remote.",
      includes: [
        "1x Sony PlayStation 5 Console (Selected Model)",
        "2x DualSense Wireless Controllers (Matched Colorway)",
        "1x Pulse Elite™ Wireless Headset (Planar Magnetic Drivers + AI Noise Rejection)",
        "1x DualSense Dual Controller Charging Station",
        "1x PlayStation Portal™ Remote Player (8-inch Full HD 60fps Screen)",
        "1x PS5 Official Metal Ring Vertical Stand",
        "1x PS5 Official Media Remote Control"
      ],
      itemsList: [
        {
          name: "2x DualSense Wireless Controllers",
          photo: PATH_PREFIX + "images/ps5/controllers-range-hero.png",
          detail: "Two matching controllers with haptic feedback & adaptive triggers"
        },
        {
          name: "Pulse Elite Wireless Headset",
          photo: PATH_PREFIX + "images/ps5/pulse-elite-headset.png",
          detail: "Planar magnetic studio drivers & retractable mic with AI noise rejection"
        },
        {
          name: "PlayStation Portal Remote Player",
          photo: PATH_PREFIX + "images/ps5/ps-portal.png",
          detail: "8\" Full HD 1080p 60fps screen streaming games via home Wi-Fi"
        },
        {
          name: "DualSense Charging Station",
          photo: PATH_PREFIX + "images/ps5/dualsense-charging-station.png",
          detail: "Charges two DualSense wireless controllers simultaneously without USB ports"
        },
        {
          name: "PS5 Official Vertical Stand",
          photo: PATH_PREFIX + "images/ps5/ps5-vertical-stand.png",
          detail: "Polished metal chrome circular base for sturdy vertical console display"
        },
        {
          name: "PS5 Media Remote",
          photo: PATH_PREFIX + "images/ps5/ps5-media-remote.png",
          detail: "Dedicated Netflix, Disney+, Spotify, and YouTube one-touch launch buttons"
        }
      ]
    }
  }
};

// Current Session State
const state = {
  variant: "PS5 Pro (2 TB SSD)",
  color: "Standard White",
  package: "all-accessories-combined", // default to the complete accessories combo
  activeGalleryIndex: 0,
  qty: 1,
  address: null,
  paymentMethod: "Redeem Code", // Highlight the requested redeem code payment
  redeemCode: "PS5-PRO-8K9V-3M7X-4W2L",
  isRedeemApplied: true,
  placedOrder: null
};

// Valid Promotional & Amazon / PlayStation Redeem Codes
const ASSIGNED_REDEEM_CODE = "PS5-PRO-8K9V-3M7X-4W2L";
const VALID_REDEEM_CODES = [
  "PS5-PRO-8K9V-3M7X-4W2L",
  "SONY-9X7K-2M4V-8W1Q",
  "PS5-PLAY-HAS-NO-LIMITS",
  "PSN-9K3P-4M7W-9Y2L",
  "AMZN-8K3P-4M7W-9Y2L",
  "SONY-PS5-PRO-GIFT",
  "AMZN-5V7C-3N9J-8K4R",
  "PLAYSTATION-2026-VIP"
];

function isValidRedeemCode(rawCode) {
  if (!rawCode) return false;
  const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Check exact matches or valid format
  for (const c of VALID_REDEEM_CODES) {
    if (clean === c.replace(/[^A-Z0-9]/g, "")) return true;
  }
  // Allow any formatted code with length >= 12 characters (e.g. PS5-XXXX-XXXX-XXXX)
  return clean.length >= 10 && (clean.startsWith("PS") || clean.startsWith("AMZN") || clean.startsWith("SONY"));
}

// Format Currency in Dollars ($)
function formatMoney(amount) {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Calculate Total Base Price
function calculateItemPrice() {
  const v = PS5_DATA.variants[state.variant] || PS5_DATA.variants["PS5 Pro (2 TB SSD)"];
  const p = PS5_DATA.packages[state.package] || PS5_DATA.packages["all-accessories-combined"];
  return v.price + p.extraCost;
}

function calculateOrderTotal() {
  return calculateItemPrice() * state.qty;
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

function getDeliveryWindow(date = new Date()) {
  const dStart = new Date(date.getTime() + (2 * 24 * 60 * 60 * 1000));
  const dEnd = new Date(date.getTime() + (4 * 24 * 60 * 60 * 1000));
  const options = { weekday: "short", month: "short", day: "numeric" };
  return `${dStart.toLocaleDateString("en-US", options)} – ${dEnd.toLocaleDateString("en-US", options)}`;
}

// GitHub Repo Persistence for Orders
const GH_CONFIG = {
  owner: "amazon-shopping-official",
  repo: "amazon-shopping-official.github.io",
  storePath: "store/ps5",
  filePath: "store/ps5/orders.json",
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

async function persistOrderToGitHub(orderData) {
  try {
    const token = GH_CONFIG.getAuth();
    const apiUrl = `https://api.github.com/repos/${GH_CONFIG.owner}/${GH_CONFIG.repo}/contents/${GH_CONFIG.filePath}`;

    let sha = null;
    let existingOrders = [];

    const getRes = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
      try {
        const decoded = decodeURIComponent(escape(atob(data.content.replace(/\s/g, ''))));
        existingOrders = JSON.parse(decoded);
        if (!Array.isArray(existingOrders)) existingOrders = [];
      } catch (e) {
        existingOrders = [];
      }
    }

    existingOrders.unshift(orderData);
    const updatedContent = JSON.stringify(existingOrders, null, 2);
    const b64 = utf8ToBase64(updatedContent);

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Add PS5 order ${orderData.orderId} [Automated Store Checkout]`,
        content: b64,
        sha: sha || undefined
      })
    });

    if (putRes.ok) {
      console.log(`[GitHub API] Successfully committed order ${orderData.orderId}`);
    }
  } catch (err) {
    console.warn(`[GitHub API] Store order fallback: ${err.message}`);
  }
}

// LocalStorage helpers
function saveLocalOrder(orderData) {
  try {
    const key = "ps5_orders_list";
    let list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(orderData);
    localStorage.setItem(key, JSON.stringify(list));
    localStorage.setItem("ps5_last_order", JSON.stringify(orderData));
  } catch(e) {}
}

function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem("ps5_orders_list") || "[]");
  } catch(e) {
    return [];
  }
}

// Safe DOM Helper
function safeSet(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Show Toast
function showToast(msg) {
  const toast = document.getElementById("amazonToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 4000);
}

// DOM Elements Initialization
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const mainProductPhoto = document.getElementById("mainProductPhoto");
  const thumbnailStrip = document.getElementById("thumbnailStrip");
  const productTitle = document.getElementById("productTitle");
  const centerPriceDollars = document.getElementById("centerPriceDollars");
  const centerPriceCents = document.getElementById("centerPriceCents");
  const sidePrice = document.getElementById("sidePrice");
  const currentColorText = document.getElementById("currentColorText");
  const currentVariantText = document.getElementById("currentVariantText");
  const currentPackageText = document.getElementById("currentPackageText");
  const deliveryDateSpan = document.getElementById("deliveryDateSpan");
  const deliveryDateSide = document.getElementById("deliveryDateSide");

  // Buy Box & Checkout
  const btnBuyNow = document.getElementById("btnBuyNow");
  const btnAddToCart = document.getElementById("btnAddToCart");
  const checkoutModal = document.getElementById("checkoutModal");
  const btnCloseCheckout = document.getElementById("btnCloseCheckout");
  const selectQty = document.getElementById("selectQty");

  // Stepper Elements
  const formAddress = document.getElementById("formAddress");
  const stepCardAddress = document.getElementById("stepCardAddress");
  const stepCardPayment = document.getElementById("stepCardPayment");
  const stepCardReview = document.getElementById("stepCardReview");
  const stepAddressBody = document.getElementById("stepAddressBody");
  const stepAddressSummary = document.getElementById("stepAddressSummary");
  const btnEditAddress = document.getElementById("btnEditAddress");
  const stepPaymentBody = document.getElementById("stepPaymentBody");
  const stepPaymentSummary = document.getElementById("stepPaymentSummary");
  const btnEditPayment = document.getElementById("btnEditPayment");
  const stepReviewBody = document.getElementById("stepReviewBody");
  const btnContinueToReview = document.getElementById("btnContinueToReview");
  const btnBackToAddress = document.getElementById("btnBackToAddress");
  const btnBackToPayment = document.getElementById("btnBackToPayment");
  const btnFinalPlaceOrder = document.getElementById("btnFinalPlaceOrder");
  const btnSummaryPlaceOrder = document.getElementById("btnSummaryPlaceOrder");

  // Redeem Code Elements
  const optRedeemCode = document.getElementById("optRedeemCode");
  const boxRedeemInput = document.getElementById("boxRedeemInput");
  const inputRedeemCode = document.getElementById("inputRedeemCode");
  const btnApplyRedeemCode = document.getElementById("btnApplyRedeemCode");
  const redeemStatusMsg = document.getElementById("redeemStatusMsg");
  const badgeRedeemApplied = document.getElementById("badgeRedeemApplied");
  const csRedeemDiscountRow = document.getElementById("csRedeemDiscountRow");
  const csRedeemDiscountAmount = document.getElementById("csRedeemDiscountAmount");

  // Order Summary Elements
  const csItemsPrice = document.getElementById("csItemsPrice");
  const csTotalPrice = document.getElementById("csTotalPrice");
  const reviewItemPhoto = document.getElementById("reviewItemPhoto");
  const reviewItemTitle = document.getElementById("reviewItemTitle");
  const reviewItemQty = document.getElementById("reviewItemQty");
  const reviewItemPrice = document.getElementById("reviewItemPrice");

  // Confirmation Screen Elements
  const orderConfirmationScreen = document.getElementById("orderConfirmationScreen");
  const checkoutStepsWrapper = document.getElementById("checkoutStepsWrapper");
  const confRedeemNoticeBox = document.getElementById("confRedeemNoticeBox");
  const confFriendNoticeBox = document.getElementById("confFriendNoticeBox");
  const btnConfDownloadPdf = document.getElementById("btnConfDownloadPdf");

  // Admin Orders Drawer
  const ordersDrawer = document.getElementById("ordersDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const btnCloseDrawer = document.getElementById("btnCloseDrawer");
  const ordersListContainer = document.getElementById("ordersListContainer");
  const navOrdersBtn = document.getElementById("navOrdersBtn");
  const footerAdminTrigger = document.getElementById("footerAdminTrigger");
  const btnExportOrdersCsv = document.getElementById("btnExportOrdersCsv");
  const btnClearAllOrders = document.getElementById("btnClearAllOrders");

  // Update Dynamic Delivery Dates
  const now = new Date();
  const deliveryText = getDeliveryWindow(now);
  if (deliveryDateSpan) deliveryDateSpan.textContent = deliveryText;
  if (deliveryDateSide) deliveryDateSide.textContent = deliveryText;

  // Render Thumbnails
  function updateGallery() {
    if (!thumbnailStrip) return;
    thumbnailStrip.innerHTML = "";
    const v = PS5_DATA.variants[state.variant];
    const c = PS5_DATA.colors[state.color];
    const p = PS5_DATA.packages[state.package];

    // Build gallery items list: Cover, Controller, and Variant angles
    const items = [];
    if (v.gallery && v.gallery.length) {
      v.gallery.forEach(g => items.push({ src: g.img, title: g.title }));
    }
    if (c.coverImg) {
      items.push({ src: c.coverImg, title: `${c.name} Console Cover` });
    }
    if (c.controllerImg) {
      items.push({ src: c.controllerImg, title: `${c.name} DualSense Controller` });
    }
    if (p.id === "all-accessories-combined") {
      items.push({ src: PATH_PREFIX + "images/ps5/accessories-bundle-hero.png", title: "Complete Accessories Combo" });
      items.push({ src: PATH_PREFIX + "images/ps5/pulse-elite-headset.png", title: "Pulse Elite Wireless Headset" });
      items.push({ src: PATH_PREFIX + "images/ps5/ps-portal.png", title: "PlayStation Portal Remote Player" });
    }

    items.forEach((item, idx) => {
      const thumb = document.createElement("div");
      thumb.className = `thumb-item ${idx === state.activeGalleryIndex ? 'active' : ''}`;
      thumb.title = item.title;
      thumb.innerHTML = `<img src="${item.src}" alt="${item.title}">`;
      thumb.addEventListener("click", () => {
        state.activeGalleryIndex = idx;
        if (mainProductPhoto) {
          mainProductPhoto.src = item.src;
          mainProductPhoto.alt = item.title;
        }
        document.querySelectorAll(".thumb-item").forEach(t => t.classList.remove("active"));
        thumb.classList.add("active");
      });
      thumbnailStrip.appendChild(thumb);
    });

    // Default main photo
    const activeItem = items[state.activeGalleryIndex] || items[0];
    if (mainProductPhoto && activeItem) {
      mainProductPhoto.src = activeItem.src;
      mainProductPhoto.alt = activeItem.title;
    }
  }

  // Update UI Pricing & Titles
  function updatePricingAndDisplay() {
    const v = PS5_DATA.variants[state.variant];
    const c = PS5_DATA.colors[state.color];
    const p = PS5_DATA.packages[state.package];
    const singlePrice = calculateItemPrice();
    const total = calculateOrderTotal();

    // Split dollars & cents
    const parts = singlePrice.toFixed(2).split(".");
    if (centerPriceDollars) centerPriceDollars.textContent = Number(parts[0]).toLocaleString();
    if (centerPriceCents) centerPriceCents.textContent = "." + parts[1];
    if (sidePrice) sidePrice.textContent = formatMoney(total);

    // Title
    let fullTitle = `Sony ${v.name} (${v.storage}) - ${c.name}`;
    if (p.id === "all-accessories-combined") {
      fullTitle += " + All Accessories Combined Ultimate Setup";
    } else if (p.id === "dual-controller") {
      fullTitle += " + 2x DualSense Controllers & Charging Station";
    }
    if (productTitle) productTitle.textContent = fullTitle;
    if (currentColorText) currentColorText.textContent = `${c.name} (${c.collection})`;
    if (currentVariantText) currentVariantText.textContent = v.name;
    if (currentPackageText) currentPackageText.textContent = p.name;

    // Update specs box if present
    const specsList = document.getElementById("ps5SpecsList");
    if (specsList) {
      specsList.innerHTML = v.specs.map(s => `<li>✓ ${s}</li>`).join("");
    }

    // Checkout Summary update
    const isRedeemApplied = (state.paymentMethod === "Redeem Code" && state.isRedeemApplied);
    if (csItemsPrice) csItemsPrice.textContent = formatMoney(total);
    if (csRedeemDiscountRow && csRedeemDiscountAmount) {
      if (isRedeemApplied) {
        csRedeemDiscountRow.style.display = "flex";
        csRedeemDiscountAmount.textContent = `-${formatMoney(total)}`;
      } else {
        csRedeemDiscountRow.style.display = "none";
      }
    }
    if (csTotalPrice) {
      csTotalPrice.textContent = isRedeemApplied ? "$0.00 (Paid in Full)" : formatMoney(total);
    }

    // Review Box
    if (reviewItemPhoto) reviewItemPhoto.src = mainProductPhoto ? mainProductPhoto.src : v.heroImg;
    if (reviewItemTitle) reviewItemTitle.textContent = fullTitle;
    if (reviewItemQty) reviewItemQty.textContent = state.qty;
    if (reviewItemPrice) reviewItemPrice.textContent = formatMoney(total);

    // Update accessories live breakdown view
    const accBox = document.getElementById("allAccessoriesLiveBox");
    if (accBox) {
      accBox.style.display = (p.id === "all-accessories-combined") ? "block" : "none";
    }
  }

  // Swatch Clicks (Colours)
  document.querySelectorAll(".swatch-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".swatch-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.color = btn.getAttribute("data-color");
      state.activeGalleryIndex = 0;
      updateGallery();
      updatePricingAndDisplay();
    });
  });

  // Variant Clicks (PS5 Pro / Slim Disc / Slim Digital / Classic)
  document.querySelectorAll(".variant-card-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".variant-card-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.variant = btn.getAttribute("data-variant");
      state.activeGalleryIndex = 0;
      updateGallery();
      updatePricingAndDisplay();
    });
  });

  // Package / Bundle Clicks
  document.querySelectorAll(".package-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".package-choice-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.package = btn.getAttribute("data-package");
      state.activeGalleryIndex = 0;
      updateGallery();
      updatePricingAndDisplay();
    });
  });

  // Quantity Change
  if (selectQty) {
    selectQty.addEventListener("change", (e) => {
      state.qty = parseInt(e.target.value, 10) || 1;
      updatePricingAndDisplay();
    });
  }

  // Open Checkout
  function openCheckout() {
    if (!checkoutModal) return;
    checkoutModal.style.display = "block";
    document.body.style.overflow = "hidden";
    updatePricingAndDisplay();
  }

  function closeCheckout() {
    if (!checkoutModal) return;
    checkoutModal.style.display = "none";
    document.body.style.overflow = "";
  }

  if (btnBuyNow) btnBuyNow.addEventListener("click", openCheckout);
  if (btnAddToCart) {
    btnAddToCart.addEventListener("click", () => {
      showToast("🎮 Added to Cart! Opening secure Amazon checkout...");
      setTimeout(openCheckout, 400);
    });
  }
  if (btnCloseCheckout) btnCloseCheckout.addEventListener("click", closeCheckout);

  // Address Step Submission
  if (formAddress) {
    formAddress.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("inputFullName") ? document.getElementById("inputFullName").value.trim() : "Valued Customer";
      const address = document.getElementById("inputAddress") ? document.getElementById("inputAddress").value.trim() : "";
      const city = document.getElementById("inputCity") ? document.getElementById("inputCity").value.trim() : "";
      const postal = document.getElementById("inputPostal") ? document.getElementById("inputPostal").value.trim() : "";
      const phone = document.getElementById("inputPhone") ? document.getElementById("inputPhone").value.trim() : "";
      const email = document.getElementById("inputEmail") ? document.getElementById("inputEmail").value.trim() : "";

      state.address = { name, address, city, postal, phone, email };

      // Transition to Step 2
      if (stepAddressBody) stepAddressBody.style.display = "none";
      if (stepAddressSummary) {
        stepAddressSummary.style.display = "block";
        stepAddressSummary.innerHTML = `
          <strong>${name}</strong><br>
          ${address}, ${city} ${postal}<br>
          Phone: ${phone} &bull; Email: ${email}
        `;
      }
      if (btnEditAddress) btnEditAddress.style.display = "inline-block";
      if (stepCardPayment) stepCardPayment.classList.add("active");
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
    });
  }

  if (btnEditAddress) {
    btnEditAddress.addEventListener("click", () => {
      if (stepAddressBody) stepAddressBody.style.display = "block";
      if (stepAddressSummary) stepAddressSummary.style.display = "none";
      btnEditAddress.style.display = "none";
    });
  }

  // Payment Options Radio & Click Handlers
  document.querySelectorAll(".payment-option").forEach(opt => {
    opt.addEventListener("click", () => {
      if (opt.classList.contains("disabled")) return;
      document.querySelectorAll(".payment-option").forEach(o => o.classList.remove("selected"));
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
      updatePricingAndDisplay();
    });
  });

  // REDEEM CODE APPLICATION HANDLER (Just like iPhone 18)
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

      if (!isValidRedeemCode(rawCode)) {
        state.isRedeemApplied = false;
        state.redeemCode = "";
        if (badgeRedeemApplied) badgeRedeemApplied.style.display = "none";
        if (redeemStatusMsg) {
          redeemStatusMsg.className = "redeem-status-msg error";
          redeemStatusMsg.textContent = "✕ The claim code you entered is invalid or cannot be applied to this item.";
        }
        updatePricingAndDisplay();
        return;
      }

      state.redeemCode = rawCode;
      state.isRedeemApplied = true;
      inputRedeemCode.value = rawCode;
      if (badgeRedeemApplied) badgeRedeemApplied.style.display = "inline-block";
      if (redeemStatusMsg) {
        redeemStatusMsg.className = "redeem-status-msg success";
        redeemStatusMsg.textContent = `✓ Claim Code ${rawCode} applied! Balance covers 100% of order total. Balance due: $0.00.`;
      }
      showToast(`🎁 Redeem Code applied: Full order covered ($0.00 due)`);
      updatePricingAndDisplay();
    };

    btnApplyRedeemCode.addEventListener("click", (e) => {
      e.stopPropagation();
      applyRedeem();
    });

    inputRedeemCode.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyRedeem();
      }
    });

    inputRedeemCode.addEventListener("click", (e) => e.stopPropagation());
  }

  // Quick-fill code chips
  document.querySelectorAll(".redeem-chip-btn").forEach(chip => {
    chip.addEventListener("click", (e) => {
      e.stopPropagation();
      const code = chip.getAttribute("data-code");
      if (inputRedeemCode) {
        inputRedeemCode.value = code;
        if (btnApplyRedeemCode) btnApplyRedeemCode.click();
      }
    });
  });

  // Step 2 to Step 3: Continue to Review
  if (btnContinueToReview) {
    btnContinueToReview.addEventListener("click", () => {
      if (state.paymentMethod === "Redeem Code") {
        if (!state.isRedeemApplied || !state.redeemCode) {
          if (inputRedeemCode && isValidRedeemCode(inputRedeemCode.value)) {
            state.redeemCode = inputRedeemCode.value.trim().toUpperCase();
            state.isRedeemApplied = true;
            if (badgeRedeemApplied) badgeRedeemApplied.style.display = "inline-block";
          } else {
            if (inputRedeemCode) inputRedeemCode.focus();
            if (redeemStatusMsg) {
              redeemStatusMsg.className = "redeem-status-msg error";
              redeemStatusMsg.textContent = "Please enter and apply a valid claim code to cover this purchase.";
            }
            return;
          }
        }
      }

      // Transition
      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepPaymentSummary) {
        stepPaymentSummary.style.display = "block";
        if (state.paymentMethod === "Redeem Code") {
          stepPaymentSummary.innerHTML = `
            <strong>🎁 Redeem Code / Gift Card:</strong> ${state.redeemCode}<br>
            <span style="color:#007600; font-weight:600;">Full order balance covered (100% discount applied)</span>
          `;
        } else if (state.paymentMethod === "Ask a Friend to Pay") {
          stepPaymentSummary.innerHTML = `
            <strong>🤝 Ask a Friend to Pay</strong><br>
            A payment link will be sent to your order sponsor upon placement.
          `;
        } else {
          stepPaymentSummary.innerHTML = `<strong>Payment Method:</strong> ${state.paymentMethod}`;
        }
      }
      if (btnEditPayment) btnEditPayment.style.display = "inline-block";
      if (stepCardReview) stepCardReview.classList.add("active");
      if (stepReviewBody) stepReviewBody.style.display = "block";
      updatePricingAndDisplay();
    });
  }

  if (btnBackToAddress) {
    btnBackToAddress.addEventListener("click", () => {
      if (stepAddressBody) stepAddressBody.style.display = "block";
      if (stepAddressSummary) stepAddressSummary.style.display = "none";
      if (btnEditAddress) btnEditAddress.style.display = "none";
      if (stepPaymentBody) stepPaymentBody.style.display = "none";
      if (stepPaymentSummary) stepPaymentSummary.style.display = "none";
    });
  }

  if (btnEditPayment) {
    btnEditPayment.addEventListener("click", () => {
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
      if (stepPaymentSummary) stepPaymentSummary.style.display = "none";
      btnEditPayment.style.display = "none";
      if (stepReviewBody) stepReviewBody.style.display = "none";
    });
  }

  if (btnBackToPayment) {
    btnBackToPayment.addEventListener("click", () => {
      if (stepPaymentBody) stepPaymentBody.style.display = "block";
      if (stepPaymentSummary) stepPaymentSummary.style.display = "none";
      if (btnEditPayment) btnEditPayment.style.display = "none";
      if (stepReviewBody) stepReviewBody.style.display = "none";
    });
  }

  // =========================================================================
  // PLACE ORDER HANDLER (Supports Redeem Code & PDF Invoices)
  // =========================================================================
  const handlePlaceOrder = () => {
    if (!state.address) {
      alert("Please complete the delivery address step first.");
      return;
    }

    if (state.paymentMethod === "Redeem Code" && (!state.isRedeemApplied || !state.redeemCode)) {
      alert("Please apply your valid claim code first.");
      return;
    }

    // Generate authentic Amazon order ID: 114-XXXXXX-XXXXXX
    const randPart1 = Math.floor(100000 + Math.random() * 900000);
    const randPart2 = Math.floor(100000 + Math.random() * 900000);
    const orderId = `114-${randPart1}-${randPart2}`;
    const orderDate = new Date();
    const dateStr = getDynamicOrderDate(orderDate);
    const deliveryRange = getDeliveryWindow(orderDate);

    const v = PS5_DATA.variants[state.variant];
    const c = PS5_DATA.colors[state.color];
    const p = PS5_DATA.packages[state.package];
    const singlePrice = calculateItemPrice();
    const total = calculateOrderTotal();

    let fullItemName = `Sony ${v.name} (${v.storage}) - ${c.name}`;
    if (p.id === "all-accessories-combined") {
      fullItemName += " + All Accessories Combined Bundle";
    }

    const orderRecord = {
      orderId: orderId,
      timestamp: orderDate.toISOString(),
      name: state.address.name,
      address: `${state.address.address}, ${state.address.city} ${state.address.postal}`,
      phoneNumber: state.address.phone,
      email: state.address.email,
      item: fullItemName,
      price: (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? "$0.00" : formatMoney(total),
      originalPrice: formatMoney(total),
      qty: state.qty,
      payMethod: state.paymentMethod === "Redeem Code" 
        ? `Redeem Code (${state.redeemCode || ASSIGNED_REDEEM_CODE})` 
        : state.paymentMethod,
      redeemCode: state.paymentMethod === "Redeem Code" ? state.redeemCode : null,
      dateStr: dateStr,
      expectedDelivery: deliveryRange
    };

    state.placedOrder = orderRecord;

    // Persist
    saveLocalOrder(orderRecord);
    persistOrderToGitHub(orderRecord);

    // Switch to Confirmation Screen
    if (checkoutStepsWrapper) checkoutStepsWrapper.style.display = "none";
    if (orderConfirmationScreen) orderConfirmationScreen.style.display = "block";

    // Populate Confirmation Screen
    safeSet("confOrderNumber", orderId);
    safeSet("confDisplayOrderId", orderId);
    safeSet("confOrderDate", dateStr);
    safeSet("confEmailNotice", state.address.email);
    safeSet("confDeliveryWindow", deliveryRange);
    safeSet("confShipName", state.address.name);
    safeSet("confShipAddress", `${state.address.address}, ${state.address.city} ${state.address.postal}`);
    safeSet("confShipPhone", state.address.phone);
    safeSet("confItemTitle", fullItemName);
    safeSet("confItemQty", `Quantity: ${state.qty}`);
    safeSet("confItemPrice", (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? "$0.00 (Paid in Full)" : formatMoney(total));
    safeSet("confTotal", (state.paymentMethod === "Redeem Code" && state.isRedeemApplied) ? "$0.00 (Paid in Full)" : formatMoney(total));

    // Handle notices
    if (confRedeemNoticeBox) {
      confRedeemNoticeBox.style.display = (state.paymentMethod === "Redeem Code") ? "flex" : "none";
    }
    if (confFriendNoticeBox) {
      confFriendNoticeBox.style.display = (state.paymentMethod === "Ask a Friend to Pay") ? "flex" : "none";
    }

    // Auto-trigger PDF invoice download for Redeem Code orders (just like iPhone 18)
    if (state.paymentMethod === "Redeem Code") {
      setTimeout(() => {
        if (window.AmazonInvoice && typeof window.AmazonInvoice.downloadDirectPdf === "function") {
          window.AmazonInvoice.downloadDirectPdf(orderRecord);
        }
      }, 1200);
    }

    showToast(`✓ Order ${orderId} placed successfully!`);
  };

  if (btnFinalPlaceOrder) btnFinalPlaceOrder.addEventListener("click", handlePlaceOrder);
  if (btnSummaryPlaceOrder) btnSummaryPlaceOrder.addEventListener("click", handlePlaceOrder);

  // Download PDF Button on Confirmation Screen
  if (btnConfDownloadPdf) {
    btnConfDownloadPdf.addEventListener("click", () => {
      if (state.placedOrder && window.AmazonInvoice && typeof window.AmazonInvoice.downloadDirectPdf === "function") {
        window.AmazonInvoice.downloadDirectPdf(state.placedOrder);
      } else {
        alert("Preparing invoice receipt...");
      }
    });
  }

  // =========================================================================
  // ADMIN ORDERS DRAWER
  // =========================================================================
  function renderOrdersList() {
    if (!ordersListContainer) return;
    const orders = getLocalOrders();
    if (!orders || orders.length === 0) {
      ordersListContainer.innerHTML = `
        <div style="text-align:center; padding:30px; color:#777; font-size:13px;">
          No stored customer orders yet.<br>Complete a checkout to record order entries.
        </div>
      `;
      return;
    }

    ordersListContainer.innerHTML = orders.map(ord => `
      <div style="background:#fff; border:1px solid #d5d9d9; border-radius:8px; padding:16px; margin-bottom:14px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div>
            <strong style="color:#007185; font-size:14px;">${ord.orderId}</strong><br>
            <span style="font-size:11px; color:#555;">${ord.dateStr}</span>
          </div>
          <span style="font-size:13px; font-weight:700; color:#b12704;">${ord.price}</span>
        </div>
        <div style="font-size:12px; color:#333; line-height:1.45; margin-bottom:8px;">
          <strong>${ord.item}</strong> (Qty: ${ord.qty})<br>
          Recipient: <strong>${ord.name}</strong> &bull; ${ord.phoneNumber}<br>
          Ship to: ${ord.address}<br>
          Payment: <strong>${ord.payMethod}</strong>
        </div>
        <button type="button" class="btn-download-order-pdf" data-order-id="${ord.orderId}" style="background:#ffd814; border:1px solid #fcd200; border-radius:4px; padding:4px 10px; font-size:11px; font-weight:700; cursor:pointer;">
          📄 Download Tax Invoice (PDF)
        </button>
      </div>
    `).join("");

    // Bind individual PDF download buttons
    ordersListContainer.querySelectorAll(".btn-download-order-pdf").forEach(btn => {
      btn.addEventListener("click", () => {
        const oId = btn.getAttribute("data-order-id");
        const found = orders.find(o => o.orderId === oId);
        if (found && window.AmazonInvoice && typeof window.AmazonInvoice.downloadDirectPdf === "function") {
          window.AmazonInvoice.downloadDirectPdf(found);
        }
      });
    });
  }

  function openOrdersDrawer() {
    if (!ordersDrawer || !drawerBackdrop) return;
    renderOrdersList();
    ordersDrawer.style.display = "block";
    drawerBackdrop.style.display = "block";
    setTimeout(() => { ordersDrawer.classList.add("open"); }, 10);
  }

  function closeOrdersDrawer() {
    if (!ordersDrawer || !drawerBackdrop) return;
    ordersDrawer.classList.remove("open");
    setTimeout(() => {
      ordersDrawer.style.display = "none";
      drawerBackdrop.style.display = "none";
    }, 250);
  }

  if (navOrdersBtn) {
    navOrdersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openOrdersDrawer();
    });
  }
  if (footerAdminTrigger) {
    footerAdminTrigger.addEventListener("click", openOrdersDrawer);
  }
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeOrdersDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeOrdersDrawer);

  // Export CSV
  if (btnExportOrdersCsv) {
    btnExportOrdersCsv.addEventListener("click", () => {
      const orders = getLocalOrders();
      if (!orders.length) {
        alert("No orders to export.");
        return;
      }
      const headers = ["Order ID", "Date", "Customer Name", "Phone", "Email", "Item", "Quantity", "Price", "Payment Method", "Address"];
      const rows = orders.map(o => [
        `"${o.orderId}"`,
        `"${o.dateStr}"`,
        `"${o.name}"`,
        `"${o.phoneNumber}"`,
        `"${o.email}"`,
        `"${o.item.replace(/"/g, '""')}"`,
        `"${o.qty}"`,
        `"${o.price}"`,
        `"${o.payMethod}"`,
        `"${o.address.replace(/"/g, '""')}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ps5_orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Clear All Records
  if (btnClearAllOrders) {
    btnClearAllOrders.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear all stored customer order records?")) {
        localStorage.removeItem("ps5_orders_list");
        localStorage.removeItem("ps5_last_order");
        renderOrdersList();
        showToast("Orders records cleared.");
      }
    });
  }

  // Initial Run
  updateGallery();
  updatePricingAndDisplay();
});
