/**
 * amazon-translate.js
 * Universal Authentic Amazon.com IP-Based Translation & Localization Engine
 * - Detects visitor device location via IP address on page load
 * - Prompts user with Amazon-style banner asking to translate to their native language
 * - Integrates with Google Translate tool (zero intrusive default Google frames)
 * - Remembers user language preference across all storefront pages
 * - Seamlessly hooks into Amazon header language selector (Globe dropdown)
 */

(function () {
  'use strict';

  // Prevent multiple executions on the same page
  if (window.__amazonTranslateLoaded) return;
  window.__amazonTranslateLoaded = true;

  // Comprehensive Country Code to Language Mapping
  const COUNTRY_TO_LANG = {
    // Southeast Asia
    PH: { code: 'tl', name: 'Filipino (Tagalog)', native: 'Filipino' },
    ID: { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    VN: { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    TH: { code: 'th', name: 'Thai', native: 'ไทย' },
    MY: { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },

    // East Asia
    JP: { code: 'ja', name: 'Japanese', native: '日本語' },
    KR: { code: 'ko', name: 'Korean', native: '한국어' },
    CN: { code: 'zh-CN', name: 'Chinese (Simplified)', native: '中文 (简体)' },
    TW: { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文' },
    HK: { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文' },

    // South Asia
    IN: { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    BD: { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    PK: { code: 'ur', name: 'Urdu', native: 'اردو' },

    // Spanish-speaking Americas & Spain
    ES: { code: 'es', name: 'Spanish', native: 'Español' },
    MX: { code: 'es', name: 'Spanish', native: 'Español' },
    CO: { code: 'es', name: 'Spanish', native: 'Español' },
    AR: { code: 'es', name: 'Spanish', native: 'Español' },
    PE: { code: 'es', name: 'Spanish', native: 'Español' },
    CL: { code: 'es', name: 'Spanish', native: 'Español' },
    VE: { code: 'es', name: 'Spanish', native: 'Español' },
    EC: { code: 'es', name: 'Spanish', native: 'Español' },
    GT: { code: 'es', name: 'Spanish', native: 'Español' },
    DO: { code: 'es', name: 'Spanish', native: 'Español' },
    CU: { code: 'es', name: 'Spanish', native: 'Español' },
    BO: { code: 'es', name: 'Spanish', native: 'Español' },
    HN: { code: 'es', name: 'Spanish', native: 'Español' },
    PY: { code: 'es', name: 'Spanish', native: 'Español' },
    SV: { code: 'es', name: 'Spanish', native: 'Español' },
    NI: { code: 'es', name: 'Spanish', native: 'Español' },
    CR: { code: 'es', name: 'Spanish', native: 'Español' },
    PA: { code: 'es', name: 'Spanish', native: 'Español' },
    UY: { code: 'es', name: 'Spanish', native: 'Español' },
    PR: { code: 'es', name: 'Spanish', native: 'Español' },

    // Europe
    FR: { code: 'fr', name: 'French', native: 'Français' },
    BE: { code: 'fr', name: 'French', native: 'Français' },
    DE: { code: 'de', name: 'German', native: 'Deutsch' },
    AT: { code: 'de', name: 'German', native: 'Deutsch' },
    CH: { code: 'de', name: 'German', native: 'Deutsch' },
    IT: { code: 'it', name: 'Italian', native: 'Italiano' },
    PT: { code: 'pt', name: 'Portuguese', native: 'Português' },
    BR: { code: 'pt', name: 'Portuguese', native: 'Português' },
    RU: { code: 'ru', name: 'Russian', native: 'Русский' },
    UA: { code: 'uk', name: 'Ukrainian', native: 'Українська' },
    PL: { code: 'pl', name: 'Polish', native: 'Polski' },
    NL: { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    TR: { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    GR: { code: 'el', name: 'Greek', native: 'Ελληνικά' },
    RO: { code: 'ro', name: 'Romanian', native: 'Română' },
    CZ: { code: 'cs', name: 'Czech', native: 'Čeština' },
    HU: { code: 'hu', name: 'Hungarian', native: 'Magyar' },
    SE: { code: 'sv', name: 'Swedish', native: 'Svenska' },
    NO: { code: 'no', name: 'Norwegian', native: 'Norsk' },
    DK: { code: 'da', name: 'Danish', native: 'Dansk' },
    FI: { code: 'fi', name: 'Finnish', native: 'Suomi' },

    // Middle East
    SA: { code: 'ar', name: 'Arabic', native: 'العربية' },
    AE: { code: 'ar', name: 'Arabic', native: 'العربية' },
    EG: { code: 'ar', name: 'Arabic', native: 'العربية' },
    QA: { code: 'ar', name: 'Arabic', native: 'العربية' },
    KW: { code: 'ar', name: 'Arabic', native: 'العربية' },
    OM: { code: 'ar', name: 'Arabic', native: 'العربية' },
    IL: { code: 'he', name: 'Hebrew', native: 'עברית' },

    // English-speaking nations (no translation prompt required)
    US: { code: 'en', name: 'English', native: 'English' },
    GB: { code: 'en', name: 'English', native: 'English' },
    CA: { code: 'en', name: 'English', native: 'English' },
    AU: { code: 'en', name: 'English', native: 'English' },
    NZ: { code: 'en', name: 'English', native: 'English' },
    IE: { code: 'en', name: 'English', native: 'English' },
    SG: { code: 'en', name: 'English', native: 'English' },
    ZA: { code: 'en', name: 'English', native: 'English' }
  };

  // Browser language code fallback mapping
  const NAV_LANG_MAP = {
    tl: { code: 'tl', name: 'Filipino (Tagalog)', native: 'Filipino' },
    fil: { code: 'tl', name: 'Filipino (Tagalog)', native: 'Filipino' },
    es: { code: 'es', name: 'Spanish', native: 'Español' },
    fr: { code: 'fr', name: 'French', native: 'Français' },
    de: { code: 'de', name: 'German', native: 'Deutsch' },
    it: { code: 'it', name: 'Italian', native: 'Italiano' },
    pt: { code: 'pt', name: 'Portuguese', native: 'Português' },
    ja: { code: 'ja', name: 'Japanese', native: '日本語' },
    ko: { code: 'ko', name: 'Korean', native: '한국어' },
    zh: { code: 'zh-CN', name: 'Chinese', native: '中文' },
    hi: { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    vi: { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    id: { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    th: { code: 'th', name: 'Thai', native: 'ไทย' },
    ms: { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
    ar: { code: 'ar', name: 'Arabic', native: 'العربية' },
    ru: { code: 'ru', name: 'Russian', native: 'Русский' },
    uk: { code: 'uk', name: 'Ukrainian', native: 'Українська' },
    tr: { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    pl: { code: 'pl', name: 'Polish', native: 'Polski' },
    nl: { code: 'nl', name: 'Dutch', native: 'Nederlands' }
  };

  // Cookie helpers
  function setGoogtransCookie(langCode) {
    const host = window.location.hostname;
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    if (host && host.includes('.')) {
      document.cookie = `googtrans=/en/${langCode}; domain=.${host}; path=/;`;
      document.cookie = `googtrans=/en/${langCode}; domain=${host}; path=/;`;
    }
  }

  function clearGoogtransCookie() {
    const host = window.location.hostname;
    const past = '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=${past}`;
    if (host && host.includes('.')) {
      document.cookie = `googtrans=${past} domain=.${host};`;
      document.cookie = `googtrans=${past} domain=${host};`;
    }
  }

  // Check saved state immediately on execution
  const hasDecided = localStorage.getItem('amazon_translation_decided') === 'true';
  const savedLang = localStorage.getItem('amazon_preferred_lang');

  if (hasDecided && savedLang && savedLang !== 'en') {
    setGoogtransCookie(savedLang);
  } else if (hasDecided && savedLang === 'en') {
    clearGoogtransCookie();
  }

  // Google Translate initialization function on window
  window.googleTranslateElementInit = function () {
    try {
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,tl,es,fr,de,it,pt,ar,ja,ko,zh-CN,zh-TW,hi,vi,th,id,ms,ru,bn,ta,te,mr,ur,tr,pl,nl,el,ro,cs,hu,sv,no,da,fi,he,uk',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false
        }, 'google_translate_element');
      }
    } catch (e) {
      console.warn('[Translate] Init warning:', e);
    }
  };

  // Ensure Google Translate script & anchor are mounted
  function mountGoogleTranslateEngine() {
    let el = document.getElementById('google_translate_element');
    if (!el) {
      el = document.createElement('div');
      el.id = 'google_translate_element';
      if (document.body) {
        document.body.insertBefore(el, document.body.firstChild);
      } else {
        (document.documentElement || document).appendChild(el);
      }
    }
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.top = '-9999px';
    el.style.width = '1px';
    el.style.height = '1px';
    el.style.overflow = 'hidden';
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
    el.className = 'notranslate';

    if (!document.getElementById('google_translate_script')) {
      const s = document.createElement('script');
      s.id = 'google_translate_script';
      s.type = 'text/javascript';
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(s);
    }
  }

  // Programmatically trigger Google Translate
  function triggerGoogleTranslate(targetCode) {
    if (targetCode === 'en') {
      clearGoogtransCookie();
      localStorage.setItem('amazon_preferred_lang', 'en');
      localStorage.setItem('amazon_translation_decided', 'true');
      updateNavUi('EN');
      setTimeout(() => window.location.reload(), 250);
      return;
    }

    setGoogtransCookie(targetCode);
    localStorage.setItem('amazon_preferred_lang', targetCode);
    localStorage.setItem('amazon_translation_decided', 'true');
    updateNavUi(targetCode.toUpperCase());

    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = targetCode;
      combo.dispatchEvent(new Event('change'));
      combo.dispatchEvent(new Event('input'));
    } else {
      // If select element is not yet injected by Google Translate, reload to let cookie take effect
      let tries = 0;
      const chk = setInterval(() => {
        tries++;
        const c = document.querySelector('.goog-te-combo');
        if (c) {
          clearInterval(chk);
          c.value = targetCode;
          c.dispatchEvent(new Event('change'));
          c.dispatchEvent(new Event('input'));
        } else if (tries > 6) {
          clearInterval(chk);
          window.location.reload();
        }
      }, 200);
    }
  }

  // Update navigation language flag / text
  function updateNavUi(codeText) {
    const textEl = document.getElementById('navCurrentLangText');
    if (textEl) textEl.textContent = codeText;
  }

  // Fast, Multi-Provider IP Geolocation Detection
  async function detectDeviceLocation() {
    // 1. Session Storage cache check
    try {
      const cached = sessionStorage.getItem('amazon_user_country_code');
      if (cached && cached.length === 2) return cached;
    } catch (_) {}

    // Provider 1: api.country.is (fastest, lightweight JSON)
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch('https://api.country.is/', { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.country && data.country.length === 2) {
          const cc = data.country.toUpperCase();
          sessionStorage.setItem('amazon_user_country_code', cc);
          return cc;
        }
      }
    } catch (_) {}

    // Provider 2: ipwho.is (CORS enabled, highly reliable)
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch('https://ipwho.is/', { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.country_code && data.country_code.length === 2) {
          const cc = data.country_code.toUpperCase();
          sessionStorage.setItem('amazon_user_country_code', cc);
          return cc;
        }
      }
    } catch (_) {}

    // Provider 3: ipapi.co
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.country_code && data.country_code.length === 2) {
          const cc = data.country_code.toUpperCase();
          sessionStorage.setItem('amazon_user_country_code', cc);
          return cc;
        }
      }
    } catch (_) {}

    // Fallback: Browser Navigator language
    try {
      const nav = (navigator.language || navigator.userLanguage || '').toUpperCase();
      if (nav.includes('-')) {
        const cc = nav.split('-')[1];
        if (cc && cc.length === 2) return cc;
      }
    } catch (_) {}

    return null;
  }

  // Determine target language from Country Code or Navigator
  function resolveTargetLanguage(countryCode) {
    if (countryCode && COUNTRY_TO_LANG[countryCode]) {
      return COUNTRY_TO_LANG[countryCode];
    }
    // Fallback by navigator.language
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    for (const prefix in NAV_LANG_MAP) {
      if (nav.startsWith(prefix)) {
        return NAV_LANG_MAP[prefix];
      }
    }
    return null;
  }

  // Construct or bind the Amazon Translation Banner
  function showTranslationPromptBanner(targetLang) {
    if (!targetLang || targetLang.code === 'en') return;

    let banner = document.getElementById('amazonTranslateBanner');

    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'amazon-translate-banner notranslate';
      banner.id = 'amazonTranslateBanner';
      banner.style.display = 'none';

      banner.innerHTML = `
        <div class="atb-inner notranslate">
          <div class="atb-content">
            <span class="atb-icon">🌐</span>
            <div class="atb-text">
              <strong id="atbTitle">Translate this page?</strong>
              <span id="atbSub">Would you like to translate this page to <span id="atbTargetLangName" style="font-weight:700; color:#ff9900;"></span>?</span>
            </div>
          </div>
          <div class="atb-actions">
            <button class="atb-btn-translate" id="btnAcceptTranslate">Translate</button>
            <button class="atb-btn-dismiss" id="btnDismissTranslate">Keep in English</button>
            <button class="atb-close" id="btnCloseTranslateBanner" aria-label="Close">&times;</button>
          </div>
        </div>
      `;

      // Insert right after <header>, or at top of <body>
      const header = document.querySelector('header');
      if (header && header.nextSibling) {
        header.parentNode.insertBefore(banner, header.nextSibling);
      } else if (header) {
        header.parentNode.appendChild(banner);
      } else {
        document.body.insertBefore(banner, document.body.firstChild);
      }
    }

    // Populate banner texts
    const targetName = targetLang.native ? `${targetLang.native} (${targetLang.name})` : targetLang.name;
    const langDisplayEl = document.getElementById('atbTargetLangName');
    if (langDisplayEl) langDisplayEl.textContent = targetName;

    const btnAccept = document.getElementById('btnAcceptTranslate');
    if (btnAccept) {
      btnAccept.textContent = `Translate to ${targetLang.native || targetLang.name}`;
      btnAccept.onclick = function (e) {
        e.preventDefault();
        banner.style.display = 'none';
        triggerGoogleTranslate(targetLang.code);
      };
    }

    const btnDismiss = document.getElementById('btnDismissTranslate');
    if (btnDismiss) {
      btnDismiss.onclick = function (e) {
        e.preventDefault();
        banner.style.display = 'none';
        localStorage.setItem('amazon_translation_decided', 'true');
        localStorage.setItem('amazon_preferred_lang', 'en');
        clearGoogtransCookie();
      };
    }

    const btnClose = document.getElementById('btnCloseTranslateBanner');
    if (btnClose) {
      btnClose.onclick = function (e) {
        e.preventDefault();
        banner.style.display = 'none';
        localStorage.setItem('amazon_translation_decided', 'true');
        localStorage.setItem('amazon_preferred_lang', 'en');
        clearGoogtransCookie();
      };
    }

    // Display banner smoothly
    banner.style.display = 'block';
  }

  // Setup Header Language Dropdown (`#navLangBtn`)
  function setupHeaderLanguageDropdown() {
    const navLangBtn = document.getElementById('navLangBtn');
    if (!navLangBtn) return;

    navLangBtn.addEventListener('click', (e) => {
      if (e.target.closest('#langDropdown')) return;
      navLangBtn.classList.toggle('active');
      navLangBtn.classList.toggle('open');
      const dd = document.getElementById('langDropdown');
      if (dd) dd.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!navLangBtn.contains(e.target)) {
        navLangBtn.classList.remove('active');
        navLangBtn.classList.remove('open');
        const dd = document.getElementById('langDropdown');
        if (dd) dd.classList.remove('open');
      }
    });

    const radioLabels = document.querySelectorAll('.lang-radio-label');
    radioLabels.forEach(label => {
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        radioLabels.forEach(l => l.classList.remove('active'));
        label.classList.add('active');

        const input = label.querySelector('input');
        if (input) input.checked = true;

        const lang = label.getAttribute('data-lang') || (input ? input.value : 'en');
        if (navLangBtn) {
          navLangBtn.classList.remove('active');
          navLangBtn.classList.remove('open');
        }
        const dd = document.getElementById('langDropdown');
        if (dd) dd.classList.remove('open');

        const banner = document.getElementById('amazonTranslateBanner');
        if (banner) banner.style.display = 'none';

        triggerGoogleTranslate(lang);
      });
    });

    // Support for list-item style dropdowns (#langSelectList li, .lang-list li)
    const listItems = document.querySelectorAll('#langSelectList li, .lang-list li');
    listItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        listItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const lang = item.getAttribute('data-lang') || 'en';
        if (navLangBtn) {
          navLangBtn.classList.remove('active');
          navLangBtn.classList.remove('open');
        }
        const dd = document.getElementById('langDropdown');
        if (dd) dd.classList.remove('open');

        const banner = document.getElementById('amazonTranslateBanner');
        if (banner) banner.style.display = 'none';

        triggerGoogleTranslate(lang);
      });
    });

    // Sync radio and list items with saved language
    const current = localStorage.getItem('amazon_preferred_lang') || 'en';
    updateNavUi(current.toUpperCase());
    radioLabels.forEach(l => {
      const code = l.getAttribute('data-lang');
      if (code === current) {
        l.classList.add('active');
        const inp = l.querySelector('input');
        if (inp) inp.checked = true;
      } else {
        l.classList.remove('active');
      }
    });
    listItems.forEach(i => {
      const code = i.getAttribute('data-lang');
      if (code === current) {
        i.classList.add('active');
      } else {
        i.classList.remove('active');
      }
    });
  }

  // Public API
  window.setAmazonLanguage = triggerGoogleTranslate;
  window.resetAmazonTranslationPrompt = function () {
    localStorage.removeItem('amazon_translation_decided');
    localStorage.removeItem('amazon_preferred_lang');
    sessionStorage.removeItem('amazon_user_country_code');
    clearGoogtransCookie();
    window.location.reload();
  };

  // Main Orchestrator on DOM Ready
  function init() {
    mountGoogleTranslateEngine();
    setupHeaderLanguageDropdown();

    const decided = localStorage.getItem('amazon_translation_decided') === 'true';
    const currentLang = localStorage.getItem('amazon_preferred_lang');

    if (decided && currentLang && currentLang !== 'en') {
      updateNavUi(currentLang.toUpperCase());
      return;
    }

    if (decided) {
      updateNavUi('EN');
      return;
    }

    // Not decided: Detect location by IP and ask user
    detectDeviceLocation().then(countryCode => {
      const targetLang = resolveTargetLanguage(countryCode);
      if (targetLang && targetLang.code !== 'en') {
        showTranslationPromptBanner(targetLang);
      }
    }).catch(err => {
      console.warn('[Translate] Location detection notice:', err);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
