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
  id: string;
  userId: string;
  riderId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  preferredCurrency?: string;
  preferences?: Record<string, any>;
  rating?: number;
  totalTrips?: number;
  status: 'active' | 'deleted' | 'suspended';
  roles: string[];
  user?: unknown; // nested user object if needed, but we mainly need above
};

type AdminDriverResponse = {
  id: string;
  userId: string;
  driverId?: string;
  fleetId?: string;
  branchId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  driverLicenseNumber?: string;
  serviceMode?: string;
  preferences?: Record<string, any>;
  checkpoints?: Record<string, any>;
  status?: string;
  onboardingStatus?: string;
  currentLocation?: { lat: number; lng: number } | null;
  lastLocationAt?: Date | null;
  rating?: number;
  totalTrips?: number;
  roles: string[];
  user?: unknown;
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

// Company (Fleet Partner)
type AdminCompanyResponse = {
  id: string;
  companyName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  status: "pending" | "approved" | "suspended";
  verticals: Record<string, boolean>;
};

type AdminCreateCompanyInput = {
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  registrationNumber?: string;
  taxId?: string;
  verticals?: Record<string, boolean>;
};

type AdminUpdateCompanyInput = Partial<{
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  registrationNumber: string;
  taxId: string;
  status: "pending" | "approved" | "suspended";
  verticals: Record<string, boolean>;
}>;

// Approval
type AdminApprovalResponse = {
  id: string;
  entityType: "company" | "driver" | "vehicle" | "document";
  entityId: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  reviewedBy: string | null;
  notes: string | null;
  createdAt: number;
  reviewedAt: number | null;
};

type ReviewApprovalInput = {
  decision: "approved" | "rejected";
  notes?: string;
};

// Analytics
type AdminOperationsAnalytics = {
  period: "day" | "week" | "month" | "quarter" | "year";
  trips: {
    total: number;
    completed: number;
    active: number;
  };
  dispatches: {
    total: number;
    pending: number;
  };
  drivers: {
    total: number;
    online: number;
  };
};

type AdminFinanceAnalytics = {
  period: "day" | "week" | "month" | "quarter" | "year";
  grossEarnings: number;
  earningsCount: number;
  payoutsPending: number;
  walletExposure: number;
  currency: string;
};

type AnalyticsQuery = {
  period?: "day" | "week" | "month" | "quarter" | "year";
};

// Pricing
type AdminPricingResponse = {
  id: string;
  name: string;
  service: string;
  status: "active" | "inactive";
  pricingRules: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

type AdminCreatePricingInput = {
  name: string;
  service: string;
  pricingRules: Record<string, unknown>;
};

type AdminUpdatePricingInput = Partial<{
  name: string;
  service: string;
  status: "active" | "inactive";
  pricingRules: Record<string, unknown>;
}>;

// Promo
type AdminPromoResponse = {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: number;
  status: "draft" | "active" | "expired";
  createdAt: number;
  updatedAt: number;
};

type AdminCreatePromoInput = {
  code: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: number;
};

type AdminUpdatePromoInput = Partial<{
  description: string;
  discountType: "percent" | "flat";
  discountValue: number;
  status: "draft" | "active" | "expired";
}>;

// Service
type AdminServiceResponse = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

type AdminCreateServiceInput = {
  key: string;
  name: string;
  enabled?: boolean;
  configuration?: Record<string, unknown>;
};

type AdminUpdateServiceInput = Partial<{
  name: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
}>;

// Risk
type AdminRiskCaseResponse = {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "monitoring" | "resolved";
  subjectType: "rider" | "driver" | "fleet" | "trip";
  subjectId: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

// Safety Incident (admin view)
type AdminSafetyIncidentResponse = {
  id: string;
  tripId: string;
  type: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved";
  actor: "driver" | "rider";
  location: { lat: number; lng: number } | null;
  createdAt: number;
  resolvedAt: number | null;
};

// System Overview
type AdminSystemOverview = {
  totals: {
    users: number;
    riders: number;
    drivers: number;
    companies: number;
    trips: number;
  };
  queues: {
    approvals: number;
    riskCases: number;
    safetyIncidents: number;
  };
};

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

// Companies
export async function listAdminCompanies(): Promise<AdminCompanyResponse[]> {
  return request<AdminCompanyResponse[]>("/admin/companies");
}

export async function createAdminCompany(input: AdminCreateCompanyInput) {
  return request<{ companyId: string }>("/admin/companies", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminCompany(companyId: string, input: AdminUpdateCompanyInput) {
  return request<AdminCompanyResponse>(`/admin/companies/${companyId}`, {
    method: "PATCH",
    body: input,
  });
}

// Approvals
export async function listAdminApprovals(): Promise<AdminApprovalResponse[]> {
  return request<AdminApprovalResponse[]>("/admin/approvals");
}

export async function reviewAdminApproval(approvalId: string, input: ReviewApprovalInput) {
  return request<AdminApprovalResponse>(`/admin/approvals/${approvalId}`, {
    method: "PATCH",
    body: input,
  });
}

// Analytics
export async function getAdminOperationsAnalytics(query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  if (query.period) params.append("period", query.period);
  return request<AdminOperationsAnalytics>(`/admin/analytics/operations?${params}`);
}

export async function getAdminFinanceAnalytics(query: AnalyticsQuery = {}) {
  const params = new URLSearchParams();
  if (query.period) params.append("period", query.period);
  return request<AdminFinanceAnalytics>(`/admin/analytics/finance?${params}`);
}

// Safety Incidents
export async function listAdminSafetyIncidents(): Promise<AdminSafetyIncidentResponse[]> {
  return request<AdminSafetyIncidentResponse[]>("/admin/safety/incidents");
}

// Risk Cases
export async function listAdminRiskCases(): Promise<AdminRiskCaseResponse[]> {
  return request<AdminRiskCaseResponse[]>("/admin/risk/cases");
}

// Pricing
export async function listAdminPricing(): Promise<AdminPricingResponse[]> {
  return request<AdminPricingResponse[]>("/admin/pricing");
}

export async function createAdminPricing(input: AdminCreatePricingInput) {
  return request<{ pricingId: string }>("/admin/pricing", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminPricing(pricingId: string, input: AdminUpdatePricingInput) {
  return request<AdminPricingResponse>(`/admin/pricing/${pricingId}`, {
    method: "PATCH",
    body: input,
  });
}

// Promos
export async function listAdminPromos(): Promise<AdminPromoResponse[]> {
  return request<AdminPromoResponse[]>("/admin/promos");
}

export async function createAdminPromo(input: AdminCreatePromoInput) {
  return request<{ promoId: string }>("/admin/promos", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminPromo(promoId: string, input: AdminUpdatePromoInput) {
  return request<AdminPromoResponse>(`/admin/promos/${promoId}`, {
    method: "PATCH",
    body: input,
  });
}

// Services
export async function listAdminServices(): Promise<AdminServiceResponse[]> {
  return request<AdminServiceResponse[]>("/admin/services");
}

export async function createAdminService(input: AdminCreateServiceInput) {
  return request<{ serviceId: string }>("/admin/services", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminService(serviceId: string, input: AdminUpdateServiceInput) {
  return request<AdminServiceResponse>(`/admin/services/${serviceId}`, {
    method: "PATCH",
    body: input,
  });
}

// System Overview
export async function getAdminSystemOverview(): Promise<AdminSystemOverview> {
  return request<AdminSystemOverview>("/admin/system/overview");
}

// Single rider detail
export async function getAdminRider(riderId: string): Promise<AdminRiderResponse> {
  return request<AdminRiderResponse>(`/admin/riders/${riderId}`);
}

// Single driver detail
export async function getAdminDriver(driverId: string): Promise<AdminDriverResponse> {
  return request<AdminDriverResponse>(`/admin/drivers/${driverId}`);
}

// Single company
export async function getAdminCompany(companyId: string) {
  return request<AdminCompanyResponse>(`/admin/companies/${companyId}`);
}

// Single approval
export async function getAdminApproval(approvalId: string) {
  return request<AdminApprovalResponse>(`/admin/approvals/${approvalId}`);
}

// Single pricing config
export async function getAdminPricing(pricingId: string) {
  return request<AdminPricingResponse>(`/admin/pricing/${pricingId}`);
}

// Single promo
export async function getAdminPromo(promoId: string) {
  return request<AdminPromoResponse>(`/admin/promos/${promoId}`);
}

// Single service config
export async function getAdminService(serviceId: string) {
  return request<AdminServiceResponse>(`/admin/services/${serviceId}`);
}

// Single risk case
export async function getAdminRiskCase(riskCaseId: string) {
  return request<AdminRiskCaseResponse>(`/admin/risk/cases/${riskCaseId}`);
}
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
