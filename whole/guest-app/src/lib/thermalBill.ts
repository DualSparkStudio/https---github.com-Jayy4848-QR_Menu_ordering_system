/**
 * 80mm thermal POS receipt — HTML generator for print / PDF preview
 */

export interface ThermalBillConfig {
  order: any;
  billImage?: string | null;
  billImageLabel?: string;
  logoUrl?: string | null;
  autoPrint?: boolean;
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmt(n: number): string {
  return `₹${(n || 0).toFixed(2)}`;
}

function buildItemsHtml(items: any[]): string {
  if (!items?.length) return '<p class="empty-items">No items</p>';
  return items
    .map((item) => {
      const name = escapeHtml(item.menuItem?.name || 'Item');
      const qty = item.quantity || 1;
      const unit = item.price || 0;
      const lineTotal = unit * qty;
      return `
        <div class="item-row">
          <div class="item-top">
            <span class="item-name">${name}</span>
            <span class="item-amt">${fmt(lineTotal)}</span>
          </div>
          <div class="item-sub">×${qty} @ ${fmt(unit)}</div>
        </div>`;
    })
    .join('');
}

function buildSummaryRows(order: any, r: any): string {
  const sub = order.subtotal || 0;
  const cgstPct = r.cgstPercentage || 0;
  const sgstPct = r.sgstPercentage || 0;
  const cgstAmt = (order.cgstAmount || 0) > 0 ? order.cgstAmount : (sub * cgstPct) / 100;
  const sgstAmt = (order.sgstAmount || 0) > 0 ? order.sgstAmount : (sub * sgstPct) / 100;
  const rows: string[] = [];

  rows.push(`<div class="sum-row"><span>Subtotal</span><span>${fmt(sub)}</span></div>`);

  if ((order.taxAmount || 0) > 0) {
    rows.push(`<div class="sum-row"><span>Tax (${r.taxPercentage || 0}%)</span><span>${fmt(order.taxAmount)}</span></div>`);
  }
  if ((order.serviceCharge || 0) > 0) {
    rows.push(`<div class="sum-row"><span>Service (${r.serviceChargePercentage || 0}%)</span><span>${fmt(order.serviceCharge)}</span></div>`);
  }
  if (cgstAmt > 0 || cgstPct > 0) {
    rows.push(`<div class="sum-row"><span>CGST (${cgstPct}%)</span><span>${fmt(cgstAmt)}</span></div>`);
  }
  if (sgstAmt > 0 || sgstPct > 0) {
    rows.push(`<div class="sum-row"><span>SGST (${sgstPct}%)</span><span>${fmt(sgstAmt)}</span></div>`);
  }
  if ((order.discountAmount || 0) > 0) {
    rows.push(`<div class="sum-row discount"><span>Discount</span><span>−${fmt(order.discountAmount)}</span></div>`);
  }

  return rows.join('');
}

export function buildThermalBillDocument(config: ThermalBillConfig): string {
  const { order, billImage, billImageLabel = 'Scan to Pay', logoUrl, autoPrint = true } = config;
  const r = order.restaurant || {};
  const orderShort = escapeHtml(order.orderNumber?.slice(-8) || '—');
  const created = new Date(order.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const logoBlock = logoUrl
    ? `<div class="logo-wrap"><img src="${escapeHtml(logoUrl)}" alt="" class="logo-img" /></div>`
    : `<div class="logo-placeholder" aria-hidden="true">◆</div>`;

  const qrBlock = billImage
    ? `
    <div class="qr-section">
      <p class="qr-label">${escapeHtml(billImageLabel)}</p>
      <div class="qr-box">
        <img src="${billImage.replace(/"/g, '&quot;')}" alt="Payment QR" class="qr-img" />
      </div>
      <p class="qr-hint">Scan with any UPI app</p>
    </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bill ${orderShort}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Courier New', Courier, 'Liberation Mono', monospace;
      background: #d1d5db;
      color: #000;
      line-height: 1.35;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      align-items: center;
      padding: 12px 16px;
      background: #1f2937;
      border-bottom: 1px solid #374151;
    }

    .toolbar button {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .toolbar button:hover { opacity: 0.9; }
    .btn-print { background: #f97316; color: #fff; }
    .btn-pdf { background: #fff; color: #1f2937; }
    .btn-close { background: #4b5563; color: #fff; }

    .preview-wrap {
      display: flex;
      justify-content: center;
      padding: 24px 12px 48px;
      min-height: calc(100vh - 56px);
    }

    /* ── Receipt: exactly 80mm ── */
    .receipt {
      width: 80mm;
      max-width: 80mm;
      min-width: 80mm;
      background: #fff;
      padding: 3.5mm 3mm 4mm;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }

    .logo-wrap, .logo-placeholder {
      text-align: center;
      margin-bottom: 4px;
    }

    .logo-img {
      max-width: 22mm;
      max-height: 14mm;
      object-fit: contain;
    }

    .logo-placeholder {
      font-size: 18px;
      color: #9ca3af;
      letter-spacing: 2px;
    }

    .store-name {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .store-meta {
      text-align: center;
      font-size: 9.5px;
      color: #333;
      line-height: 1.45;
    }

    .rule {
      border: none;
      border-top: 1px dashed #000;
      margin: 5px 0;
    }

    .rule-solid {
      border: none;
      border-top: 2px solid #000;
      margin: 6px 0 4px;
    }

    .order-block {
      text-align: center;
      padding: 2px 0;
    }

    .order-id {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .order-table {
      font-size: 10px;
      margin-top: 2px;
    }

    .order-time {
      font-size: 9.5px;
      color: #444;
      margin-top: 2px;
    }

    .items-head {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      font-weight: 700;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      padding-bottom: 2px;
      border-bottom: 1px dotted #999;
    }

    .item-row {
      padding: 5px 0;
      border-bottom: 1px dotted #ddd;
    }

    .item-row:last-child { border-bottom: none; }

    .item-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
    }

    .item-name {
      font-size: 11px;
      font-weight: 700;
      flex: 1;
      word-break: break-word;
    }

    .item-amt {
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .item-sub {
      font-size: 9.5px;
      color: #555;
      margin-top: 2px;
    }

    .empty-items {
      font-size: 10px;
      text-align: center;
      padding: 8px 0;
    }

    .summary {
      margin-top: 4px;
    }

    .sum-row {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      padding: 2px 0;
    }

    .sum-row.discount span:last-child { font-weight: 700; }

    .total-block {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 2px solid #000;
    }

    .total-label {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.08em;
    }

    .total-amt {
      font-size: 16px;
      font-weight: 700;
    }

    .footer-msg {
      text-align: center;
      font-size: 9.5px;
      line-height: 1.5;
      padding: 4px 0;
    }

    .footer-msg p { margin: 2px 0; }

    .qr-section {
      margin-top: 8px;
      text-align: center;
    }

    .qr-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .qr-box {
      display: inline-block;
      padding: 4mm;
      border: 2px dashed #000;
      background: #fafafa;
      max-width: 100%;
    }

    .qr-img {
      display: block;
      width: 68mm;
      max-width: 100%;
      height: auto;
      max-height: 78mm;
      object-fit: contain;
      margin: 0 auto;
    }

    .qr-hint {
      font-size: 8.5px;
      color: #555;
      margin-top: 5px;
    }

    .receipt-end {
      text-align: center;
      font-size: 8px;
      color: #888;
      margin-top: 8px;
      letter-spacing: 0.2em;
    }

    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }

      html, body {
        width: 80mm;
        margin: 0;
        padding: 0;
        background: #fff !important;
      }

      .no-print {
        display: none !important;
      }

      .preview-wrap {
        padding: 0;
        min-height: 0;
        display: block;
      }

      .receipt {
        width: 80mm;
        max-width: 80mm;
        min-width: 80mm;
        margin: 0;
        padding: 2mm 2.5mm 3mm;
        box-shadow: none;
      }

      .qr-box {
        border-color: #000;
        background: #fff;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button type="button" class="btn-print" onclick="doPrint()">🖨️ Print Bill</button>
    <button type="button" class="btn-pdf" onclick="doPdf()">📄 Save as PDF</button>
    <button type="button" class="btn-close" onclick="window.close()">✕ Close</button>
  </div>

  <div class="preview-wrap">
    <article class="receipt" id="receipt">
      ${logoBlock}
      <h1 class="store-name">${escapeHtml(r.name || 'Restaurant')}</h1>
      <div class="store-meta">
        ${r.address ? `<div>${escapeHtml(r.address)}</div>` : ''}
        ${r.phone ? `<div>Tel: ${escapeHtml(r.phone)}</div>` : ''}
      </div>

      <hr class="rule" />

      <div class="order-block">
        <div class="order-id">ORDER #${orderShort}</div>
        <div class="order-table">Table ${escapeHtml(order.table?.tableNumber || '—')} · ${escapeHtml(order.table?.section || 'Main')}</div>
        <div class="order-time">${escapeHtml(created)}</div>
      </div>

      <hr class="rule" />

      <div class="items-head"><span>Item</span><span>Amt</span></div>
      ${buildItemsHtml(order.items)}

      <hr class="rule" />

      <div class="summary">
        ${buildSummaryRows(order, r)}
        <div class="total-block">
          <span class="total-label">TOTAL</span>
          <span class="total-amt">${fmt(order.totalAmount)}</span>
        </div>
      </div>

      <hr class="rule" />

      <div class="footer-msg">
        <p>Thank you for dining with us!</p>
        <p>Please visit again</p>
      </div>

      ${qrBlock}

      <div class="receipt-end">— · —</div>
    </article>
  </div>

  <script>
    function doPrint() {
      window.print();
    }
    function doPdf() {
      window.print();
    }
    ${autoPrint ? `window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 350);
    });` : ''}
  </script>
</body>
</html>`;
}

export function openThermalBill(config: ThermalBillConfig): Window | null {
  const win = window.open('', '_blank', 'width=420,height=720,scrollbars=yes');
  if (!win) {
    alert('Please allow pop-ups to print the bill.');
    return null;
  }
  win.document.write(buildThermalBillDocument(config));
  win.document.close();
  return win;
}

export function getBillImageFromStorage(restaurantId: string) {
  if (typeof window === 'undefined' || !restaurantId) return { image: null as string | null, label: 'Scan to Pay' };
  return {
    image: localStorage.getItem(`billImage_${restaurantId}`),
    label: localStorage.getItem(`billImageLabel_${restaurantId}`) || 'Scan to Pay',
  };
}


