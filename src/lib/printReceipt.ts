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
    unitName?: string;
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

export interface ReceiptPrintSettings {
  paperWidthMm: number;
  marginMm: number;
  scalePercent: number;
}

export const RECEIPT_PRINT_SETTINGS_KEY = "portal-kasir-receipt-print-settings";
export const DEFAULT_RECEIPT_PRINT_SETTINGS: ReceiptPrintSettings = {
  paperWidthMm: 80,
  marginMm: 2,
  scalePercent: 100,
};

export function readReceiptPrintSettings(): ReceiptPrintSettings {
  if (typeof window === "undefined") return DEFAULT_RECEIPT_PRINT_SETTINGS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(RECEIPT_PRINT_SETTINGS_KEY) || "null");
    if (!saved) return DEFAULT_RECEIPT_PRINT_SETTINGS;
    const clamp = (value: unknown, fallback: number, min: number, max: number) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : fallback;
    };
    return {
      paperWidthMm: clamp(saved.paperWidthMm, 80, 40, 120),
      marginMm: clamp(saved.marginMm, 2, 0, 10),
      scalePercent: clamp(saved.scalePercent, 100, 70, 130),
    };
  } catch {
    return DEFAULT_RECEIPT_PRINT_SETTINGS;
  }
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

export function buildReceiptHTML(receipt: ReceiptData, store: StoreInfo, printSettings: ReceiptPrintSettings): string {
  const paperWidthMm = printSettings.paperWidthMm;
  const marginMm = printSettings.marginMm;
  const scale = printSettings.scalePercent / 100;
  const itemRows = receipt.items
    .map(
      (item) => `
      <tr>
        <td class="item-name" colspan="3">${esc(item.product?.name || "Item")}${item.unitName ? ` (${esc(item.unitName)})` : ""}</td>
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
<style id="receipt-page-size">@page { size: ${paperWidthMm}mm 300mm; margin: 0; }</style>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${paperWidthMm}mm;
    font-family: 'Courier New', Courier, monospace;
    font-size: ${12 * scale}px;
    line-height: 1.4;
    color: #000;
    padding: ${marginMm}mm;
  }
  .center { text-align: center; }
  .store-name {
    font-size: ${16 * scale}px;
    font-weight: bold;
    margin-bottom: 2px;
  }
  .store-info {
    font-size: ${11 * scale}px;
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
    font-size: ${13 * scale}px;
  }
  .meta {
    font-size: ${11 * scale}px;
    color: #333;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  .item-name {
    font-weight: bold;
    padding-top: 4px;
    font-size: ${12 * scale}px;
  }
  .item-detail {
    font-size: ${11 * scale}px;
    color: #333;
    padding-left: 8px;
  }
  .item-price {
    text-align: right;
    font-size: ${12 * scale}px;
    white-space: nowrap;
  }
  .totals td {
    padding: ${2 * scale}px 0;
    font-size: ${12 * scale}px;
  }
  .totals .label { text-align: left; }
  .totals .val { text-align: right; white-space: nowrap; }
  .totals .grand { font-size: ${15 * scale}px; font-weight: bold; border-top: 1px dashed #000; padding-top: ${4 * scale}px; }
  .payment-section td {
    font-size: ${11 * scale}px;
    padding: ${1 * scale}px 0;
  }
  .payment-section .val { text-align: right; }
  .footer {
    text-align: center;
    font-size: ${11 * scale}px;
    margin-top: ${8 * scale}px;
    color: #555;
  }
  .footer .thank-you {
    font-size: ${13 * scale}px;
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
  <script>
    function fitReceiptPage() {
      const heightMm = Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) * 25.4 / 96 + 4);
      document.getElementById("receipt-page-size").textContent = "@page { size: ${paperWidthMm}mm " + heightMm + "mm; margin: 0; }";
    }
    window.addEventListener("load", fitReceiptPage);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitReceiptPage);
  </script>
</body>
</html>`;
}

type ReceiptLine = { text: string; rightText?: string; align?: "left" | "center" | "right"; bold?: boolean; divider?: boolean; size?: number };

function pdfSafeText(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, " ").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?");
}

/** Build a real PDF receipt with a thermal-roll width and content-based height. */
export async function createReceiptPdf(
  receipt: ReceiptData,
  store: StoreInfo,
  detectedPaperWidthMm?: number,
  receiptFormat: "DEFAULT" | "FAJAR_CLIENT" = "DEFAULT",
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const paperWidthMm = Number.isFinite(detectedPaperWidthMm)
    ? Math.min(120, Math.max(40, Number(detectedPaperWidthMm)))
    : readReceiptPrintSettings().paperWidthMm;
  if (receiptFormat === "FAJAR_CLIENT") return createFajarReceiptPdf(jsPDF, receipt, paperWidthMm);
  const fontSize = paperWidthMm <= 62 ? 8 : 9;
  const lineHeightMm = fontSize * 0.42;
  const paddingMm = 3;
  const printableWidthMm = paperWidthMm - paddingMm * 2;
  const maxColumns = Math.max(20, Math.floor(printableWidthMm / (fontSize * 0.6 * 25.4 / 72)));
  const lines: ReceiptLine[] = [];
  const addWrapped = (text: string | undefined, align: ReceiptLine["align"] = "left", bold = false) => {
    const safe = pdfSafeText(text || "").trim();
    if (!safe) return;
    const words = safe.split(/\s+/);
    let current = "";
    for (const word of words) {
      let remaining = word;
      while (remaining.length > maxColumns) {
        if (current) { lines.push({ text: current, align, bold }); current = ""; }
        lines.push({ text: remaining.slice(0, maxColumns), align, bold });
        remaining = remaining.slice(maxColumns);
      }
      if (current && current.length + remaining.length + 1 > maxColumns) {
        lines.push({ text: current, align, bold });
        current = remaining;
      } else {
        current = current ? `${current} ${remaining}` : remaining;
      }
    }
    if (current) lines.push({ text: current, align, bold });
  };
  const divider = () => lines.push({ text: "-".repeat(maxColumns), divider: true });
  const pair = (label: string, value: string, bold = false) => {
    const safeLabel = pdfSafeText(label);
    const safeValue = pdfSafeText(value);
    if (safeLabel.length + safeValue.length + 1 <= maxColumns) {
      lines.push({ text: `${safeLabel}${" ".repeat(maxColumns - safeLabel.length - safeValue.length)}${safeValue}`, bold });
    } else {
      lines.push({ text: safeLabel, bold });
      lines.push({ text: safeValue, align: "right", bold });
    }
  };

  addWrapped(store.name || "Toko", "center", true);
  addWrapped(store.address, "center");
  addWrapped(store.phone, "center");
  divider();
  addWrapped(receipt.receiptId, "left", true);
  addWrapped(fmtDate(receipt.createdAt));
  addWrapped(receipt.cashier?.name ? `Kasir: ${receipt.cashier.name}` : undefined);
  divider();
  for (const item of receipt.items) {
    addWrapped(`${item.product?.name || "Item"}${item.unitName ? ` (${item.unitName})` : ""}`, "left", true);
    const quantity = Number(item.quantity) || 0;
    const unitPrice = quantity ? item.subtotal / quantity : 0;
    const detail = `${quantity} x ${fmtCurrency(unitPrice)}`;
    const price = fmtCurrency(item.subtotal);
    if (detail.length + price.length + 1 <= maxColumns) {
      lines.push({ text: `${detail}${" ".repeat(maxColumns - detail.length - price.length)}${price}`, align: "left" });
    } else {
      lines.push({ text: detail });
      lines.push({ text: price, align: "right" });
    }
  }
  divider();
  pair("Subtotal", fmtCurrency(receipt.subtotal));
  if (receipt.discount) pair("Diskon", `-${fmtCurrency(receipt.discount)}`);
  pair("Pajak", fmtCurrency(receipt.tax));
  divider();
  pair("TOTAL", fmtCurrency(receipt.total), true);
  divider();
  const payments = receipt.payments?.length
    ? receipt.payments
    : [{ id: "payment", method: receipt.paymentMethod, amount: receipt.amountPaid }];
  for (const payment of payments) pair(payment.method, fmtCurrency(payment.amount));
  pair("Bayar", fmtCurrency(receipt.amountPaid), true);
  pair("Kembali", fmtCurrency(receipt.changeDue));
  divider();
  addWrapped("Terima Kasih!", "center", true);
  addWrapped("Barang yang sudah dibeli", "center");
  addWrapped("tidak dapat dikembalikan", "center");

  const paperHeightMm = Math.max(45, paddingMm * 2 + lines.length * lineHeightMm + 3);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [paperWidthMm, paperHeightMm], compress: true });
  pdf.setFont("courier", "normal");
  pdf.setFontSize(fontSize);
  let y = paddingMm + fontSize * 25.4 / 72;
  for (const line of lines) {
    if (line.divider) {
      pdf.setLineDashPattern([0.7, 0.6], 0);
      pdf.setLineWidth(0.15);
      pdf.line(paddingMm, y - 1, paperWidthMm - paddingMm, y - 1);
      pdf.setLineDashPattern([], 0);
    } else {
      pdf.setFont("courier", line.bold ? "bold" : "normal");
      pdf.text(line.text, line.align === "center" ? paperWidthMm / 2 : line.align === "right" ? paperWidthMm - paddingMm : paddingMm, y, {
        align: line.align || "left",
        maxWidth: printableWidthMm,
      });
    }
    y += lineHeightMm;
  }
  return pdf.output("blob");
}

function createFajarReceiptPdf(
  JsPDF: typeof import("jspdf").jsPDF,
  receipt: ReceiptData,
  paperWidthMm: number,
): Blob {
  const paddingMm = paperWidthMm <= 62 ? 3 : 4;
  const baseSize = paperWidthMm <= 62 ? 8.5 : 10.5;
  const printableWidthMm = paperWidthMm - paddingMm * 2;
  const maxColumns = Math.max(18, Math.floor(printableWidthMm / (baseSize * 0.6 * 25.4 / 72)));
  const lines: ReceiptLine[] = [];
  const addWrapped = (text: string | undefined, options: Pick<ReceiptLine, "align" | "bold" | "size"> = {}) => {
    const safe = pdfSafeText(text || "").trim();
    if (!safe) return;
    const size = options.size || baseSize;
    const columns = Math.max(16, Math.floor(printableWidthMm / (size * 0.6 * 25.4 / 72)));
    let current = "";
    for (const word of safe.split(/\s+/)) {
      let remaining = word;
      while (remaining.length > columns) {
        if (current) { lines.push({ text: current, ...options }); current = ""; }
        lines.push({ text: remaining.slice(0, columns), ...options });
        remaining = remaining.slice(columns);
      }
      if (current && current.length + remaining.length + 1 > columns) {
        lines.push({ text: current, ...options });
        current = remaining;
      } else {
        current = current ? `${current} ${remaining}` : remaining;
      }
    }
    if (current) lines.push({ text: current, ...options });
  };
  const divider = () => lines.push({ text: "-".repeat(maxColumns), divider: true, size: baseSize });
  const addPair = (label: string, value: string, options: Pick<ReceiptLine, "bold" | "size"> = {}) => {
    const safeLabel = pdfSafeText(label);
    const safeValue = pdfSafeText(value);
    if (safeLabel.length + safeValue.length + 1 <= maxColumns) {
      lines.push({ text: safeLabel, rightText: safeValue, ...options });
    } else {
      addWrapped(safeLabel, options);
      lines.push({ text: safeValue, align: "right", ...options });
    }
  };

  const created = new Date(receipt.createdAt);
  const dateText = Number.isNaN(created.getTime())
    ? receipt.createdAt
    : new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Jakarta" }).format(created);
  const timeText = Number.isNaN(created.getTime())
    ? ""
    : new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" }).format(created);
  const cashier = receipt.cashier?.name || "";
  const payments = receipt.payments?.length ? receipt.payments : [{ id: "payment", method: receipt.paymentMethod, amount: receipt.amountPaid }];
  const method = payments.map((payment) => {
    const value = payment.method?.trim() || "Cash";
    if (/^(cash|tunai)$/i.test(value)) return "Cash";
    if (/^qris$/i.test(value)) return "QRIS";
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }).filter(Boolean).join(" + ") || "Cash";
  const cashierMeta = dateText.length + cashier.length + 1 <= maxColumns;

  // These details belong to the Fajar-only receipt template, not the shared store receipt.
  addWrapped("Toko Fajar", { align: "center", bold: true, size: baseSize + 4 });
  addWrapped("M737+XG5, Panyingkiran Kidul, Kec. Cantigi, Kabupaten Indramayu, Jawa Barat 45258, Indonesia", { align: "center", size: Math.max(8, baseSize - 1) });
  addWrapped("+62 823 93495020", { align: "center", size: Math.max(8, baseSize - 1) });
  divider();
  if (cashierMeta) addPair(dateText, cashier, { size: baseSize });
  else {
    addWrapped(dateText, { size: baseSize });
    if (cashier) addWrapped(cashier, { align: "right", size: baseSize });
  }
  if (timeText) addWrapped(timeText, { size: baseSize });
  addWrapped(`No.${receipt.receiptId}`, { size: baseSize });
  divider();

  for (const item of receipt.items) {
    addWrapped(`${item.product?.name || "Item"}${item.unitName ? ` (${item.unitName})` : ""}`, { bold: true, size: baseSize + 0.5 });
    const quantity = Number(item.quantity) || 0;
    const unitPrice = quantity ? item.subtotal / quantity : 0;
    const quantityText = quantity.toLocaleString("id-ID", { maximumFractionDigits: 2 });
    const unitPriceText = unitPrice.toLocaleString("en-US", { maximumFractionDigits: 0 });
    addPair(`${quantityText} x ${unitPriceText}`, fmtCurrency(item.subtotal), { size: baseSize });
  }
  divider();
  addPair("Total", fmtCurrency(receipt.total), { size: baseSize + 0.5 });
  addPair(`Bayar (${method})`, fmtCurrency(receipt.amountPaid), { size: baseSize + 0.5 });
  addPair("Kembali", fmtCurrency(receipt.changeDue), { size: baseSize + 0.5 });
  lines.push({ text: "", size: baseSize + 2 });
  lines.push({ text: "", size: baseSize + 2 });
  lines.push({ text: "", size: baseSize + 2 });
  addWrapped("Link Kritik dan Saran", { align: "center", size: baseSize });
  addWrapped("olshopin.com/f/2751517", { align: "center", size: baseSize });

  const lineHeight = (line: ReceiptLine) => Math.max(3.6, (line.size || baseSize) * 0.42);
  const paperHeightMm = Math.max(50, paddingMm * 2 + lines.reduce((height, line) => height + lineHeight(line), 0) + 2);
  const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: [paperWidthMm, paperHeightMm], compress: true });
  let y = paddingMm;
  for (const line of lines) {
    const size = line.size || baseSize;
    const height = lineHeight(line);
    if (line.divider) {
      const dividerY = y + height * 0.55;
      pdf.setDrawColor(30);
      pdf.setLineWidth(0.16);
      pdf.setLineDashPattern([0.8, 0.7], 0);
      pdf.line(paddingMm, dividerY, paperWidthMm - paddingMm, dividerY);
      pdf.setLineDashPattern([], 0);
    } else if (line.text) {
      pdf.setFont("courier", line.bold ? "bold" : "normal");
      pdf.setFontSize(size);
      const baseline = y + height * 0.82;
      if (line.rightText !== undefined) {
        pdf.text(line.text, paddingMm, baseline, { maxWidth: printableWidthMm / 2 });
        pdf.text(line.rightText, paperWidthMm - paddingMm, baseline, { align: "right", maxWidth: printableWidthMm / 2 });
      } else {
        const x = line.align === "center" ? paperWidthMm / 2 : line.align === "right" ? paperWidthMm - paddingMm : paddingMm;
        pdf.text(line.text, x, baseline, { align: line.align || "left", maxWidth: printableWidthMm });
      }
    }
    y += height;
  }
  return pdf.output("blob");
}
