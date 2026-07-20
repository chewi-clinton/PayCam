const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://paycam.zardocard.com/api/v1";

const TOKEN_KEY = "paycam_dashboard_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function wsUrl(): string {
  const base = API_BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1$/, "");
  const token = getToken();
  return `${base}/ws/dashboard/?token=${encodeURIComponent(token ?? "")}`;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (res.status === 401 && auth) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login?expired=1";
    }
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    const message = body?.message ?? body?.detail ?? "Something went wrong.";
    throw new ApiError(message, res.status, body?.code);
  }

  return body as T;
}

// ---- Types ----

export type Merchant = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "merchant" | "admin";
  is_active: boolean;
  totp_enabled: boolean;
  created_at: string;
};

export type ApiKey = {
  id: number;
  prefix: string;
  environment: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type Transaction = {
  reference: string;
  amount: string;
  currency: string;
  phone_number: string | null;
  payment_method: string;
  status: "pending" | "success" | "failed" | "expired";
  description: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
};

export type WebhookLog = {
  id: number;
  transaction: string;
  transaction_reference: string;
  attempt_number: number;
  url: string;
  http_status: number | null;
  response_body: string | null;
  delivered_at: string | null;
  next_retry_at: string | null;
  created_at: string;
};

export type DashboardSummary = {
  gross_volume_xaf: string;
  transaction_count: number;
  success_count: number;
  pending_count: number;
  failed_count: number;
  success_rate: number;
  last_7_days: { date: string; volume: string; count: number }[];
};

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };

// ---- API ----

export const api = {
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    request<{ message: string; user_id: number; email: string }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),

  verifyEmail: (data: { email: string; otp: string }) =>
    request<{ message: string }>("/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),

  login: (data: { email: string; password: string; totp_code?: string }) =>
    request<{ access_token: string; token_type: string; expires_in: number }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),

  logout: () => request<{ message: string }>("/auth/logout/", { method: "POST" }),

  profile: () => request<Merchant>("/auth/profile/"),

  totpSetup: (password: string) =>
    request<{ secret: string; uri: string; message: string }>("/auth/2fa/setup/", {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  totpVerify: (code: string) =>
    request<{ message: string }>("/auth/2fa/verify/", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  listApiKeys: () => request<Paginated<ApiKey>>("/auth/api-keys/"),

  createApiKey: (totp_code: string) =>
    request<{ api_key: string; webhook_secret: string; key: ApiKey }>("/auth/api-keys/create/", {
      method: "POST",
      body: JSON.stringify({ totp_code }),
    }),

  listTransactions: (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Paginated<Transaction>>(`/payments/${suffix}`);
  },

  getTransaction: (reference: string) => request<Transaction>(`/payments/${reference}/`),

  listWebhookLogs: () => request<Paginated<WebhookLog>>("/webhooks/logs/"),

  dashboardSummary: () => request<DashboardSummary>("/dashboard/summary/"),
};
