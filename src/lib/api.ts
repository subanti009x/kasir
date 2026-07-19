function getApiBase() {
  if (typeof window === "undefined") return "/api";

  const backendRoutePrefix =
    process.env.NEXT_PUBLIC_BACKEND_ROUTE_PREFIX || (window.location.hostname.endsWith("vercel.app") ? "/_/backend" : "");

  return `${backendRoutePrefix.replace(/\/$/, "")}/api`;
}

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
  params?: Record<string, string | number | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token, params } = options;

  let url = `${getApiBase()}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorData.message || `API Error ${res.status}`, errorData);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function uploadFile<T = unknown>(endpoint: string, file: File, token: string, fieldName = "image"): Promise<T> {
  const formData = new FormData();
  formData.set(fieldName, file);

  const res = await fetch(`${getApiBase()}${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorData.message || `API Error ${res.status}`, errorData);
  }

  return res.json();
}

// ---- Auth ----
export const authApi = {
  login: (email: string, password: string) =>
    api<{ access_token: string; user: any }>("/auth/login", { method: "POST", body: { email, password } }),
  register: (data: { email: string; password: string; name: string; businessName: string; businessSlug: string }) =>
    api<{ access_token: string; user: any; tenant: any }>("/auth/register", { method: "POST", body: data }),
};

// ---- Products ----
export const productApi = {
  list: (token: string, search?: string, categoryId?: string) =>
    api<any[]>("/products", { token, params: { search, categoryId } }),
  get: (token: string, id: string) => api<any>(`/products/${id}`, { token }),
  create: (token: string, data: any) => api<any>("/products", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: any) => api<any>(`/products/${id}`, { method: "PATCH", body: data, token }),
  uploadImage: (token: string, id: string, file: File) => uploadFile<any>(`/products/${id}/image`, file, token),
  delete: (token: string, id: string) => api(`/products/${id}`, { method: "DELETE", token }),
};

// ---- Categories ----
export const categoryApi = {
  list: (token: string) => api<any[]>("/categories", { token }),
  create: (token: string, data: any) => api<any>("/categories", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: any) => api<any>(`/categories/${id}`, { method: "PATCH", body: data, token }),
  delete: (token: string, id: string) => api(`/categories/${id}`, { method: "DELETE", token }),
};

// ---- Customers ----
export const customerApi = {
  list: (token: string, search?: string) => api<any[]>("/customers", { token, params: { search } }),
  get: (token: string, id: string) => api<any>(`/customers/${id}`, { token }),
  create: (token: string, data: any) => api<any>("/customers", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: any) => api<any>(`/customers/${id}`, { method: "PATCH", body: data, token }),
  delete: (token: string, id: string) => api(`/customers/${id}`, { method: "DELETE", token }),
};

// ---- Suppliers ----
export const supplierApi = {
  list: (token: string) => api<any[]>("/suppliers", { token }),
  get: (token: string, id: string) => api<any>(`/suppliers/${id}`, { token }),
  create: (token: string, data: any) => api<any>("/suppliers", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: any) => api<any>(`/suppliers/${id}`, { method: "PATCH", body: data, token }),
  delete: (token: string, id: string) => api(`/suppliers/${id}`, { method: "DELETE", token }),
};

// ---- Inventory ----
export const inventoryApi = {
  list: (token: string, productId?: string) => api<any[]>("/inventory", { token, params: { productId } }),
  lowStock: (token: string) => api<any[]>("/inventory/low-stock", { token }),
  create: (token: string, data: any) => api<any>("/inventory", { method: "POST", body: data, token }),
};

// ---- Transactions ----
export const transactionApi = {
  list: (token: string, page?: number, startDate?: string, endDate?: string) =>
    api<{ data: any[]; total: number; page: number; totalPages: number }>("/transactions", {
      token,
      params: { page, startDate, endDate },
    }),
  get: (token: string, id: string) => api<any>(`/transactions/${id}`, { token }),
  checkout: (token: string, data: any) => api<any>("/transactions/checkout", { method: "POST", body: data, token }),
  refund: (token: string, id: string) => api<any>(`/transactions/${id}/refund`, { method: "PATCH", token }),
};

// ---- Purchase Orders ----
export const purchaseOrderApi = {
  list: (token: string, status?: string) => api<any[]>("/purchase-orders", { token, params: { status } }),
  get: (token: string, id: string) => api<any>(`/purchase-orders/${id}`, { token }),
  create: (token: string, data: any) => api<any>("/purchase-orders", { method: "POST", body: data, token }),
  receive: (token: string, id: string, data: any) =>
    api<any>(`/purchase-orders/${id}/receive`, { method: "PATCH", body: data, token }),
  cancel: (token: string, id: string) => api<any>(`/purchase-orders/${id}/cancel`, { method: "PATCH", token }),
};

// ---- Reports ----
export const reportApi = {
  dashboard: (token: string) => api<any>("/reports/dashboard", { token }),
  sales: (token: string, startDate: string, endDate: string) =>
    api<any>("/reports/sales", { token, params: { startDate, endDate } }),
};

// ---- Accounting ----
export const accountingApi = {
  balanceSheet: (token: string, asOfDate?: string) =>
    api<any>("/accounting/balance-sheet", { token, params: { asOfDate } }),
  profitLoss: (token: string, startDate: string, endDate: string) =>
    api<any>("/accounting/profit-loss", { token, params: { startDate, endDate } }),
  listExpenses: (token: string, startDate?: string, endDate?: string) =>
    api<any[]>("/accounting/expenses", { token, params: { startDate, endDate } }),
  createExpense: (token: string, data: { category: string; description: string; amount: number; date: string }) =>
    api<any>("/accounting/expenses", { method: "POST", body: data, token }),
  deleteExpense: (token: string, id: string) =>
    api("/accounting/expenses/" + id, { method: "DELETE", token }),
};

// ---- Settings ----
export const settingsApi = {
  get: (token: string) => api<any>("/settings", { token }),
  update: (token: string, data: any) => api<any>("/settings", { method: "PATCH", body: data, token }),
  uploadLogo: (token: string, file: File) => uploadFile<any>("/settings/logo", file, token, "logo"),
  paymentMethods: (token: string) => api<any[]>("/settings/payment-methods", { token }),
  updatePaymentMethod: (token: string, id: string, enabled: boolean) =>
    api("/settings/payment-methods", { method: "PATCH", body: { id, enabled }, token }),
};

// ---- Users ----
export const userApi = {
  list: (token: string) => api<any[]>("/users", { token }),
  me: (token: string) => api<any>("/users/me", { token }),
  get: (token: string, id: string) => api<any>(`/users/${id}`, { token }),
  create: (token: string, data: any) => api<any>("/users", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: any) => api<any>(`/users/${id}`, { method: "PATCH", body: data, token }),
  delete: (token: string, id: string) => api(`/users/${id}`, { method: "DELETE", token }),
};

// ---- Tenants (Super Admin) ----
export const tenantApi = {
  list: (token: string, page?: number, status?: string) =>
    api<{ data: any[]; total: number }>("/tenants", { token, params: { page, status } }),
  get: (token: string, id: string) => api<any>(`/tenants/${id}`, { token }),
  create: (token: string, data: any) => api<any>("/tenants", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: any) => api<any>(`/tenants/${id}`, { method: "PATCH", body: data, token }),
  delete: (token: string, id: string) => api(`/tenants/${id}`, { method: "DELETE", token }),
  stats: (token: string) => api<any>("/tenants/stats", { token }),
  plans: (token: string) => api<any[]>("/tenants/plans", { token }),
};

// ---- Exclusive Features (Super Admin) ----
export const exclusiveFeatureApi = {
  list: (token: string) => api<any[]>("/exclusive-features", { token }),
  create: (token: string, data: any) => api<any>("/exclusive-features", { method: "POST", body: data, token }),
  update: (token: string, id: string, data: any) => api<any>(`/exclusive-features/${id}`, { method: "PATCH", body: data, token }),
  delete: (token: string, id: string) => api(`/exclusive-features/${id}`, { method: "DELETE", token }),
  tenantFeatures: (token: string, tenantId: string) => api<any[]>(`/exclusive-features/tenant/${tenantId}`, { token }),
  assign: (token: string, data: { tenantId: string; featureId: string; enabled?: boolean }) =>
    api<any>("/exclusive-features/assign", { method: "POST", body: data, token }),
  updateAssignment: (token: string, id: string, data: { enabled?: boolean }) =>
    api<any>(`/exclusive-features/assign/${id}`, { method: "PATCH", body: data, token }),
  removeAssignment: (token: string, id: string) => api(`/exclusive-features/assign/${id}`, { method: "DELETE", token }),
  check: (token: string, tenantId: string) =>
    api<{ features: any[]; featureMap: Record<string, boolean> }>(`/exclusive-features/check/${tenantId}`, { token }),
};

// ---- WhatsApp ----
export const whatsappApi = {
  getConfig: (token: string) => api<any>("/settings/whatsapp", { token }),
  updateConfig: (token: string, data: any) => api<any>("/settings/whatsapp", { method: "PATCH", body: data, token }),
  connect: (token: string) => api<any>("/settings/whatsapp/connect", { method: "POST", token }),
  disconnect: (token: string) => api<any>("/settings/whatsapp/disconnect", { method: "POST", token }),
  getLogs: (token: string, params?: { status?: string; page?: number; limit?: number }) =>
    api<{ data: any[]; total: number; page: number; totalPages: number }>("/settings/whatsapp/logs", { token, params }),
  getStats: (token: string) => api<{ total: number; pending: number; sending: number; sent: number; failed: number }>("/settings/whatsapp/logs/stats", { token }),
  retryLog: (token: string, logId: string) => api<any>(`/settings/whatsapp/logs/${logId}/retry`, { method: "POST", token }),
};
