import type { Product, ProductDraft } from "./types";

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export function productToDraft(product: Product): ProductDraft {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    sku: product.sku,
    barcode: product.barcode,
    purchasePrice: product.purchasePrice.toString(),
    sellingPrice: product.sellingPrice.toString(),
    stock: product.stock.toString(),
    minStock: product.minStock.toString(),
  };
}

export function productGradient(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("drink") || normalized.includes("beverage")) {
    return "linear-gradient(135deg, #d6f3ff, #0f766e)";
  }

  if (normalized.includes("fresh")) {
    return "linear-gradient(135deg, #fff1f2, #be123c)";
  }

  if (normalized.includes("house")) {
    return "linear-gradient(135deg, #e0f2fe, #2563eb)";
  }

  return "linear-gradient(135deg, #fff7ed, #d97706)";
}

export function parseCurrencyInput(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

export function parseSignedQuantity(value: string) {
  const normalized = value.replace(/[^\d-]/g, "");
  return Number(normalized) || 0;
}

export function starterCart(products: Product[]) {
  const first = products[0];
  const second = products[1];

  return {
    ...(first ? { [first.id]: 1 } : {}),
    ...(second ? { [second.id]: 1 } : {}),
  };
}
