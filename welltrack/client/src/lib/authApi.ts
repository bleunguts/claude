import { apiFetch } from "./apiClient";
import type { AuthResult, LoginInput, RegisterInput } from "../types/api";

export function registerRequest(input: RegisterInput): Promise<AuthResult> {
  return apiFetch<AuthResult>("/auth/register", { method: "POST", body: input });
}

export function loginRequest(input: LoginInput): Promise<AuthResult> {
  return apiFetch<AuthResult>("/auth/login", { method: "POST", body: input });
}

export function refreshRequest(refreshToken: string): Promise<AuthResult> {
  return apiFetch<AuthResult>("/auth/refresh", { method: "POST", body: { refreshToken } });
}

export function logoutRequest(refreshToken: string): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST", body: { refreshToken } });
}

export function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export function resetPasswordRequest(input: {
  token: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/reset-password", { method: "POST", body: input });
}
