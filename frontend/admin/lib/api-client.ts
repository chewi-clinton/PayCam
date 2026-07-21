export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://paycam.zardocard.com/api/v1";

const TOKEN_KEY = "paycam_admin_token";

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

export type Admin = {
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

export type Merchant = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  business_name: string | null;
  is_suspended: boolean;
  totp_enabled: boolean;
  api_key_count: number;
  created_at: string;
};

export type MerchantDetail = Omit<Merchant, "api_key_count"> & {
  logo_url: string | null;
  default_webhook_url: string | null;
  api_keys: ApiKey[];
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

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] };

// ---- API ----

export const api = {
  login: (data: { email: string; password: string; totp_code?: string }) =>
    request<{ access_token: string; token_type: string; expires_in: number }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),

  logout: () => request<{ message: string }>("/auth/logout/", { method: "POST" }),

  profile: () => request<Admin>("/auth/profile/"),

  listMerchants: (params?: { search?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Paginated<Merchant>>(`/admin/merchants/${suffix}`);
  },

  getMerchant: (id: number | string) => request<MerchantDetail>(`/admin/merchants/${id}/`),

  listMerchantTransactions: (id: number | string, params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Paginated<Transaction>>(`/admin/merchants/${id}/transactions/${suffix}`);
  },

  suspendMerchant: (id: number | string) =>
    request<MerchantDetail>(`/admin/merchants/${id}/suspend/`, { method: "POST" }),

  reactivateMerchant: (id: number | string) =>
    request<MerchantDetail>(`/admin/merchants/${id}/reactivate/`, { method: "POST" }),

  revokeApiKey: (id: number | string) =>
    request<{ message: string }>(`/admin/api-keys/${id}/revoke/`, { method: "POST" }),

  inviteAdmin: (email: string) =>
    request<{ message: string }>("/admin/invites/", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  acceptInvite: (data: { token: string; password: string }) =>
    request<{
      access_token: string;
      token_type: string;
      expires_in: number;
      totp_secret: string;
      totp_uri: string;
    }>("/admin/invites/accept/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),
};
