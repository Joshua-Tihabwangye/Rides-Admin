import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, getBackendEnabled } from "./config";
import { request, configureHttpClientAuth, type TokenRefreshResult } from "./httpClient";

export const ADMIN_BACKEND_ACCESS_TOKEN_KEY = "admin_backend_access_token";
export const ADMIN_BACKEND_REFRESH_TOKEN_KEY = "admin_backend_refresh_token";
const ADMIN_AUTH_STORAGE_KEY = "evzone_admin_auth";
const RIDERS_KEY = "evzone_admin_riders";
const DRIVERS_KEY = "evzone_admin_drivers";
const AUDIT_KEY = "evzone_admin_audit_events";

type AdminRiderResponse = {
  riderId: string;
  fullName: string;
  phone: string;
  city: string;
  status: "active" | "deleted";
};

type AdminDriverResponse = {
  driverId: string;
  fullName: string;
  phone: string;
  city: string;
  status: "active" | "deleted";
};

type AuditLogResponse = {
  id: string;
  action: string;
  createdAt: number;
  actorId: string;
  resource: string;
  resourceId?: string;
};

type AdminFeatureFlagResponse = {
  id: string;
  key: string;
  enabled: boolean;
  scope: "global" | "rider" | "driver" | "fleet" | "admin";
  description?: string;
};

type AdminCreateUserInput = {
  email: string;
  phone?: string;
  fullName?: string;
  city?: string;
  country?: string;
};

type AdminUpdateUserInput = Partial<{
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: "active" | "deleted";
}>;

export function isAdminBackendEnabled(): boolean {
  return getBackendEnabled();
}

export function readAdminBackendAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_BACKEND_ACCESS_TOKEN_KEY);
}

export function readAdminBackendRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ADMIN_BACKEND_REFRESH_TOKEN_KEY);
}

export function saveAdminBackendTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_BACKEND_ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(ADMIN_BACKEND_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAdminBackendTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_BACKEND_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_BACKEND_REFRESH_TOKEN_KEY);
}

function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  clearAdminBackendTokens();
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
}

async function refreshAdminTokens(refreshToken: string): Promise<TokenRefreshResult> {
  const payload = await request<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
    retryOnUnauthorized: false,
  });

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  };
}

configureHttpClientAuth({
  getAccessToken: readAdminBackendAccessToken,
  getRefreshToken: readAdminBackendRefreshToken,
  setTokens: saveAdminBackendTokens,
  clearSession: clearAdminSession,
  refresh: refreshAdminTokens,
  onUnauthorized: () => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/admin/login") {
      window.location.assign("/admin/login");
    }
  },
});

export function createAdminSocket(): Socket {
  return io(`${API_BASE_URL}/admin`, {
    path: "/socket.io",
    transports: ["websocket"],
    autoConnect: false,
    withCredentials: false,
    auth: {
      token: readAdminBackendAccessToken(),
    },
  });
}

function writeStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function listAdminRiders(): Promise<AdminRiderResponse[]> {
  return request<AdminRiderResponse[]>("/admin/riders");
}

export async function listAdminDrivers(): Promise<AdminDriverResponse[]> {
  return request<AdminDriverResponse[]>("/admin/drivers");
}

export async function createAdminRider(input: AdminCreateUserInput) {
  return request<{ riderId: string }>("/admin/riders", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminRider(riderId: string, input: AdminUpdateUserInput) {
  return request(`/admin/riders/${riderId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function createAdminDriver(input: AdminCreateUserInput) {
  return request<{ driverId: string }>("/admin/drivers", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminDriver(driverId: string, input: AdminUpdateUserInput) {
  return request(`/admin/drivers/${driverId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function listAdminAuditEvents(): Promise<AuditLogResponse[]> {
  return request<AuditLogResponse[]>("/admin/system/audit-log");
}

export async function listAdminFeatureFlags(): Promise<AdminFeatureFlagResponse[]> {
  return request<AdminFeatureFlagResponse[]>("/admin/system/flags");
}

export async function patchAdminFeatureFlag(
  flagKey: string,
  input: Partial<Pick<AdminFeatureFlagResponse, "enabled" | "description">>,
) {
  return request<AdminFeatureFlagResponse>(`/admin/system/flags/${flagKey}`, {
    method: "PATCH",
    body: input,
  });
}

export async function syncAdminReferenceData(): Promise<void> {
  if (typeof window === "undefined" || !getBackendEnabled() || !readAdminBackendAccessToken()) {
    return;
  }

  const [riders, drivers, auditEvents] = await Promise.all([
    listAdminRiders(),
    listAdminDrivers(),
    listAdminAuditEvents(),
  ]);

  writeStorage(RIDERS_KEY, riders.map((rider, index) => ({
    id: index + 101,
    backendId: rider.riderId,
    name: rider.fullName,
    phone: rider.phone,
    city: rider.city,
    vehicle: "EV Rider",
    vehicleType: "Bike",
    trips: 0,
    spend: "$0",
    risk: "Low",
    primaryStatus: rider.status === "active" ? "approved" : "suspended",
    activityStatus: rider.status === "active" ? "active" : "inactive",
  })));

  writeStorage(DRIVERS_KEY, drivers.map((driver, index) => ({
    id: index + 201,
    backendId: driver.driverId,
    name: driver.fullName,
    phone: driver.phone,
    city: driver.city,
    vehicle: "Fleet vehicle",
    vehicleType: "Car",
    trips: 0,
    spend: "$0",
    risk: "Low",
    primaryStatus: driver.status === "active" ? "approved" : "suspended",
    activityStatus: driver.status === "active" ? "active" : "inactive",
  })));

  writeStorage(AUDIT_KEY, auditEvents.map((item) => ({
    event: item.action,
    at: new Date(item.createdAt).toISOString(),
    actor: item.actorId,
    resource: item.resource,
    resourceId: item.resourceId,
  })));
}
