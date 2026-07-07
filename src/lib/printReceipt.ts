/**
 * printReceipt.ts
 * ─────────────────────────────────────────────────────────
 * Generates a thermal-receipt–formatted HTML document inside
 * a hidden iframe, then calls window.print() on that iframe
 * so only the receipt is sent to the printer.
 *
 * Works with any printer the OS recognises (USB/network
 * thermal printers like Epson TM-T82, Star TSP, Xprinter, etc.)
 * Targets 80 mm paper width by default.
 */

export interface ReceiptData {
  receiptId: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    subtotal: number;
    product?: { name?: string; sku?: string };
  }[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  paymentMethod: string;
  payments?: { id: string; method: string; amount: number }[];
  cashier?: { name?: string };
}

export interface StoreInfo {
  name?: string;
  address?: string;
  phone?: string;
  logo?: string;
}

function esc(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function buildReceiptHTML(receipt: ReceiptData, store: StoreInfo): string {
  const itemRows = receipt.items
    .map(
      (item) => `
      <tr>
        <td class="item-name" colspan="3">${esc(item.product?.name || "Item")}</td>
      </tr>
      <tr>
        <td class="item-detail">${item.quantity} x ${fmtCurrency(item.subtotal / (item.quantity || 1))}</td>
        <td></td>
        <td class="item-price">${fmtCurrency(item.subtotal)}</td>
      </tr>`,
    )
    .join("");

  const paymentRows = receipt.payments?.length
    ? receipt.payments
        .map(
          (p) =>
            `<tr><td colspan="2">${esc(p.method)}</td><td class="val">${fmtCurrency(p.amount)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="2">${esc(receipt.paymentMethod)}</td><td class="val">${fmtCurrency(receipt.amountPaid)}</td></tr>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>Receipt ${esc(receipt.receiptId)}</title>
<style>
  @page {
    size: 80mm auto;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 80mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #000;
    padding: 4mm 3mm;
  }
  .center { text-align: center; }
  .store-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 2px;
  }
  .store-info {
    font-size: 11px;
    color: #333;
    margin-bottom: 2px;
  }
  .divider {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .receipt-id {
    font-weight: bold;
    font-size: 13px;
  }
  .meta {
    font-size: 11px;
    color: #333;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  .item-name {
    font-weight: bold;
    padding-top: 4px;
    font-size: 12px;
  }
  .item-detail {
    font-size: 11px;
    color: #333;
    padding-left: 8px;
  }
  .item-price {
    text-align: right;
    font-size: 12px;
    white-space: nowrap;
  }
  .totals td {
    padding: 2px 0;
    font-size: 12px;
  }
  .totals .label { text-align: left; }
  .totals .val { text-align: right; white-space: nowrap; }
  .totals .grand { font-size: 15px; font-weight: bold; border-top: 1px dashed #000; padding-top: 4px; }
  .payment-section td {
    font-size: 11px;
    padding: 1px 0;
  }
  .payment-section .val { text-align: right; }
  .footer {
    text-align: center;
    font-size: 11px;
    margin-top: 8px;
    color: #555;
  }
  .footer .thank-you {
    font-size: 13px;
    font-weight: bold;
    color: #000;
    margin-bottom: 2px;
  }
</style>
</head>
<body>
  <!-- Store Header -->
  <div class="center">
    <div class="store-name">${esc(store.name || "Store")}</div>
    ${store.address ? `<div class="store-info">${esc(store.address)}</div>` : ""}
    ${store.phone ? `<div class="store-info">Tel: ${esc(store.phone)}</div>` : ""}
  </div>

  <hr class="divider"/>

  <!-- Receipt Meta -->
  <div>
    <div class="receipt-id">${esc(receipt.receiptId)}</div>
    <div class="meta">${fmtDate(receipt.createdAt)}</div>
    ${receipt.cashier?.name ? `<div class="meta">Kasir: ${esc(receipt.cashier.name)}</div>` : ""}
  </div>

  <hr class="divider"/>

  <!-- Items -->
  <table>
    ${itemRows}
  </table>

  <hr class="divider"/>

  <!-- Totals -->
  <table class="totals">
    <tr>
      <td class="label" colspan="2">Subtotal</td>
      <td class="val">${fmtCurrency(receipt.subtotal)}</td>
    </tr>
    ${receipt.discount ? `<tr><td class="label" colspan="2">Diskon</td><td class="val">-${fmtCurrency(receipt.discount)}</td></tr>` : ""}
    <tr>
      <td class="label" colspan="2">Pajak</td>
      <td class="val">${fmtCurrency(receipt.tax)}</td>
    </tr>
    <tr>
      <td class="grand" colspan="2">TOTAL</td>
      <td class="grand val">${fmtCurrency(receipt.total)}</td>
    </tr>
  </table>

  <hr class="divider"/>

  <!-- Payment -->
  <table class="payment-section">
    ${paymentRows}
    <tr>
      <td colspan="2"><strong>Bayar</strong></td>
      <td class="val"><strong>${fmtCurrency(receipt.amountPaid)}</strong></td>
    </tr>
    <tr>
      <td colspan="2">Kembali</td>
      <td class="val">${fmtCurrency(receipt.changeDue)}</td>
    </tr>
  </table>

  <hr class="divider"/>

  <!-- Footer -->
  <div class="footer">
    <div class="thank-you">Terima Kasih!</div>
    <div>Barang yang sudah dibeli</div>
    <div>tidak dapat dikembalikan</div>
  </div>
</body>
</html>`;
}

/**
 * Print a receipt by injecting a hidden iframe and calling
 * print() on it. The iframe is removed after the print
 * dialog closes (or after a timeout fallback).
 */
export function printReceipt(receipt: ReceiptData, store: StoreInfo): void {
  // Don't attempt server-side
  if (typeof window === "undefined") return;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-10000px";
  iframe.style.left = "-10000px";
  iframe.style.width = "80mm";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  const html = buildReceiptHTML(receipt, store);
  doc.open();
  doc.write(html);
  doc.close();

  // Allow the browser to render, then print
  const cleanup = () => {
    try {
      document.body.removeChild(iframe);
    } catch {
      // already removed
    }
  };

  // Small delay to let fonts/styles render inside iframe
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn("Receipt print failed:", err);
    }
    // Clean up after the print dialog closes.
    // onafterprint fires when the dialog closes on supported browsers.
    if (iframe.contentWindow) {
      iframe.contentWindow.onafterprint = cleanup;
    }
    // Fallback: remove after 60 s if onafterprint never fires
    setTimeout(cleanup, 60_000);
  }, 300);
}
