import { OPEN_AUTH, getBackendEnabled } from "./config";
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

export interface BackendSessionResponse {
  user: {
    id: string;
    email: string;
    phone?: string | null;
    status: string;
    roles: string[];
    lastLoginAt?: string | null;
  };
  profile: {
    driverProfileId: string | null;
    riderProfileId: string | null;
    fleetProfileId: string | null;
    adminProfileId: string | null;
  };
  permissions: string[];
  defaultRedirect: string;
}

export interface BackendRegisterInput {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface BackendLoginInput {
  email: string;
  password: string;
}

export interface BackendForgotPasswordInput {
  email: string;
}

export interface BackendVerifyOtpInput {
  email: string;
  otp: string;
}

export interface BackendVerifyOtpResult {
  verified: boolean;
  resetRequired?: boolean;
  resetToken?: string;
  expiresInSeconds?: number;
  otpLength?: number;
}

export interface BackendResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

export interface BackendResetPasswordResult {
  reset: boolean;
}

export function isBackendAuthEnabled(): boolean {
  return getBackendEnabled();
}

export function isOpenAuthEnabled(): boolean {
  return OPEN_AUTH;
}

export async function backendRegister(input: BackendRegisterInput): Promise<BackendAuthResponse> {
  return request<BackendAuthResponse>("/auth/register", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      phone: input.phone,
      roles: ["admin"],
    },
  });
}

export async function backendLogin(input: BackendLoginInput): Promise<BackendAuthResponse> {
  return request<BackendAuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function backendFetchSession(): Promise<BackendSessionResponse> {
  return request<BackendSessionResponse>("/auth/session", {
    method: "GET",
  });
}

export async function backendForgotPassword(input: BackendForgotPasswordInput): Promise<{ sent: boolean }> {
  return request<{ sent: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: input,
  });
}

export async function backendVerifyOtp(input: BackendVerifyOtpInput): Promise<BackendVerifyOtpResult> {
  return request<BackendVerifyOtpResult>("/auth/verify-otp", {
    method: "POST",
    body: input,
  });
}

export async function backendResetPassword(input: BackendResetPasswordInput): Promise<BackendResetPasswordResult> {
  return request<BackendResetPasswordResult>("/auth/reset-password", {
    method: "POST",
    body: input,
  });
}
