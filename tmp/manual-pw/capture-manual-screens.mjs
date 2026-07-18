import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = "http://localhost:3001";
const outDir = path.resolve("output/manual/screenshots");

async function ensureDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function annotate(page, items = []) {
  await page.evaluate((items) => {
    document.querySelectorAll("[data-manual-highlight]").forEach((el) => el.remove());
    const style = document.createElement("style");
    style.setAttribute("data-manual-highlight", "style");
    style.textContent = `
      .manual-highlight-box {
        position: fixed;
        z-index: 2147483646;
        pointer-events: none;
        border: 3px solid #f97316;
        border-radius: 10px;
        box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.08), 0 0 0 4px rgba(249, 115, 22, 0.18);
      }
      .manual-highlight-label {
        position: fixed;
        z-index: 2147483647;
        pointer-events: none;
        max-width: 280px;
        border-radius: 999px;
        background: #f97316;
        color: white;
        padding: 6px 10px;
        font: 700 12px/1.2 Arial, sans-serif;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
      }
    `;
    document.body.appendChild(style);
    function findElement(selector) {
      const selectors = selector.split(",").map((part) => part.trim()).filter(Boolean);
      for (const current of selectors) {
        if (current.startsWith("text=")) {
          const needle = current.slice(5).replace(/^["']|["']$/g, "");
          const found = [...document.querySelectorAll("body *")]
            .find((el) => el.children.length === 0 && el.textContent?.includes(needle));
          if (found) return found;
        }
        const hasTextMatch = current.match(/^(.*):has-text\(["'](.+)["']\)$/);
        if (hasTextMatch) {
          const tag = hasTextMatch[1] || "*";
          const needle = hasTextMatch[2];
          const found = [...document.querySelectorAll(tag)]
            .find((el) => el.textContent?.includes(needle));
          if (found) return found;
        }
        try {
          const found = document.querySelector(current);
          if (found) return found;
        } catch {
          continue;
        }
      }
      return null;
    }

    for (const [index, item] of items.entries()) {
      const el = findElement(item.selector);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const pad = item.pad ?? 5;
      const box = document.createElement("div");
      box.className = "manual-highlight-box";
      box.setAttribute("data-manual-highlight", `box-${index}`);
      box.style.left = `${Math.max(2, rect.left - pad)}px`;
      box.style.top = `${Math.max(2, rect.top - pad)}px`;
      box.style.width = `${Math.min(window.innerWidth - rect.left - 4, rect.width + pad * 2)}px`;
      box.style.height = `${Math.min(window.innerHeight - rect.top - 4, rect.height + pad * 2)}px`;
      document.body.appendChild(box);
      const label = document.createElement("div");
      label.className = "manual-highlight-label";
      label.setAttribute("data-manual-highlight", `label-${index}`);
      label.textContent = item.label;
      label.style.left = `${Math.max(8, Math.min(window.innerWidth - 290, rect.left - pad))}px`;
      label.style.top = `${Math.max(8, rect.top - pad - 34)}px`;
      document.body.appendChild(label);
    }
  }, items);
}

async function snap(page, name, items = [], fullPage = false) {
  await annotate(page, items);
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage });
  await page.evaluate(() => document.querySelectorAll("[data-manual-highlight]").forEach((el) => el.remove()));
}

async function login(page, email, password) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /Masuk/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  await waitReady(page);
}

async function goto(page, route) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  await waitReady(page);
}

async function main() {
  await ensureDir();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await waitReady(page);
  await snap(page, "01-login", [
    { selector: 'input[type="email"]', label: "Alamat email pengguna" },
    { selector: 'input[type="password"]', label: "Kata sandi" },
    { selector: 'button[type="submit"]', label: "Tombol Masuk" },
  ]);

  await login(page, "ayu@nusantarabakery.com", "owner123");
  await snap(page, "02-dashboard", [
    { selector: 'aside nav', label: "Menu modul aplikasi" },
    { selector: "main > div > div:first-child", label: "Ringkasan KPI toko" },
    { selector: 'button[aria-label="Open notifications"]', label: "Panel notifikasi" },
  ]);

  await goto(page, "/dashboard/pos");
  await page.locator('button:has-text("Roti")').first().click().catch(async () => {
    await page.locator("main button").filter({ hasText: /Rp/ }).first().click();
  });
  await page.locator('input[type="number"]').first().fill("50000").catch(() => {});
  await snap(page, "03-pos", [
    { selector: 'input[placeholder*="Cari"]', label: "Pencarian produk" },
    { selector: "main button", label: "Kartu produk untuk ditambahkan" },
    { selector: 'text=Keranjang Belanja', label: "Keranjang dan total pembayaran" },
    { selector: 'button:has-text("Bayar")', label: "Bayar dan cetak struk" },
  ]);

  await goto(page, "/dashboard/products");
  await snap(page, "04-products", [
    { selector: 'input[placeholder="Cari produk..."]', label: "Cari produk" },
    { selector: "select", label: "Filter kategori" },
    { selector: 'button:has-text("Tambah Produk")', label: "Tambah produk" },
    { selector: "table", label: "Daftar produk" },
  ]);
  await page.getByRole("button", { name: /Tambah Produk/i }).click();
  await waitReady(page);
  await snap(page, "05-product-form", [
    { selector: 'input[required]', label: "Field wajib produk" },
    { selector: 'input[type="file"]', label: "Unggah gambar produk" },
    { selector: 'button[type="submit"]', label: "Simpan produk" },
  ]);
  await page.keyboard.press("Escape").catch(() => {});

  await goto(page, "/dashboard/categories");
  await snap(page, "06-categories", [
    { selector: 'button:has-text("Tambah Kategori")', label: "Tambah kategori" },
    { selector: "main div.grid", label: "Kartu kategori dan jumlah produk" },
  ]);

  await goto(page, "/dashboard/inventory");
  await snap(page, "07-inventory", [
    { selector: 'button:has-text("Mutasi Stok")', label: "Catat mutasi stok" },
    { selector: "table", label: "Riwayat stok masuk, keluar, dan penyesuaian" },
  ]);
  await page.getByRole("button", { name: /Mutasi Stok/i }).click();
  await waitReady(page);
  await snap(page, "08-inventory-form", [
    { selector: "select", label: "Jenis mutasi dan produk" },
    { selector: 'input[type="number"]', label: "Jumlah stok" },
    { selector: 'button[type="submit"]', label: "Simpan mutasi" },
  ]);

  await goto(page, "/dashboard/transactions");
  await snap(page, "09-transactions", [
    { selector: 'input[type="date"]', label: "Filter tanggal transaksi" },
    { selector: "table", label: "Riwayat transaksi" },
    { selector: 'button:has(svg)', label: "Lihat detail transaksi" },
  ]);

  await goto(page, "/dashboard/customers");
  await snap(page, "10-customers", [
    { selector: 'input[placeholder="Cari pelanggan..."]', label: "Cari pelanggan" },
    { selector: 'button:has-text("Tambah Pelanggan")', label: "Tambah pelanggan" },
    { selector: "main div.grid", label: "Kartu data pelanggan" },
  ]);

  await goto(page, "/dashboard/suppliers");
  await snap(page, "11-suppliers", [
    { selector: 'button:has-text("Tambah Pemasok")', label: "Tambah pemasok" },
    { selector: "table", label: "Daftar pemasok" },
  ]);

  await goto(page, "/dashboard/reports");
  await snap(page, "12-reports", [
    { selector: 'input[type="date"]', label: "Periode laporan" },
    { selector: "main > div > div:nth-child(2)", label: "Ringkasan pendapatan dan laba" },
    { selector: "main > div > div:nth-child(3)", label: "Grafik dan rincian penjualan" },
  ]);

  await goto(page, "/dashboard/accounting");
  await snap(page, "13-accounting-profit-loss", [
    { selector: 'button:has-text("Laba Rugi")', label: "Tab Laba Rugi" },
    { selector: 'button:has-text("Neraca")', label: "Tab Neraca Keuangan" },
    { selector: 'button:has-text("Biaya")', label: "Tab Biaya Operasional" },
    { selector: "main > div > div:nth-child(3)", label: "Kartu laba rugi" },
  ]);
  await page.getByRole("button", { name: /Biaya Operasional/i }).click();
  await waitReady(page);
  await snap(page, "14-accounting-expenses", [
    { selector: 'button:has-text("Catat Pengeluaran")', label: "Catat pengeluaran" },
    { selector: 'input[type="date"]', label: "Filter tanggal biaya" },
  ]);

  await goto(page, "/dashboard/employees");
  await snap(page, "15-employees", [
    { selector: 'button:has-text("Tambah Karyawan")', label: "Tambah karyawan" },
    { selector: "table", label: "Daftar pengguna dan peran" },
  ]);

  await goto(page, "/dashboard/settings");
  await snap(page, "16-settings", [
    { selector: 'text=Profil Toko', label: "Profil toko" },
    { selector: 'text=Metode Pembayaran', label: "Aktif/nonaktif metode pembayaran" },
    { selector: 'button:has-text("Simpan Perubahan")', label: "Simpan pengaturan" },
  ], true);

  await page.getByRole("button", { name: /Keluar/i }).click();
  await waitReady(page);
  await login(page, "admin@kasirpro.com", "admin123");
  await goto(page, "/dashboard/admin");
  await snap(page, "17-platform-admin", [
    { selector: "main > div > div:first-child", label: "Statistik platform" },
    { selector: "select", label: "Ubah paket tenant" },
    { selector: 'button:has-text("Tangguhkan"), button:has-text("Aktifkan")', label: "Aktifkan/tangguhkan tenant" },
  ], true);

  await browser.close();
  console.log(`Saved screenshots to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
