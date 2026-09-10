import type { ApiErrorBody } from "../types/api";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_URL = import.meta.env.VITE_API_URL;

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Set by AuthProvider. Attempts a silent token refresh; resolves true if the
// caller should retry the original request with the new access token.
let unauthorizedHandler: (() => Promise<boolean>) | null = null;

export function setUnauthorizedHandler(handler: (() => Promise<boolean>) | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const body = data as ApiErrorBody | null;
    const code = body?.error?.code ?? "UNKNOWN_ERROR";

    if (res.status === 401 && code === "UNAUTHORIZED" && !isRetry && unauthorizedHandler) {
      const shouldRetry = await unauthorizedHandler();
      if (shouldRetry) {
        return apiFetch<T>(path, options, true);
      }
    }

    throw new ApiError(
      res.status,
      code,
      body?.error?.message ?? res.statusText,
      body?.error?.details,
    );
  }

  return data as T;
}
