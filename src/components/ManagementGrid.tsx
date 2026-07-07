import { Tags, Pencil, Trash2, Users, Truck, Settings, Store, Phone, Percent, FileText } from "lucide-react";
import type { Product, Tenant } from "../types";
import { formatCurrency } from "../utils";
import { Panel, SectionHeader, SettingTile, DataRow } from "./UI";

export function ManagementGrid({
  canManage,
  onDeleteProduct,
  onEditProduct,
  onNewProduct,
  products,
  tenant,
}: {
  canManage: boolean;
  onDeleteProduct: (productId: string) => void;
  onEditProduct: (product: Product) => void;
  onNewProduct: () => void;
  products: Product[];
  tenant: Tenant;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Panel>
        <SectionHeader icon={Tags} title="Kelola Produk" subtitle="Atur kategori, harga, barcode, dan data gambar produk." />
        <div className="mt-4 grid gap-3">
          {products.slice(0, 4).map((product) => (
            <div className="rounded-lg border border-slate-200 px-3 py-2" key={product.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {product.category} - {product.barcode}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold">{formatCurrency(product.sellingPrice)}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 text-xs font-bold text-slate-700 disabled:text-slate-400"
                  disabled={!canManage}
                  onClick={() => onEditProduct(product)}
                  type="button"
                >
                  <Pencil size={14} />
                  Ubah
                </button>
                <button
                  className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-rose-200 text-xs font-bold text-rose-700 disabled:border-slate-200 disabled:text-slate-400"
                  disabled={!canManage || products.length <= 1}
                  onClick={() => onDeleteProduct(product.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          className="mt-4 h-10 w-full rounded-lg bg-slate-950 text-sm font-semibold text-white disabled:bg-slate-300"
          disabled={!canManage}
          onClick={onNewProduct}
          type="button"
        >
          Tambah atau ubah produk
        </button>
      </Panel>

      <Panel>
        <SectionHeader icon={Users} title="Pelanggan" subtitle="Daftar nomor telepon dan riwayat belanja pelanggan." />
        <div className="mt-4 grid gap-3">
          {tenant.customers.map((customer) => (
            <DataRow
              key={customer.name}
              label={customer.name}
              meta={`${customer.phone} - Pembelian terakhir: ${customer.lastPurchase}`}
              value={formatCurrency(customer.lifetimeValue)}
            />
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionHeader icon={Truck} title="Pemasok" subtitle="Daftar purchase order dan riwayat pengadaan barang." />
        <div className="mt-4 grid gap-3">
          {tenant.suppliers.map((supplier) => (
            <DataRow
              key={supplier.name}
              label={supplier.name}
              meta={`${supplier.openOrders} purchase order aktif`}
              value={formatCurrency(supplier.purchaseHistory)}
            />
          ))}
        </div>
      </Panel>

      <Panel className="xl:col-span-3">
        <SectionHeader icon={Settings} title="Pengaturan & Profil Toko" subtitle="Atur struk belanja, pajak, mata uang, jam operasional, dan metode pembayaran." />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SettingTile icon={Store} label="Profil toko" value={`${tenant.name} - ${tenant.owner}`} />
          <SettingTile icon={Phone} label="Hubungi kami" value={`${tenant.phone} - ${tenant.hours}`} />
          <SettingTile icon={Percent} label="Pengaturan pajak" value={`${tenant.taxRate}% ${tenant.currency}`} />
          <SettingTile icon={FileText} label="Templat struk" value={tenant.receiptTemplate} />
        </div>
      </Panel>
    </div>
  );
}
