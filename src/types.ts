export type Role = "Super Admin" | "SME Owner" | "Cashier";
export type Period = "Daily" | "Weekly" | "Monthly" | "Yearly" | "Custom";
export type Section =
  | "Dashboard"
  | "Sales"
  | "Products"
  | "Inventory"
  | "Customers"
  | "Suppliers"
  | "Reports"
  | "Settings";

export type Product = {
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

export type ProductDraft = {
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

export type Transaction = {
  id: string;
  cashier: string;
  customer: string;
  total: number;
  method: string;
  time: string;
  status: "Paid" | "Pending";
};

export type ReceiptLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type Receipt = {
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

export type Customer = {
  name: string;
  phone: string;
  lastPurchase: string;
  lifetimeValue: number;
};

export type Supplier = {
  name: string;
  phone: string;
  openOrders: number;
  purchaseHistory: number;
};

export type Employee = {
  name: string;
  role: Role;
  status: "Active" | "Off shift";
};

export type InventoryLog = {
  product: string;
  type: "Stock In" | "Stock Out" | "Adjustment";
  quantity: number;
  note: string;
};

export type InventoryDraft = {
  productId: string;
  type: InventoryLog["type"];
  quantity: string;
  note: string;
};

export type Tenant = {
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
