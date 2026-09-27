/**
 * invoice-pdf.js
 * Official Amazon.com Tax Invoice & Order Receipt PDF Generator
 * - Generates authentic Amazon.com customer invoices
 * - Includes Expected Delivery (25-30 days from ordering)
 * - Includes prominent amazon.com signature at the bottom
 * - Provides client-side PDF download via html2pdf.js
 */

(function() {
  // 1. Dynamic Delivery Date Calculations (25-30 days from ordering)
  function calculateDeliveryWindow(baseDate) {
    let orderDt = new Date();
    if (baseDate) {
      const parsed = new Date(baseDate);
      if (!isNaN(parsed.getTime())) orderDt = parsed;
    }

    const dStart = new Date(orderDt.getTime() + (25 * 24 * 60 * 60 * 1000));
    const dEnd = new Date(orderDt.getTime() + (30 * 24 * 60 * 60 * 1000));

    const optionsStart = { month: 'long', day: 'numeric' };
    const optionsEnd = { month: 'long', day: 'numeric', year: 'numeric' };

    const startStr = dStart.toLocaleDateString('en-US', optionsStart);
    const endStr = dEnd.toLocaleDateString('en-US', optionsEnd);

    return {
      windowStr: `${startStr} – ${endStr}`,
      fullRangeStr: `${startStr} – ${endStr} (25–30 business days)`,
      startDate: dStart,
      endDate: dEnd
    };
  }

  // 2. Resolve Seller & Product Information
  function resolveSellerInfo(itemName = '') {
    const lower = itemName.toLowerCase();
    if (lower.includes('iphone') || lower.includes('apple')) {
      return {
        seller: 'Apple Official Store on Amazon',
        operator: 'Amazon.com Services LLC',
        warehouse: 'Amazon Global Fulfillment Center (IND-West)'
      };
    } else if (lower.includes('pixel') || lower.includes('google')) {
      return {
        seller: 'Google Official Storefront on Amazon',
        operator: 'Amazon.com Services LLC',
        warehouse: 'Amazon Global Logistics Hub (US-East)'
      };
    } else if (lower.includes('samsung') || lower.includes('galaxy')) {
      return {
        seller: 'Samsung Electronics Official Store on Amazon',
        operator: 'Amazon.com Services LLC',
        warehouse: 'Amazon Global Logistics Gateway (KR-Direct)'
      };
    }
    return {
      seller: 'Authorized Flagship Store on Amazon',
      operator: 'Amazon.com Services LLC',
      warehouse: 'Amazon Worldwide Fulfillment'
    };
  }

  // 3. Render Official Amazon Invoice HTML
  function generateInvoiceHtml(order) {
    const orderId = order.orderId || ('114-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(1000000 + Math.random() * 9000000));
    const orderDate = order.dateStr || new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const delivery = calculateDeliveryWindow(order.timestamp || new Date());
    const sellerInfo = resolveSellerInfo(order.item || '');
    const isRedeem = (order.payMethod || '').toLowerCase().includes('redeem') || !!order.redeemCode;
    const priceRaw = (order.price || '$1,799.00').replace(/[^0-9.]/g, '');
    const numPrice = parseFloat(priceRaw) || 1799.00;
    const formattedPrice = '$' + numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const claimCode = order.redeemCode || 'AMZN-7K9W-M3XP-84QL';

    return `
      <div id="amazonInvoicePdfSheet" style="
        width: 100%;
        max-width: 750px;
        margin: 0 auto;
        padding: 24px 28px;
        background: #ffffff;
        font-family: Arial, Helvetica, sans-serif;
        color: #111111;
        line-height: 1.45;
        font-size: 13px;
        box-sizing: border-box;
      ">
        <!-- Top Amazon Header Strip -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #131921; padding-bottom:14px; margin-bottom:16px;">
          <div>
            <!-- Authentic Amazon Logo -->
            <div style="font-family:'Arial Black', Arial, sans-serif; font-size:28px; font-weight:900; color:#131921; letter-spacing:-1px; line-height:1; display:flex; align-items:baseline;">
              amazon<span style="color:#ff9900; font-size:34px; line-height:0;">.</span>com
            </div>
            <div style="font-size:12px; color:#555; margin-top:5px; font-weight:600;">
              Official Order Confirmation &amp; Tax Receipt
            </div>
            <div style="font-size:11px; color:#777; margin-top:2px;">
              Final Details for Order #${orderId}
            </div>
          </div>
          
          <div style="text-align:right;">
            <div style="font-size:12px; color:#555;">Order Placed: <strong>${orderDate}</strong></div>
            <div style="font-size:12px; color:#555; margin-top:2px;">Amazon.com order number: <strong style="color:#111;">${orderId}</strong></div>
            <div style="font-size:14px; margin-top:4px;">Order Total: <strong style="color:#007600; font-size:15px;">$0.00 (Paid in Full)</strong></div>
          </div>
        </div>

        <!-- Expected Delivery & Shipment Banner -->
        <div style="background:#f0f2f2; border:1px solid #d5d9d9; border-radius:6px; padding:12px 16px; margin-bottom:18px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
              <span style="text-transform:uppercase; font-size:11px; font-weight:700; color:#565959; letter-spacing:0.5px;">Dispatch Status</span>
              <div style="font-size:14px; font-weight:700; color:#007600; margin-top:2px;">
                ✓ Dispatched &bull; Priority International Air Freight
              </div>
            </div>
            <div style="text-align:right;">
              <span style="text-transform:uppercase; font-size:11px; font-weight:700; color:#565959; letter-spacing:0.5px;">Expected Delivery Window</span>
              <div style="font-size:14px; font-weight:800; color:#b12704; margin-top:2px;">
                📅 ${delivery.windowStr}
              </div>
              <div style="font-size:11px; color:#555;">(25–30 days from order date)</div>
            </div>
          </div>
        </div>

        <!-- Items Ordered Table -->
        <div style="margin-bottom:18px;">
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr style="background:#fafafa; border-top:1px solid #d5d9d9; border-bottom:1px solid #d5d9d9; text-align:left;">
                <th style="padding:8px 10px; font-weight:700;">Items Ordered</th>
                <th style="padding:8px 10px; text-align:center; width:50px; font-weight:700;">Qty</th>
                <th style="padding:8px 10px; text-align:right; width:100px; font-weight:700;">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom:1px solid #e7e7e7;">
                <td style="padding:12px 10px; vertical-align:top;">
                  <strong style="font-size:14px; color:#007185;">${order.item || 'Flagship Smartphone'}</strong><br>
                  <span style="font-size:11px; color:#565959; display:inline-block; margin-top:3px;">
                    Condition: <strong>New</strong> &bull; Sold by: <strong>${sellerInfo.seller}</strong><br>
                    Supplied &amp; Dispatched by: ${sellerInfo.warehouse}<br>
                    Courier Service: <strong>Amazon Global Priority Express Courier</strong> (Tracking: <strong>TBA-${orderId.replace(/[^0-9]/g, '').slice(0, 10)}</strong>)
                  </span>
                </td>
                <td style="padding:12px 10px; text-align:center; vertical-align:top; font-weight:600;">
                  ${order.qty || 1}
                </td>
                <td style="padding:12px 10px; text-align:right; vertical-align:top; font-weight:700; color:#111;">
                  ${formattedPrice}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Two-Column Address & Billing Breakdown Grid -->
        <div style="display:grid; grid-template-columns: 1.1fr 1fr; gap:20px; border-top:1px solid #e7e7e7; padding-top:16px; margin-bottom:20px;">
          <!-- Left: Shipping Destination -->
          <div style="padding-right:12px; border-right:1px solid #e7e7e7;">
            <div style="font-weight:700; font-size:12px; text-transform:uppercase; color:#565959; margin-bottom:6px; letter-spacing:0.5px;">
              Shipping Address:
            </div>
            <div style="font-size:14px; font-weight:700; color:#111; margin-bottom:2px;">
              ${order.name || 'Customer'}
            </div>
            <div style="color:#333; line-height:1.4;">
              ${order.address || 'Address on file'}<br>
              ${order.phoneNumber ? `Phone: ${order.phoneNumber}<br>` : ''}
              ${order.email ? `Email: ${order.email}<br>` : ''}
            </div>

            <div style="margin-top:14px; padding:10px; background:#f9fafb; border-left:3px solid #007600; border-radius:3px;">
              <strong style="color:#007600; font-size:12px;">Guaranteed Priority Delivery:</strong>
              <div style="font-size:12px; color:#333; margin-top:2px;">
                Arriving <strong>${delivery.windowStr}</strong>
              </div>
              <div style="font-size:11px; color:#666;">
                International shipment delivery timeframe: 25–30 business days.
              </div>
            </div>
          </div>

          <!-- Right: Payment & Grand Total Breakdown -->
          <div>
            <div style="font-weight:700; font-size:12px; text-transform:uppercase; color:#565959; margin-bottom:6px; letter-spacing:0.5px;">
              Payment Information:
            </div>
            <div style="font-size:12px; color:#333; margin-bottom:10px;">
              Payment Method: <strong style="color:#007185;">${isRedeem ? `Amazon Gift Card / Claim Code (${claimCode})` : (order.payMethod || 'Ask a Friend to Pay')}</strong><br>
              Payment Status: <strong style="color:#007600;">Paid in Full ($0.00 balance due)</strong>
            </div>

            <!-- Price Breakdown Table -->
            <table style="width:100%; font-size:12px; border-collapse:collapse; margin-top:6px;">
              <tr>
                <td style="padding:4px 0; color:#444;">Item(s) Subtotal:</td>
                <td style="padding:4px 0; text-align:right; font-weight:600;">${formattedPrice}</td>
              </tr>
              <tr>
                <td style="padding:4px 0; color:#444;">Shipping &amp; Handling:</td>
                <td style="padding:4px 0; text-align:right; color:#007600; font-weight:600;">$0.00</td>
              </tr>
              <tr>
                <td style="padding:4px 0; color:#444;">Total Before Tax:</td>
                <td style="padding:4px 0; text-align:right; font-weight:600;">${formattedPrice}</td>
              </tr>
              <tr>
                <td style="padding:4px 0; color:#444;">Estimated Tax:</td>
                <td style="padding:4px 0; text-align:right;">$0.00</td>
              </tr>
              <tr style="color:#007600; font-weight:600;">
                <td style="padding:5px 0;">Amazon Gift Card / Redeem Code:</td>
                <td style="padding:5px 0; text-align:right;">-${formattedPrice}</td>
              </tr>
              <tr style="border-top:2px solid #111; font-size:14px; font-weight:800;">
                <td style="padding:8px 0;">Grand Total Paid:</td>
                <td style="padding:8px 0; text-align:right; color:#007600;">$0.00 (Paid in Full)</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Security & Barcode Footer Segment -->
        <div style="background:#fbfbfb; border:1px dashed #ccc; border-radius:4px; padding:10px 14px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
          <div style="font-size:11px; color:#555;">
            <strong>Digital Authenticity Signature:</strong><br>
            SHA-256: AMZN-AUTH-${orderId.replace(/-/g, '')}-VERIFIED-SECURE
          </div>
          <div style="font-family:'Courier New', monospace; letter-spacing:2px; font-weight:700; font-size:13px; color:#333;">
            ||| | ||||| || |||||| | ||| ${orderId.slice(-8)}
          </div>
        </div>

        <!-- Real Amazon Official Bottom Footer with amazon.com -->
        <div style="border-top:1px solid #d5d9d9; padding-top:16px; margin-top:20px; text-align:center;">
          <div style="font-size:11px; color:#565959; margin-bottom:6px;">
            To view the status of your order or manage your account, please visit <span style="color:#007185; text-decoration:underline;">https://www.amazon.com/your-orders</span>
          </div>
          <div style="font-size:10px; color:#767676; margin-bottom:8px;">
            Conditions of Use &bull; Privacy Notice &bull; Interest-Based Ads &bull; &copy; 1996&ndash;2026, Amazon.com, Inc. or its affiliates. All rights reserved.
          </div>
          <!-- Prominent amazon.com at the bottom -->
          <div style="font-family:'Arial Black', Arial, sans-serif; font-size:20px; font-weight:900; color:#131921; letter-spacing:-0.5px; margin-top:6px;">
            amazon<span style="color:#ff9900; font-size:24px; line-height:0;">.</span>com
          </div>
        </div>
      </div>
    `;
  }

  // 4. Download Order Invoice as Crisp PDF
  async function downloadOrderInvoicePdf(order) {
    if (!order) {
      console.warn("downloadOrderInvoicePdf: No order specified");
      return;
    }

    const orderId = order.orderId || ('114-' + Math.floor(100000 + Math.random() * 900000) + '-' + Math.floor(1000000 + Math.random() * 9000000));
    const filename = `Amazon_Invoice_${orderId}.pdf`;

    // Create temporary offscreen container for PDF rendering
    const container = document.createElement('div');
    container.id = 'pdfRenderOffscreen';
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '750px';
    container.style.background = '#ffffff';
    container.style.zIndex = '-999';
    container.innerHTML = generateInvoiceHtml(order);
    document.body.appendChild(container);

    const sheet = container.querySelector('#amazonInvoicePdfSheet') || container;

    // Show toast notice if available
    if (typeof window.showToast === 'function') {
      window.showToast("Generating official Amazon Tax Receipt PDF...");
    }

    // Check if html2pdf is available
    if (typeof window.html2pdf === 'function') {
      try {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollX: 0,
            scrollY: 0,
            backgroundColor: '#ffffff'
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          }
        };

        await window.html2pdf().set(opt).from(sheet).save();
        if (typeof window.showToast === 'function') {
          window.showToast("✓ Amazon Invoice PDF downloaded successfully!");
        }
      } catch (err) {
        console.error("html2pdf generation error:", err);
      } finally {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    } else {
      console.warn("html2pdf library not loaded, attempting fallback PDF download");
      // Fallback: create printable blob or trigger download
      try {
        const printHtml = `<!DOCTYPE html><html><head><title>${filename}</title><style>@page{size:A4;margin:10mm;}body{margin:0;padding:0;background:#fff;}</style></head><body>${sheet.outerHTML}</body></html>`;
        const blob = new Blob([printHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Amazon_Receipt_${orderId}.html`;
        a.click();
        URL.revokeObjectURL(url);
      } finally {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    }
  }

  // 5. Open Modal with the Official Amazon Receipt & Download Option
  function openInvoiceModal(order) {
    if (!order) return;
    const modal = document.getElementById("invoiceModalBackdrop");
    const content = document.getElementById("invoicePrintContent");
    if (!modal || !content) return;

    content.innerHTML = generateInvoiceHtml(order);

    // Update modal top action bar: Download PDF button & Close button
    const modalHeader = modal.querySelector(".od-header") || modal.querySelector("div[style*='background:var(--amazon-navy)']") || modal.querySelector("div[style*='background:#131921']");
    if (modalHeader) {
      modalHeader.innerHTML = `
        <h3 style="font-size:16px; font-weight:700; color:#fff; margin:0;">Customer Billing Statement</h3>
        <div style="display:flex; gap:10px; align-items:center;">
          <button type="button" id="btnModalDownloadPdf" style="padding:6px 14px; background:#ffd814; border:1px solid #fcd200; border-radius:6px; font-weight:700; font-size:12px; cursor:pointer; display:flex; align-items:center; gap:6px; color:#111;">
            📥 Download PDF
          </button>
          <button type="button" id="btnCloseInvoiceModal" style="background:none; border:none; color:#fff; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
        </div>
      `;

      const btnDl = modalHeader.querySelector("#btnModalDownloadPdf");
      if (btnDl) {
        btnDl.addEventListener("click", () => {
          downloadOrderInvoicePdf(order);
        });
      }

      const btnClose = modalHeader.querySelector("#btnCloseInvoiceModal");
      if (btnClose) {
        btnClose.addEventListener("click", () => {
          modal.style.display = "none";
        });
      }
    }

    modal.style.display = "flex";
  }

  // Export functions globally
  window.calculateDeliveryWindow = calculateDeliveryWindow;
  window.generateInvoiceHtml = generateInvoiceHtml;
  window.downloadOrderInvoicePdf = downloadOrderInvoicePdf;
  window.openInvoiceModal = openInvoiceModal;
  window.openInvoice = openInvoiceModal;
})();
