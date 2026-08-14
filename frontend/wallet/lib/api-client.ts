export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://paycam.zardocard.com/api/v1";

const TOKEN_KEY = "paycam_wallet_token";

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
  remainingAttempts?: number;
  locked?: boolean;

  constructor(message: string, status: number, code?: string, extra?: { remainingAttempts?: number; locked?: boolean }) {
    super(message);
    this.status = status;
    this.code = code;
    this.remainingAttempts = extra?.remainingAttempts;
    this.locked = extra?.locked;
  }
}

/** DRF serializer validation errors come back as {field: ["message", ...]}
 * rather than {message} or {detail} — surface the first one. */
function extractFieldError(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  for (const value of Object.values(body as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
    if (typeof value === "string") return value;
  }
  return undefined;
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
    const message = body?.message ?? body?.detail ?? extractFieldError(body) ?? "Something went wrong.";
    throw new ApiError(message, res.status, body?.error ?? body?.code, {
      remainingAttempts: body?.remaining_attempts,
      locked: body?.locked,
    });
  }

  return body as T;
}

// ---- Types ----

export type MobileAppUser = {
  id: number;
  phone_number: string;
  full_name: string;
  network: "MTN" | "ORANGE";
  is_active: boolean;
  created_at: string;
};

export type Wallet = {
  network: string;
  balance: string;
  updated_at: string;
};

export type CryptoWallet = {
  currency: "BTC" | "ETH" | "USDT";
  testnet_address: string;
  balance: string;
  network: string;
  updated_at: string;
};

export type PendingPayment = {
  reference: string;
  merchant_name: string;
  amount: string;
  currency: string;
  description: string;
  expires_at: string;
};

export type AppTransaction = {
  reference: string;
  merchant_name: string;
  amount: string;
  currency: string;
  payment_method: "mtn_momo" | "orange_money" | "card" | "crypto_btc" | "crypto_eth" | "crypto_usdt";
  status: "pending" | "success" | "failed" | "expired";
  description: string;
  created_at: string;
  updated_at: string;
};

export type PaymentLookup = {
  reference: string;
  amount: string;
  currency: string;
  payment_method: string;
  status: string;
  merchant_name: string;
  expires_at: string | null;
};

export type WalletResponse = {
  user: MobileAppUser;
  wallet: Wallet;
  crypto_wallets: CryptoWallet[];
};

export type AuthResponse = {
  token: string;
  token_type: string;
  expires_in_minutes: number;
  user: MobileAppUser;
};

export type RegisterVerifyResponse = AuthResponse & {
  message: string;
  wallet: Wallet;
  crypto_wallets: CryptoWallet[];
};

// ---- API ----

export const api = {
  register: (data: { phone_number: string; full_name: string; pin: string; email: string }) =>
    request<{ message: string; delivery_method: string; expires_in_seconds: number }>("/app/register/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),

  verifyRegistrationOtp: (data: { phone_number: string; otp: string }) =>
    request<RegisterVerifyResponse>("/app/register/verify-otp/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),

  login: (data: { phone_number: string; pin: string }) =>
    request<AuthResponse>("/app/login/", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),

  wallet: () => request<WalletResponse>("/app/wallet/"),

  transactions: () => request<{ transactions: AppTransaction[] }>("/app/transactions/"),

  pendingPayments: () => request<{ pending: PendingPayment[] }>("/app/payments/pending/"),

  lookupPayment: (reference: string) => request<PaymentLookup>(`/app/payments/lookup/${reference}/`),

  approvePayment: (reference: string) =>
    request<{ reference: string; status: string; message?: string; crypto_tx_hash?: string }>(
      `/app/payments/${reference}/approve/`,
      { method: "POST" }
    ),

  declinePayment: (reference: string) =>
    request<{ reference: string; status: string }>(`/app/payments/${reference}/decline/`, { method: "POST" }),

  cryptoWallets: () => request<CryptoWallet[]>("/app/crypto-wallets/"),

  requestPinChange: (data: { old_pin: string }) =>
    request<{ message: string; delivery_method: string; expires_in_seconds: number }>("/app/change-pin/request/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  confirmPinChange: (data: { otp: string; new_pin: string }) =>
    request<{ message: string }>("/app/change-pin/confirm/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
