import { getBackendEnabled } from "./config";
import { request } from "./httpClient";

interface BackendAuthUser {
  id: string;
  email: string;
  roles?: string[];
  driverId?: string;
}

interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: BackendAuthUser;
}

export interface BackendLoginInput {
  email: string;
  password: string;
}

export interface BackendForgotPasswordInput {
  email: string;
}

export function isBackendAuthEnabled(): boolean {
  return getBackendEnabled();
}

export async function backendLogin(input: BackendLoginInput): Promise<BackendAuthResponse> {
  return request<BackendAuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function backendForgotPassword(input: BackendForgotPasswordInput): Promise<{ sent: boolean }> {
  return request<{ sent: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: input,
  });
}
