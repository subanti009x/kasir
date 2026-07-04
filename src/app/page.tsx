"use client";

import {
  AlertTriangle,
  ArrowDownUp,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Crown,
  Database,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  Minus,
  PackagePlus,
  Pencil,
  Percent,
  Phone,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  Truck,
  Trash2,
  UserPlus,
  UserRoundCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";

type Role = "Super Admin" | "SME Owner" | "Cashier";
type Period = "Daily" | "Weekly" | "Monthly" | "Yearly" | "Custom";
type Section =
  | "Dashboard"
  | "Sales"
  | "Products"
  | "Inventory"
  | "Customers"
  | "Suppliers"
  | "Reports"
  | "Settings";

type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  image: string;
  soldToday: number;
};

type ProductDraft = {
  id?: string;
  name: string;
  category: string;
  sku: string;
  barcode: string;
  purchasePrice: string;
  sellingPrice: string;
  stock: string;
  minStock: string;
};

type Transaction = {
  id: string;
  cashier: string;
  customer: string;
  total: number;
  method: string;
  time: string;
  status: "Paid" | "Pending";
};

type ReceiptLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type Receipt = {
  id: string;
  tenantName: string;
  address: string;
  phone: string;
  cashier: string;
  customer: string;
  method: string;
  date: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

type Customer = {
  name: string;
  phone: string;
  lastPurchase: string;
  lifetimeValue: number;
};

type Supplier = {
  name: string;
  phone: string;
  openOrders: number;
  purchaseHistory: number;
};

type Employee = {
  name: string;
  role: Role;
  status: "Active" | "Off shift";
};

type InventoryLog = {
  product: string;
  type: "Stock In" | "Stock Out" | "Adjustment";
  quantity: number;
  note: string;
};

type InventoryDraft = {
  productId: string;
  type: InventoryLog["type"];
  quantity: string;
  note: string;
};

type Tenant = {
  id: string;
  name: string;
  plan: string;
  status: "Active" | "Paused";
  logo: string;
  address: string;
  phone: string;
  hours: string;
  owner: string;
  employees: Employee[];
  customers: Customer[];
  suppliers: Supplier[];
  currency: string;
  taxRate: number;
  receiptTemplate: string;
  paymentMethods: string[];
  products: Product[];
  transactions: Transaction[];
  inventoryLogs: InventoryLog[];
};

const tenants: Tenant[] = [
  {
    id: "tenant-bakery",
    name: "Nusantara Bakery",
    plan: "Growth",
    status: "Active",
    logo: "NB",
    address: "Jl. Melati 18, Bandung",
    phone: "+62 22 8123 4501",
    hours: "07:00 - 21:00",
    owner: "Ayu Prameswari",
    currency: "IDR",
    taxRate: 11,
    receiptTemplate: "Compact thermal receipt with tax ID and QRIS reference",
    paymentMethods: ["Cash", "QRIS", "Bank Transfer", "E-Wallet", "Split Payment"],
    employees: [
      { name: "Ayu Prameswari", role: "SME Owner", status: "Active" },
      { name: "Raka", role: "Cashier", status: "Active" },
      { name: "Mira", role: "Cashier", status: "Off shift" },
    ],
    customers: [
      { name: "Dewi L.", phone: "+62 812 4000 1881", lastPurchase: "Today, 09:42", lifetimeValue: 8400000 },
      { name: "Office Pantry", phone: "+62 811 7000 9910", lastPurchase: "Today, 08:55", lifetimeValue: 21800000 },
      { name: "Walk-in", phone: "-", lastPurchase: "Today, 09:18", lifetimeValue: 3260000 },
    ],
    suppliers: [
      { name: "Bandung Flour Supply", phone: "+62 22 7990 1001", openOrders: 2, purchaseHistory: 68000000 },
      { name: "Dairy Fresh ID", phone: "+62 21 5522 8820", openOrders: 1, purchaseHistory: 35400000 },
    ],
    products: [
      {
        id: "p-001",
        name: "Sourdough Loaf",
        category: "Bakery",
        sku: "BRD-SRD-01",
        barcode: "899100010001",
        purchasePrice: 18000,
        sellingPrice: 32000,
        stock: 36,
        minStock: 12,
        image: "linear-gradient(135deg, #fff7ed, #d97706)",
        soldToday: 28,
      },
      {
        id: "p-002",
        name: "Kopi Susu Botol",
        category: "Beverage",
        sku: "BEV-KSB-02",
        barcode: "899100010002",
        purchasePrice: 9000,
        sellingPrice: 18000,
        stock: 9,
        minStock: 18,
        image: "linear-gradient(135deg, #d6f3ff, #0f766e)",
        soldToday: 41,
      },
      {
        id: "p-003",
        name: "Croissant Butter",
        category: "Bakery",
        sku: "BRD-CRS-03",
        barcode: "899100010003",
        purchasePrice: 11000,
        sellingPrice: 24000,
        stock: 22,
        minStock: 16,
        image: "linear-gradient(135deg, #fefce8, #ea580c)",
        soldToday: 33,
      },
      {
        id: "p-004",
        name: "Cheese Cake Slice",
        category: "Dessert",
        sku: "DST-CCS-04",
        barcode: "899100010004",
        purchasePrice: 15000,
        sellingPrice: 34000,
        stock: 14,
        minStock: 10,
        image: "linear-gradient(135deg, #fefce8, #65a30d)",
        soldToday: 17,
      },
    ],
    transactions: [
      { id: "TRX-10291", cashier: "Raka", customer: "Dewi L.", total: 186000, method: "QRIS", time: "09:42", status: "Paid" },
      { id: "TRX-10290", cashier: "Mira", customer: "Walk-in", total: 74000, method: "Cash", time: "09:18", status: "Paid" },
      { id: "TRX-10289", cashier: "Raka", customer: "Office Pantry", total: 428000, method: "Bank Transfer", time: "08:55", status: "Pending" },
    ],
    inventoryLogs: [
      { product: "Kopi Susu Botol", type: "Stock Out", quantity: 41, note: "Sales movement" },
      { product: "Sourdough Loaf", type: "Stock In", quantity: 48, note: "Morning production batch" },
      { product: "Cheese Cake Slice", type: "Adjustment", quantity: -2, note: "Damaged packaging" },
    ],
  },
  {
    id: "tenant-grocery",
    name: "Toko Sembako Maju",
    plan: "Starter",
    status: "Active",
    logo: "TM",
    address: "Jl. Pasar Baru 7, Surabaya",
    phone: "+62 31 5531 8020",
    hours: "06:00 - 22:00",
    owner: "Bima Santoso",
    currency: "IDR",
    taxRate: 10,
    receiptTemplate: "Detailed grocery receipt with cashier code and payment split",
    paymentMethods: ["Cash", "QRIS", "E-Wallet", "Bank Transfer"],
    employees: [
      { name: "Bima Santoso", role: "SME Owner", status: "Active" },
      { name: "Nina", role: "Cashier", status: "Active" },
      { name: "Dimas", role: "Cashier", status: "Active" },
    ],
    customers: [
      { name: "Pak Rudi", phone: "+62 812 6400 2201", lastPurchase: "Today, 10:02", lifetimeValue: 11750000 },
      { name: "Warung Sri", phone: "+62 813 7770 3131", lastPurchase: "Today, 09:06", lifetimeValue: 31600000 },
      { name: "Walk-in", phone: "-", lastPurchase: "Today, 09:49", lifetimeValue: 5190000 },
    ],
    suppliers: [
      { name: "Sumber Beras Timur", phone: "+62 31 7721 9008", openOrders: 3, purchaseHistory: 126000000 },
      { name: "Fresh Farm Surabaya", phone: "+62 31 8890 1130", openOrders: 1, purchaseHistory: 47200000 },
    ],
    products: [
      {
        id: "p-101",
        name: "Beras Premium 5kg",
        category: "Staple",
        sku: "STP-BRS-05",
        barcode: "899200010101",
        purchasePrice: 64000,
        sellingPrice: 78500,
        stock: 48,
        minStock: 20,
        image: "linear-gradient(135deg, #f8fafc, #64748b)",
        soldToday: 21,
      },
      {
        id: "p-102",
        name: "Minyak Goreng 2L",
        category: "Staple",
        sku: "STP-MYK-02",
        barcode: "899200010102",
        purchasePrice: 28500,
        sellingPrice: 35000,
        stock: 11,
        minStock: 24,
        image: "linear-gradient(135deg, #fef3c7, #ca8a04)",
        soldToday: 38,
      },
      {
        id: "p-103",
        name: "Sabun Cair Refill",
        category: "Household",
        sku: "HHD-SBN-03",
        barcode: "899200010103",
        purchasePrice: 13500,
        sellingPrice: 21000,
        stock: 29,
        minStock: 16,
        image: "linear-gradient(135deg, #e0f2fe, #2563eb)",
        soldToday: 12,
      },
      {
        id: "p-104",
        name: "Telur Ayam 1kg",
        category: "Fresh",
        sku: "FRS-TLR-01",
        barcode: "899200010104",
        purchasePrice: 24000,
        sellingPrice: 31500,
        stock: 17,
        minStock: 20,
        image: "linear-gradient(135deg, #fff1f2, #be123c)",
        soldToday: 24,
      },
    ],
    transactions: [
      { id: "TRX-88021", cashier: "Nina", customer: "Pak Rudi", total: 238500, method: "E-Wallet", time: "10:02", status: "Paid" },
      { id: "TRX-88020", cashier: "Dimas", customer: "Walk-in", total: 66500, method: "Cash", time: "09:49", status: "Paid" },
      { id: "TRX-88019", cashier: "Nina", customer: "Warung Sri", total: 518000, method: "Bank Transfer", time: "09:06", status: "Paid" },
    ],
    inventoryLogs: [
      { product: "Minyak Goreng 2L", type: "Stock Out", quantity: 38, note: "Sales movement" },
      { product: "Beras Premium 5kg", type: "Stock In", quantity: 80, note: "Supplier delivery" },
      { product: "Telur Ayam 1kg", type: "Adjustment", quantity: -4, note: "Broken items" },
    ],
  },
];

const roles: Role[] = ["Super Admin", "SME Owner", "Cashier"];
const periods: Period[] = ["Daily", "Weekly", "Monthly", "Yearly", "Custom"];
const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Sales", icon: ShoppingCart },
  { label: "Products", icon: Tags },
  { label: "Inventory", icon: Boxes },
  { label: "Customers", icon: Users },
  { label: "Suppliers", icon: Truck },
  { label: "Reports", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

const platformStats = [
  { label: "Active SMEs", value: "248", icon: Building2, accent: "text-teal-700" },
  { label: "Monthly GMV", value: "Rp 8.4B", icon: BadgeDollarSign, accent: "text-amber-700" },
  { label: "Live Cashiers", value: "1,932", icon: Users, accent: "text-sky-700" },
  { label: "Uptime", value: "99.98%", icon: ShieldCheck, accent: "text-emerald-700" },
];

const architectureItems = [
  { label: "Frontend", value: "Next.js App Router, React, Tailwind CSS" },
  { label: "API layer", value: "REST contracts ready for NestJS services" },
  { label: "Data boundary", value: "Tenant ID scopes products, staff, reports, and receipts" },
  { label: "Future modules", value: "Accounting, CRM, loyalty, marketplace, and mobile apps" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const emptyProductDraft: ProductDraft = {
  name: "",
  category: "",
  sku: "",
  barcode: "",
  purchasePrice: "",
  sellingPrice: "",
  stock: "",
  minStock: "",
};

const emptyInventoryDraft: InventoryDraft = {
  productId: "",
  type: "Stock In",
  quantity: "",
  note: "",
};

function productToDraft(product: Product): ProductDraft {
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

function productGradient(category: string) {
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

function parseCurrencyInput(value: string) {
  return Number(value.replace(/[^\d]/g, "")) || 0;
}

function parseSignedQuantity(value: string) {
  const normalized = value.replace(/[^\d-]/g, "");
  return Number(normalized) || 0;
}

function starterCart(products: Product[]) {
  const first = products[0];
  const second = products[1];

  return {
    ...(first ? { [first.id]: 1 } : {}),
    ...(second ? { [second.id]: 1 } : {}),
  };
}

export default function Home() {
  const [tenantId, setTenantId] = useState(tenants[0].id);
  const [role, setRole] = useState<Role>("SME Owner");
  const [period, setPeriod] = useState<Period>("Daily");
  const [section, setSection] = useState<Section>("Dashboard");
  const [query, setQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("QRIS");
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProductDraft);
  const [productEditorOpen, setProductEditorOpen] = useState(false);
  const [productFormMessage, setProductFormMessage] = useState("");
  const [inventoryDraft, setInventoryDraft] = useState<InventoryDraft>(emptyInventoryDraft);
  const [inventoryEditorOpen, setInventoryEditorOpen] = useState(false);
  const [inventoryFormMessage, setInventoryFormMessage] = useState("");
  const [productsByTenant, setProductsByTenant] = useState<Record<string, Product[]>>(
    () => Object.fromEntries(tenants.map((item) => [item.id, item.products])),
  );
  const [transactionsByTenant, setTransactionsByTenant] = useState<Record<string, Transaction[]>>(
    () => Object.fromEntries(tenants.map((item) => [item.id, item.transactions])),
  );
  const [inventoryLogsByTenant, setInventoryLogsByTenant] = useState<Record<string, InventoryLog[]>>(
    () => Object.fromEntries(tenants.map((item) => [item.id, item.inventoryLogs])),
  );
  const [cart, setCart] = useState<Record<string, number>>({
    "p-001": 2,
    "p-002": 1,
  });

  const tenant = tenants.find((item) => item.id === tenantId) ?? tenants[0];
  const tenantProducts = productsByTenant[tenant.id] ?? tenant.products;
  const tenantTransactions = transactionsByTenant[tenant.id] ?? tenant.transactions;
  const tenantInventoryLogs = inventoryLogsByTenant[tenant.id] ?? tenant.inventoryLogs;
  const canManage = role !== "Cashier";
  const isSuperAdmin = role === "Super Admin";
  const visibleProducts = tenantProducts.filter((product) =>
    `${product.name} ${product.category} ${product.sku} ${product.barcode}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const cartLines = tenantProducts
    .filter((product) => cart[product.id])
    .map((product) => ({
      ...product,
      quantity: cart[product.id],
      subtotal: product.sellingPrice * cart[product.id],
    }));
  const subtotal = cartLines.reduce((sum, line) => sum + line.subtotal, 0);
  const discount = subtotal > 200000 ? subtotal * 0.05 : 0;
  const tax = (subtotal - discount) * (tenant.taxRate / 100);
  const total = subtotal - discount + tax;
  const revenue = tenantTransactions.reduce((sum, item) => sum + item.total, 0) + total;
  const profit = tenantProducts.reduce(
    (sum, item) => sum + (item.sellingPrice - item.purchasePrice) * item.soldToday,
    0,
  );
  const lowStock = tenantProducts.filter((item) => item.stock <= item.minStock);
  const bestSeller = [...tenantProducts].sort((a, b) => b.soldToday - a.soldToday)[0];
  const categories = [...new Set(tenantProducts.map((item) => item.category))];

  const roleSummary = useMemo(() => {
    if (role === "Super Admin") {
      return "Platform controls for SME activation, subscription packages, tenant health, and cross-tenant statistics.";
    }

    if (role === "Cashier") {
      return "Focused register access with sales processing, payment confirmation, receipts, and permitted history.";
    }

    return "Store operations for products, inventory, employees, payment methods, settings, and reports.";
  }, [role]);

  const notifications = [
    { label: "Low stock alert", value: `${lowStock.length} products need replenishment`, tone: "rose" },
    { label: "Successful transaction", value: `${tenantTransactions[0].id} captured via ${tenantTransactions[0].method}`, tone: "emerald" },
    {
      label: "Successful payment",
      value: currentReceipt
        ? `${currentReceipt.id} paid by ${currentReceipt.method}`
        : `${paymentMethod} checkout ready for receipt printing`,
      tone: "sky",
    },
  ];

  function updateCart(productId: string, direction: 1 | -1) {
    setCart((current) => {
      const product = tenantProducts.find((item) => item.id === productId);
      const stockLimit = product?.stock ?? 0;
      const nextQuantity = Math.min(Math.max((current[productId] ?? 0) + direction, 0), stockLimit);
      const next = { ...current };

      if (nextQuantity === 0) {
        delete next[productId];
      } else {
        next[productId] = nextQuantity;
      }

      return next;
    });
  }

  function switchTenant(nextTenantId: string) {
    setTenantId(nextTenantId);
    setQuery("");
    const nextTenant = tenants.find((item) => item.id === nextTenantId) ?? tenants[0];
    setCart(starterCart(productsByTenant[nextTenant.id] ?? nextTenant.products));
    setPaymentMethod(nextTenant.paymentMethods.includes(paymentMethod) ? paymentMethod : nextTenant.paymentMethods[0]);
    setCurrentReceipt(null);
    setReceiptOpen(false);
    setInventoryEditorOpen(false);
    setInventoryDraft(emptyInventoryDraft);
    setInventoryFormMessage("");
  }

  function openProductEditor(product?: Product) {
    setProductDraft(product ? productToDraft(product) : emptyProductDraft);
    setProductFormMessage("");
    setProductEditorOpen(true);
  }

  function closeProductEditor() {
    setProductEditorOpen(false);
    setProductDraft(emptyProductDraft);
    setProductFormMessage("");
  }

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = productDraft.name.trim();
    const category = productDraft.category.trim();
    const sku = productDraft.sku.trim();
    const barcode = productDraft.barcode.trim();
    const purchasePrice = parseCurrencyInput(productDraft.purchasePrice);
    const sellingPrice = parseCurrencyInput(productDraft.sellingPrice);
    const stock = parseCurrencyInput(productDraft.stock);
    const minStock = parseCurrencyInput(productDraft.minStock);

    if (!name || !category || !sku || !barcode || sellingPrice <= 0) {
      setProductFormMessage("Name, category, SKU, barcode, and selling price are required.");
      return;
    }

    setProductsByTenant((current) => {
      const currentProducts = current[tenant.id] ?? tenant.products;
      const nextSequence =
        Math.max(0, ...currentProducts.map((product) => Number(product.id.replace(/\D/g, "")) || 0)) + 1;
      const nextProduct: Product = {
        id: productDraft.id ?? `p-${nextSequence.toString().padStart(3, "0")}`,
        name,
        category,
        sku,
        barcode,
        purchasePrice,
        sellingPrice,
        stock,
        minStock,
        image: productDraft.id
          ? currentProducts.find((product) => product.id === productDraft.id)?.image ?? productGradient(category)
          : productGradient(category),
        soldToday: productDraft.id
          ? currentProducts.find((product) => product.id === productDraft.id)?.soldToday ?? 0
          : 0,
      };

      return {
        ...current,
        [tenant.id]: productDraft.id
          ? currentProducts.map((product) => (product.id === productDraft.id ? nextProduct : product))
          : [nextProduct, ...currentProducts],
      };
    });
    closeProductEditor();
  }

  function deleteProduct(productId: string) {
    if (tenantProducts.length <= 1) {
      setProductFormMessage("Keep at least one product so the register can stay usable.");
      return;
    }

    setProductsByTenant((current) => ({
      ...current,
      [tenant.id]: (current[tenant.id] ?? tenant.products).filter((product) => product.id !== productId),
    }));
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function openInventoryEditor(product?: Product) {
    setInventoryDraft({
      ...emptyInventoryDraft,
      productId: product?.id ?? tenantProducts[0]?.id ?? "",
    });
    setInventoryFormMessage("");
    setInventoryEditorOpen(true);
  }

  function closeInventoryEditor() {
    setInventoryEditorOpen(false);
    setInventoryDraft(emptyInventoryDraft);
    setInventoryFormMessage("");
  }

  function saveInventoryMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const product = tenantProducts.find((item) => item.id === inventoryDraft.productId);
    const rawQuantity = parseSignedQuantity(inventoryDraft.quantity);
    const quantity =
      inventoryDraft.type === "Adjustment" ? rawQuantity : Math.abs(rawQuantity);
    const note = inventoryDraft.note.trim() || "Manual stock movement";

    if (!product) {
      setInventoryFormMessage("Choose a product before recording stock movement.");
      return;
    }

    if (quantity === 0) {
      setInventoryFormMessage("Quantity must be greater than zero. Use a negative number only for adjustment corrections.");
      return;
    }

    const delta =
      inventoryDraft.type === "Stock In"
        ? quantity
        : inventoryDraft.type === "Stock Out"
          ? -quantity
          : quantity;

    if (product.stock + delta < 0) {
      setInventoryFormMessage(`Only ${product.stock} units are available for ${product.name}.`);
      return;
    }

    setProductsByTenant((current) => ({
      ...current,
      [tenant.id]: (current[tenant.id] ?? tenant.products).map((item) =>
        item.id === product.id ? { ...item, stock: item.stock + delta } : item,
      ),
    }));
    setInventoryLogsByTenant((current) => ({
      ...current,
      [tenant.id]: [
        {
          product: product.name,
          type: inventoryDraft.type,
          quantity: delta,
          note,
        },
        ...(current[tenant.id] ?? tenant.inventoryLogs),
      ],
    }));
    setCart((current) => {
      const nextStock = product.stock + delta;

      if (!current[product.id] || current[product.id] <= nextStock) {
        return current;
      }

      return {
        ...current,
        [product.id]: Math.max(nextStock, 0),
      };
    });
    closeInventoryEditor();
  }

  function handleCheckout() {
    if (cartLines.length === 0) {
      return;
    }

    const cashier =
      role === "Cashier"
        ? tenant.employees.find((employee) => employee.role === "Cashier" && employee.status === "Active")?.name ?? "Cashier"
        : tenant.owner;
    const nextSequence =
      Math.max(
        0,
        ...tenantTransactions.map((transaction) => Number(transaction.id.replace(/\D/g, "")) || 0),
      ) + 1;
    const receiptId = `TRX-${nextSequence.toString().padStart(5, "0")}`;
    const receipt: Receipt = {
      id: receiptId,
      tenantName: tenant.name,
      address: tenant.address,
      phone: tenant.phone,
      cashier,
      customer: "Walk-in",
      method: paymentMethod,
      date: "Current register session",
      lines: cartLines.map((line) => ({
        id: line.id,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.sellingPrice,
        subtotal: line.subtotal,
      })),
      subtotal,
      discount,
      tax,
      total,
    };

    setCurrentReceipt(receipt);
    setReceiptOpen(true);
    setTransactionsByTenant((current) => ({
      ...current,
      [tenant.id]: [
        {
          id: receipt.id,
          cashier: receipt.cashier,
          customer: receipt.customer,
          total: receipt.total,
          method: receipt.method,
          time: "Now",
          status: "Paid",
        },
        ...(current[tenant.id] ?? tenant.transactions),
      ],
    }));
    setProductsByTenant((current) => ({
      ...current,
      [tenant.id]: (current[tenant.id] ?? tenant.products).map((product) => {
        const quantity = cart[product.id] ?? 0;

        if (quantity === 0) {
          return product;
        }

        return {
          ...product,
          stock: Math.max(product.stock - quantity, 0),
          soldToday: product.soldToday + quantity,
        };
      }),
    }));
    setInventoryLogsByTenant((current) => ({
      ...current,
      [tenant.id]: [
        ...cartLines.map((line) => ({
          product: line.name,
          type: "Stock Out" as const,
          quantity: -line.quantity,
          note: `Sale ${receipt.id}`,
        })),
        ...(current[tenant.id] ?? tenant.inventoryLogs),
      ],
    }));
    setCart({});
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white px-4 py-5 shadow-xl shadow-slate-900/5 transition-transform lg:static lg:translate-x-0 ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-lg bg-slate-950 text-sm font-bold text-white">
                POS
              </div>
              <div>
                <p className="text-sm font-semibold">KasirPro Cloud</p>
                <p className="text-xs text-slate-500">Multi-tenant SaaS</p>
              </div>
            </div>
            <button
              aria-label="Close menu"
              className="grid size-9 place-items-center rounded-lg border border-slate-200 lg:hidden"
              onClick={() => setMobileNavOpen(false)}
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-700 text-xs font-bold text-white">
                  {tenant.logo}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{tenant.name}</p>
                  <p className="truncate text-xs text-slate-500">{tenant.plan} plan</p>
                </div>
              </div>
              <ChevronDown className="shrink-0 text-slate-400" size={17} />
            </div>
            <div className="mt-3 grid gap-2">
              {tenants.map((item) => (
                <button
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition ${
                    item.id === tenant.id
                      ? "bg-slate-950 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                  key={item.id}
                  onClick={() => switchTenant(item.id)}
                  type="button"
                >
                  <span>{item.name}</span>
                  <span>{item.status}</span>
                </button>
              ))}
            </div>
          </div>

          <nav className="mt-6 grid gap-1">
            {navItems.map((item) => (
              <button
                className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                  section === item.label
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                key={item.label}
                onClick={() => {
                  setSection(item.label);
                  setMobileNavOpen(false);
                }}
                type="button"
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950">
              <ShieldCheck size={17} />
              Tenant guard active
            </div>
            <p className="mt-2 text-xs leading-5 text-emerald-800">
              Every product, customer, supplier, employee, report, and receipt shown below is
              scoped to <span className="font-semibold">{tenant.name}</span>.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Open menu"
                  className="grid size-10 place-items-center rounded-lg border border-slate-200 lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  type="button"
                >
                  <Menu size={19} />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                    {section} / {tenant.address}
                  </p>
                  <h1 className="text-xl font-bold tracking-normal sm:text-2xl">
                    Enterprise POS SaaS Console
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Role"
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium shadow-sm"
                  onChange={(event) => setRole(event.target.value as Role)}
                  value={role}
                >
                  {roles.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm disabled:bg-slate-300"
                  disabled={!canManage}
                  onClick={() => openProductEditor()}
                  type="button"
                >
                  <PackagePlus size={17} />
                  New product
                </button>
              </div>
            </div>
          </header>

          <div className="grid gap-4 p-4 lg:p-6">
            <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
              <Panel>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                      <Store size={17} />
                      Tenant workspace
                    </div>
                    <h2 className="mt-2 text-2xl font-bold tracking-normal">{tenant.name}</h2>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{roleSummary}</p>
                  </div>
                  <StatusBadge tone={tenant.status === "Active" ? "emerald" : "amber"}>{tenant.status}</StatusBadge>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(isSuperAdmin ? platformStats : [
                    { label: "Employees", value: tenant.employees.length.toString(), icon: Users, accent: "text-sky-700" },
                    { label: "Customers", value: tenant.customers.length.toString(), icon: UserPlus, accent: "text-teal-700" },
                    { label: "Suppliers", value: tenant.suppliers.length.toString(), icon: Truck, accent: "text-amber-700" },
                    { label: "Categories", value: categories.length.toString(), icon: Tags, accent: "text-emerald-700" },
                  ]).map((item) => (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.label}>
                      <div className={`mb-3 inline-grid size-9 place-items-center rounded-lg bg-white ${item.accent}`}>
                        <item.icon size={18} />
                      </div>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-sm text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">Subscription control</p>
                    <h3 className="mt-1 text-xl font-bold">{tenant.plan} Package</h3>
                  </div>
                  <Crown className="text-amber-300" size={28} />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Metric label="Products" value={tenantProducts.length.toString()} />
                  <Metric label="Staff" value={tenant.employees.length.toString()} />
                  <Metric label="Tax" value={`${tenant.taxRate}%`} />
                </div>
                <button
                  className="mt-5 h-10 w-full rounded-lg bg-white text-sm font-semibold text-slate-950 disabled:bg-white/30 disabled:text-white/60"
                  disabled={!isSuperAdmin}
                  type="button"
                >
                  Manage plan
                </button>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <InsightCard icon={CircleDollarSign} label="Today sales" value={formatCurrency(revenue)} tone="teal" />
              <InsightCard icon={CalendarDays} label="Monthly sales" value={formatCurrency(revenue * 26)} tone="sky" />
              <InsightCard icon={Percent} label="Estimated profit" value={formatCurrency(profit)} tone="amber" />
              <InsightCard icon={AlertTriangle} label="Low stock" value={`${lowStock.length} items`} tone="rose" />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
              <div className="grid gap-4">
                <Panel>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold">Sales register</h2>
                      <p className="text-sm text-slate-500">Barcode, SKU, category search, and quick cart controls.</p>
                    </div>
                    <label className="relative block w-full sm:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-teal-600 focus:bg-white"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search product, SKU, barcode"
                        value={query}
                      />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                    {visibleProducts.map((product) => (
                      <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm" key={product.id}>
                        <div aria-label={product.name} className="h-24 rounded-md" style={{ background: product.image }} />
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold">{product.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                          </div>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                            {product.category}
                          </span>
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                          <div>
                            <p className="text-xs text-slate-500">Sell price</p>
                            <p className="text-sm font-bold">{formatCurrency(product.sellingPrice)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconButton label={`Remove ${product.name}`} onClick={() => updateCart(product.id, -1)}>
                              <Minus size={15} />
                            </IconButton>
                            <span className="grid h-8 min-w-8 place-items-center rounded-md bg-slate-100 text-sm font-semibold">
                              {cart[product.id] ?? 0}
                            </span>
                            <IconButton dark label={`Add ${product.name}`} onClick={() => updateCart(product.id, 1)}>
                              <Plus size={15} />
                            </IconButton>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </Panel>

                <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                  <ReportsPanel
                    bestSeller={bestSeller?.name ?? "No product"}
                    period={period}
                    setPeriod={setPeriod}
                    soldToday={bestSeller?.soldToday ?? 0}
                  />
                  <InventoryPanel
                    canManage={canManage}
                    logs={tenantInventoryLogs}
                    onAdjust={openInventoryEditor}
                    products={tenantProducts}
                  />
                </div>

                <ManagementGrid
                  canManage={canManage}
                  onDeleteProduct={deleteProduct}
                  onEditProduct={openProductEditor}
                  onNewProduct={() => openProductEditor()}
                  products={tenantProducts}
                  tenant={tenant}
                />
                <ArchitecturePanel />
              </div>

              <aside className="grid gap-4">
                <CheckoutPanel
                  cartLines={cartLines}
                  discount={discount}
                  paymentMethod={paymentMethod}
                  paymentMethods={tenant.paymentMethods}
                  onCheckout={handleCheckout}
                  setPaymentMethod={setPaymentMethod}
                  subtotal={subtotal}
                  tax={tax}
                  taxRate={tenant.taxRate}
                  total={total}
                />
                <TransactionsPanel transactions={tenantTransactions} />
                <NotificationsPanel notifications={notifications} />
                <PermissionsPanel role={role} />
              </aside>
            </section>
          </div>
        </section>
      </div>
      {currentReceipt && receiptOpen ? (
        <ReceiptModal receipt={currentReceipt} onClose={() => setReceiptOpen(false)} />
      ) : null}
      {productEditorOpen ? (
        <ProductEditorModal
          canDelete={tenantProducts.length > 1 && Boolean(productDraft.id)}
          draft={productDraft}
          message={productFormMessage}
          onChange={setProductDraft}
          onClose={closeProductEditor}
          onDelete={productDraft.id ? () => {
            deleteProduct(productDraft.id!);
            closeProductEditor();
          } : undefined}
          onSubmit={saveProduct}
        />
      ) : null}
      {inventoryEditorOpen ? (
        <InventoryMovementModal
          draft={inventoryDraft}
          message={inventoryFormMessage}
          onChange={setInventoryDraft}
          onClose={closeInventoryEditor}
          onSubmit={saveInventoryMovement}
          products={tenantProducts}
        />
      ) : null}
    </main>
  );
}

function ManagementGrid({
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
        <SectionHeader icon={Tags} title="Product CRUD" subtitle="Categories, price, barcode, and image records." />
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
                  Edit
                </button>
                <button
                  className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-rose-200 text-xs font-bold text-rose-700 disabled:border-slate-200 disabled:text-slate-400"
                  disabled={!canManage || products.length <= 1}
                  onClick={() => onDeleteProduct(product.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                  Delete
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
          Add or edit product
        </button>
      </Panel>

      <Panel>
        <SectionHeader icon={Users} title="Customers" subtitle="Phone numbers and purchase history." />
        <div className="mt-4 grid gap-3">
          {tenant.customers.map((customer) => (
            <DataRow
              key={customer.name}
              label={customer.name}
              meta={`${customer.phone} - ${customer.lastPurchase}`}
              value={formatCurrency(customer.lifetimeValue)}
            />
          ))}
        </div>
      </Panel>

      <Panel>
        <SectionHeader icon={Truck} title="Suppliers" subtitle="Purchase orders and procurement history." />
        <div className="mt-4 grid gap-3">
          {tenant.suppliers.map((supplier) => (
            <DataRow
              key={supplier.name}
              label={supplier.name}
              meta={`${supplier.openOrders} open purchase orders`}
              value={formatCurrency(supplier.purchaseHistory)}
            />
          ))}
        </div>
      </Panel>

      <Panel className="xl:col-span-3">
        <SectionHeader icon={Settings} title="Settings and store profile" subtitle="Receipt, tax, currency, business hours, and payment method controls." />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SettingTile icon={Store} label="Store profile" value={`${tenant.name} - ${tenant.owner}`} />
          <SettingTile icon={Phone} label="Contact" value={`${tenant.phone} - ${tenant.hours}`} />
          <SettingTile icon={Percent} label="Tax settings" value={`${tenant.taxRate}% ${tenant.currency}`} />
          <SettingTile icon={FileText} label="Receipt template" value={tenant.receiptTemplate} />
        </div>
      </Panel>
    </div>
  );
}

function ReportsPanel({
  bestSeller,
  period,
  setPeriod,
  soldToday,
}: {
  bestSeller: string;
  period: Period;
  setPeriod: (period: Period) => void;
  soldToday: number;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3">
        <SectionHeader icon={BarChart3} title="Reporting dashboard" subtitle="Daily, weekly, monthly, yearly, and custom range filters." />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {periods.map((item) => (
          <button
            className={`h-9 rounded-lg px-3 text-sm font-semibold ${
              period === item ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
            }`}
            key={item}
            onClick={() => setPeriod(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      {period === "Custom" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" type="date" defaultValue="2026-07-01" />
          <input className="h-10 rounded-lg border border-slate-200 px-3 text-sm" type="date" defaultValue="2026-07-04" />
        </div>
      ) : null}
      <div className="mt-5 h-48 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="grid h-full grid-cols-12 items-end gap-2">
          {[44, 62, 38, 71, 58, 83, 69, 92, 74, 86, 66, 78].map((height, index) => (
            <div className="flex h-full flex-col justify-end" key={`${period}-${index}`}>
              <div className="w-full rounded-t-md bg-teal-600" style={{ height: `${Math.round(height * 1.55)}px` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <span className="font-semibold">Best seller:</span> {bestSeller} with {soldToday} units sold today.
      </div>
    </Panel>
  );
}

function InventoryPanel({
  canManage,
  logs,
  onAdjust,
  products,
}: {
  canManage: boolean;
  logs: InventoryLog[];
  onAdjust: (product?: Product) => void;
  products: Product[];
}) {
  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader icon={ArrowDownUp} title="Inventory control" subtitle="Stock in, stock out, adjustment, and change history." />
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-700 disabled:text-slate-400"
          disabled={!canManage}
          onClick={() => onAdjust()}
          type="button"
        >
          <ArrowDownUp size={15} />
          Record movement
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {products.map((product) => {
          const stockRatio = Math.min((product.stock / Math.max(product.minStock * 2, 1)) * 100, 100);
          return (
            <div className="rounded-lg border border-slate-200 p-3" key={product.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-xs text-slate-500">Minimum {product.minStock} units</p>
                </div>
                <StatusBadge tone={product.stock <= product.minStock ? "rose" : "emerald"}>{product.stock} stock</StatusBadge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className={`h-2 rounded-full ${product.stock <= product.minStock ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${stockRatio}%` }} />
              </div>
              <button
                className="mt-3 h-9 w-full rounded-md border border-slate-200 text-xs font-bold text-slate-700 disabled:text-slate-400"
                disabled={!canManage}
                onClick={() => onAdjust(product)}
                type="button"
              >
                Adjust {product.name}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid gap-2">
        {logs.slice(0, 6).map((log, index) => (
          <DataRow
            key={`${log.product}-${log.type}-${log.note}-${index}`}
            label={log.product}
            meta={`${log.type} - ${log.note}`}
            value={`${log.quantity > 0 ? "+" : ""}${log.quantity}`}
          />
        ))}
      </div>
    </Panel>
  );
}

function CheckoutPanel({
  cartLines,
  discount,
  onCheckout,
  paymentMethod,
  paymentMethods,
  setPaymentMethod,
  subtotal,
  tax,
  taxRate,
  total,
}: {
  cartLines: (Product & { quantity: number; subtotal: number })[];
  discount: number;
  onCheckout: () => void;
  paymentMethod: string;
  paymentMethods: string[];
  setPaymentMethod: (method: string) => void;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
}) {
  return (
    <Panel>
      <SectionHeader icon={ReceiptText} title="Current sale" subtitle="Discounts, taxes, split payment, and receipt preview." />
      <div className="mt-4 grid gap-3">
        {cartLines.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Add products to start a transaction.
          </div>
        ) : (
          cartLines.map((line) => (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3" key={line.id}>
              <div>
                <p className="text-sm font-semibold">{line.name}</p>
                <p className="text-xs text-slate-500">
                  {line.quantity} x {formatCurrency(line.sellingPrice)}
                </p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(line.subtotal)}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
        <TotalRow label="Subtotal" value={formatCurrency(subtotal)} />
        <TotalRow label="Discount" value={`-${formatCurrency(discount)}`} />
        <TotalRow label={`Tax ${taxRate}%`} value={formatCurrency(tax)} />
        <div className="flex items-center justify-between pt-2 text-lg font-bold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {paymentMethods.map((method) => (
          <button
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold ${
              paymentMethod === method ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"
            }`}
            key={method}
            onClick={() => setPaymentMethod(method)}
            type="button"
          >
            {methodIcon(method)}
            {method}
          </button>
        ))}
      </div>
      <button
        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 text-sm font-bold text-white shadow-sm disabled:bg-slate-300"
        disabled={cartLines.length === 0}
        onClick={onCheckout}
        type="button"
      >
        <Printer size={18} />
        Pay and print receipt
      </button>
    </Panel>
  );
}

function ReceiptModal({ onClose, receipt }: { onClose: () => void; receipt: Receipt }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Payment successful</p>
            <h2 className="mt-1 text-xl font-bold">Receipt {receipt.id}</h2>
            <p className="mt-1 text-sm text-slate-500">{receipt.date}</p>
          </div>
          <button
            aria-label="Close receipt"
            className="grid size-9 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-slate-950 text-xs font-bold text-white">
              POS
            </div>
            <div>
              <p className="text-sm font-bold">{receipt.tenantName}</p>
              <p className="text-xs text-slate-500">{receipt.address}</p>
              <p className="text-xs text-slate-500">{receipt.phone}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Cashier</p>
              <p>{receipt.cashier}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Payment</p>
              <p>{receipt.method}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {receipt.lines.map((line) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2" key={line.id}>
              <div>
                <p className="text-sm font-semibold">{line.name}</p>
                <p className="text-xs text-slate-500">
                  {line.quantity} x {formatCurrency(line.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(line.subtotal)}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
          <TotalRow label="Subtotal" value={formatCurrency(receipt.subtotal)} />
          <TotalRow label="Discount" value={`-${formatCurrency(receipt.discount)}`} />
          <TotalRow label="Tax" value={formatCurrency(receipt.tax)} />
          <div className="flex items-center justify-between pt-2 text-lg font-bold">
            <span>Total paid</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>

        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-bold text-white"
          onClick={onClose}
          type="button"
        >
          <Printer size={17} />
          Receipt printed
        </button>
      </div>
    </div>
  );
}

function ProductEditorModal({
  canDelete,
  draft,
  message,
  onChange,
  onClose,
  onDelete,
  onSubmit,
}: {
  canDelete: boolean;
  draft: ProductDraft;
  message: string;
  onChange: (draft: ProductDraft) => void;
  onClose: () => void;
  onDelete?: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const isEditing = Boolean(draft.id);

  function updateDraft(field: keyof ProductDraft, value: string) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <form
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Product management
            </p>
            <h2 className="mt-1 text-xl font-bold">{isEditing ? "Edit product" : "New product"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tenant-scoped product record with category, SKU, barcode, price, and stock controls.
            </p>
          </div>
          <button
            aria-label="Close product editor"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Product name">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("name", event.target.value)}
              placeholder="Example: Arabica Beans 250g"
              required
              value={draft.name}
            />
          </Field>
          <Field label="Category">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("category", event.target.value)}
              placeholder="Bakery, Beverage, Staple"
              required
              value={draft.category}
            />
          </Field>
          <Field label="SKU">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm uppercase outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("sku", event.target.value.toUpperCase())}
              placeholder="PRD-001"
              required
              value={draft.sku}
            />
          </Field>
          <Field label="Barcode">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("barcode", event.target.value)}
              placeholder="899000000001"
              required
              value={draft.barcode}
            />
          </Field>
          <Field label="Purchase price">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("purchasePrice", event.target.value)}
              placeholder="12000"
              value={draft.purchasePrice}
            />
          </Field>
          <Field label="Selling price">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("sellingPrice", event.target.value)}
              placeholder="18000"
              required
              value={draft.sellingPrice}
            />
          </Field>
          <Field label="Inventory stock">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("stock", event.target.value)}
              placeholder="25"
              value={draft.stock}
            />
          </Field>
          <Field label="Minimum stock">
            <input
              className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
              inputMode="numeric"
              onChange={(event) => updateDraft("minStock", event.target.value)}
              placeholder="10"
              value={draft.minStock}
            />
          </Field>
        </div>

        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 text-sm font-bold text-rose-700 disabled:border-slate-200 disabled:text-slate-400"
            disabled={!canDelete}
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={17} />
            Delete product
          </button>
          <div className="flex gap-2">
            <button
              className="h-11 flex-1 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 sm:flex-none"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white sm:flex-none"
              type="submit"
            >
              <PackagePlus size={17} />
              Save product
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function InventoryMovementModal({
  draft,
  message,
  onChange,
  onClose,
  onSubmit,
  products,
}: {
  draft: InventoryDraft;
  message: string;
  onChange: (draft: InventoryDraft) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  products: Product[];
}) {
  const selectedProduct = products.find((product) => product.id === draft.productId);

  function updateDraft(field: keyof InventoryDraft, value: string) {
    onChange({ ...draft, [field]: value });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <form
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Inventory movement
            </p>
            <h2 className="mt-1 text-xl font-bold">Record stock change</h2>
            <p className="mt-1 text-sm text-slate-500">
              Stock movement is scoped to this tenant and appears in inventory history.
            </p>
          </div>
          <button
            aria-label="Close inventory movement"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <Field label="Product">
            <select
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("productId", event.target.value)}
              required
              value={draft.productId}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {product.stock} stock
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Movement type">
              <select
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600"
                onChange={(event) => updateDraft("type", event.target.value)}
                value={draft.type}
              >
                <option>Stock In</option>
                <option>Stock Out</option>
                <option>Adjustment</option>
              </select>
            </Field>
            <Field label={draft.type === "Adjustment" ? "Adjustment quantity" : "Quantity"}>
              <input
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600"
                inputMode="numeric"
                onChange={(event) => updateDraft("quantity", event.target.value)}
                placeholder={draft.type === "Adjustment" ? "Example: -2 or 8" : "Example: 12"}
                required
                value={draft.quantity}
              />
            </Field>
          </div>
          <Field label="Reason">
            <textarea
              className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
              onChange={(event) => updateDraft("note", event.target.value)}
              placeholder="Supplier delivery, damaged goods, stock opname correction"
              value={draft.note}
            />
          </Field>
        </div>

        {selectedProduct ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Current stock for <span className="font-semibold text-slate-950">{selectedProduct.name}</span>:{" "}
            <span className="font-semibold text-slate-950">{selectedProduct.stock}</span> units.
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {message}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="h-11 rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white"
            type="submit"
          >
            <ArrowDownUp size={17} />
            Save movement
          </button>
        </div>
      </form>
    </div>
  );
}

function TransactionsPanel({ transactions }: { transactions: Transaction[] }) {
  return (
    <Panel>
      <SectionHeader icon={History} title="Recent transactions" subtitle="Tenant-only transaction history." />
      <div className="mt-4 grid gap-3">
        {transactions.map((transaction) => (
          <div className="rounded-lg border border-slate-200 p-3" key={transaction.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">{transaction.id}</p>
              <StatusBadge tone={transaction.status === "Paid" ? "emerald" : "amber"}>{transaction.status}</StatusBadge>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">{transaction.customer}</span>
              <span className="font-semibold">{formatCurrency(transaction.total)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {transaction.cashier} - {transaction.method} - {transaction.time}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function NotificationsPanel({
  notifications,
}: {
  notifications: { label: string; value: string; tone: string }[];
}) {
  return (
    <Panel>
      <SectionHeader icon={Bell} title="Notifications" subtitle="Operational alerts and payment events." />
      <div className="mt-4 grid gap-2">
        {notifications.map((item) => (
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3" key={item.label}>
            <div className={`mt-1 size-2 rounded-full ${item.tone === "rose" ? "bg-rose-500" : item.tone === "emerald" ? "bg-emerald-500" : "bg-sky-500"}`} />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs leading-5 text-slate-500">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PermissionsPanel({ role }: { role: Role }) {
  return (
    <Panel>
      <div className="flex items-center gap-2 text-sm font-bold">
        <UserRoundCog size={18} />
        Role permissions
      </div>
      <div className="mt-3 grid gap-2 text-sm text-slate-600">
        <Permission enabled={role !== "Cashier"} label="Manage products and categories" />
        <Permission enabled={role !== "Cashier"} label="View profit and supplier reports" />
        <Permission enabled label="Process transactions" />
        <Permission enabled={role === "Super Admin"} label="Activate or pause SME accounts" />
      </div>
    </Panel>
  );
}

function ArchitecturePanel() {
  return (
    <Panel>
      <SectionHeader icon={Database} title="Commercial architecture readiness" subtitle="Prepared for backend, storage, cache, search, realtime, jobs, and monitoring layers." />
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {architectureItems.map((item) => (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.label}>
            <p className="text-sm font-bold">{item.label}</p>
            <p className="mt-2 text-sm leading-5 text-slate-600">{item.value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

function SectionHeader({
  icon: Icon,
  subtitle,
  title,
}: {
  icon: typeof LayoutDashboard;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <Icon className="shrink-0 text-teal-700" size={23} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-slate-300">{label}</p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  label,
  tone,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  tone: "teal" | "sky" | "amber" | "rose";
  value: string;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    teal: "bg-teal-50 text-teal-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 inline-grid size-10 place-items-center rounded-lg ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-normal">{value}</p>
    </div>
  );
}

function SettingTile({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Icon className="text-teal-700" size={17} />
        {label}
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-600">{value}</p>
    </div>
  );
}

function DataRow({ label, meta, value }: { label: string; meta: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-slate-500">{meta}</p>
      </div>
      <p className="shrink-0 text-sm font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ children, tone }: { children: React.ReactNode; tone: "emerald" | "amber" | "rose" }) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return <span className={`rounded-md px-2 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function Permission({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
      <span>{label}</span>
      <span className={`rounded-md px-2 py-1 text-xs font-bold ${enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
        {enabled ? "Allowed" : "Hidden"}
      </span>
    </div>
  );
}

function IconButton({
  children,
  dark = false,
  label,
  onClick,
}: {
  children: React.ReactNode;
  dark?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`grid size-8 place-items-center rounded-md ${dark ? "bg-slate-950 text-white" : "border border-slate-200 bg-white"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function methodIcon(method: string) {
  if (method === "Cash") return <Banknote size={17} />;
  if (method === "QRIS") return <QrCode size={17} />;
  if (method === "Bank Transfer") return <CreditCard size={17} />;
  if (method === "Split Payment") return <SlidersHorizontal size={17} />;
  return <WalletCards size={17} />;
}
