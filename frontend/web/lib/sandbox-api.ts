import { API_BASE_URL } from "./api-client";

const SANDBOX_KEY_STORAGE = "paycam_sandbox_api_key";

export function getSandboxApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SANDBOX_KEY_STORAGE) ?? "";
}

export function setSandboxApiKey(key: string) {
  window.localStorage.setItem(SANDBOX_KEY_STORAGE, key);
}

export class SandboxApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function sandboxRequest<T>(apiKey: string, path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    throw new SandboxApiError(data?.message ?? "Request failed.", res.status, data?.code);
  }
  return data as T;
}

export type MomoInitiateResult = {
  reference: string;
  status: string;
  payment_url: string;
  expires_at: string;
};

export type CryptoInitiateResult = {
  reference: string;
  status: string;
  payment_url: string;
  qr_code: string;
  expires_at: string;
};

export function initiateMomoPayment(
  apiKey: string,
  data: {
    amount: string;
    payment_method: "mtn_momo" | "orange_money";
    phone_number: string;
    description?: string;
  }
) {
  return sandboxRequest<MomoInitiateResult>(apiKey, "/payments/initiate/", {
    ...data,
    currency: "XAF",
  });
}

export function initiateCryptoPayment(
  apiKey: string,
  data: {
    amount: string;
    currency: "BTC" | "ETH" | "USDT";
    crypto_wallet_address: string;
    description?: string;
  }
) {
  return sandboxRequest<CryptoInitiateResult>(apiKey, "/payments/crypto/initiate/", data);
}
