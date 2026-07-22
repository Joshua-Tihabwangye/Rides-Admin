import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE_URL, SOCKET_PATH, getBackendEnabled } from "./config";
import { request, configureHttpClientAuth, type TokenRefreshResult } from "./httpClient";
import {
  normalizeAdminCreateDriverInput,
  normalizeAdminCreatePlatformUserInput,
  normalizeAdminCreateRiderInput,
} from "./validators";

export const ADMIN_BACKEND_ACCESS_TOKEN_KEY = "admin_backend_access_token";
export const ADMIN_BACKEND_REFRESH_TOKEN_KEY = "admin_backend_refresh_token";
export const ADMIN_SUMMARY_UPDATED_EVENT = "evzone:admin-summary-updated";
const ADMIN_AUTH_STORAGE_KEY = "evzone_admin_auth";

export type AdminRiderResponse = {
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

export type AdminDriverResponse = {
  driverId: string;
  userId: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  city: string;
  status: 'active' | 'deleted' | 'suspended';
  vehicleType: 'Bike' | 'Car';
  totalTrips?: number;
  licensePlate?: string;
  model?: string;
  rating?: number;
  roles?: string[];
};

export type AdminAuditEventResponse = {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  createdAt: number;
  metadata?: Record<string, any>;
};

export type AdminUserResponse = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  regions: string;
  status: "Active" | "Suspended";
  lastLogin: number;
  twoFA: boolean;
  avatarColor?: string;
};

// Auth helpers for admin backend tokens
export function readAdminBackendAccessToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_BACKEND_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAdminBackendAccessToken(token: string): void {
  localStorage.setItem(ADMIN_BACKEND_ACCESS_TOKEN_KEY, token);
}

export function readAdminBackendRefreshToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_BACKEND_REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAdminBackendRefreshToken(token: string): void {
  localStorage.setItem(ADMIN_BACKEND_REFRESH_TOKEN_KEY, token);
}

export function clearAdminBackendTokens(): void {
  try {
    localStorage.removeItem(ADMIN_BACKEND_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_BACKEND_REFRESH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
  } catch {
    // no-op
  }
}

async function refreshAdminBackendTokens(refreshToken: string): Promise<TokenRefreshResult> {
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
  clearSession: clearAdminBackendTokens,
  refresh: refreshAdminBackendTokens,
  onUnauthorized: () => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== "/admin/login") {
      window.location.assign("/admin/login");
    }
  },
});

// ── Admin Users ──────────────────────────────────────────────────────────

export async function listAdminRiders(): Promise<AdminRiderResponse[]> {
  return request<AdminRiderResponse[]>("/admin/riders", { method: "GET" });
}

export async function getAdminRider(riderId: string): Promise<AdminRiderResponse> {
  return request<AdminRiderResponse>(`/admin/riders/${riderId}`, { method: "GET" });
}

// Alias for legacy import name
export { getAdminRider as getRider };

export async function createAdminRider(input: AdminCreateUserInput): Promise<{ userId: string }> {
  return request<{ userId: string }>("/admin/riders", {
    method: "POST",
    body: normalizeAdminCreateRiderInput(input),
  });
}

export async function patchAdminRider(userId: string, input: AdminUpdateUserInput) {
  return request<AdminRiderResponse>(`/admin/riders/${userId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function listAdminDrivers(): Promise<AdminDriverResponse[]> {
  return request<AdminDriverResponse[]>("/admin/drivers", { method: "GET" });
}

export async function getAdminDriver(driverId: string): Promise<AdminDriverResponse> {
  return request<AdminDriverResponse>(`/admin/drivers/${driverId}`, { method: "GET" });
}

export async function createAdminDriver(input: AdminCreateDriverInput): Promise<{ driverId: string }> {
  return request<{ driverId: string }>("/admin/drivers", {
    method: "POST",
    body: normalizeAdminCreateDriverInput(input),
  });
}

export async function patchAdminDriver(driverId: string, input: AdminUpdateDriverInput) {
  return request<AdminDriverResponse>(`/admin/drivers/${driverId}`, {
    method: "PATCH",
    body: input,
  });
}

export type AdminSelfProfileResponse = {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  department?: string;
  permissions?: Record<string, unknown>;
};

export type AdminPortalSettingsResponse = {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    weeklyDigest: boolean;
  };
  language: string;
  timezone: string;
  regions: {
    eastAfrica: boolean;
    westAfrica: boolean;
    global: boolean;
  };
  limitAssignedOnly: boolean;
};

export async function getAdminMyProfile(): Promise<AdminSelfProfileResponse> {
  return request<AdminSelfProfileResponse>("/admins/me/profile", { method: "GET" });
}

export async function patchAdminMyProfile(
  input: Partial<{
    firstName: string;
    lastName: string;
    department: string;
    permissions: Record<string, unknown>;
  }>
): Promise<AdminSelfProfileResponse> {
  return request<AdminSelfProfileResponse>("/admins/me/profile", {
    method: "PATCH",
    body: input,
  });
}

export async function getAdminPortalSettings(): Promise<AdminPortalSettingsResponse> {
  return request<AdminPortalSettingsResponse>("/admins/me/settings", { method: "GET" });
}

export async function patchAdminPortalSettings(
  input: Partial<{
    notifications: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      weeklyDigest?: boolean;
    };
    language: string;
    timezone: string;
  }>
): Promise<AdminPortalSettingsResponse> {
  return request<AdminPortalSettingsResponse>("/admins/me/settings", {
    method: "PATCH",
    body: input,
  });
}

export async function patchAdminProfileRegions(
  input: Partial<{
    name: string;
    phone: string;
    regions: {
      eastAfrica?: boolean;
      westAfrica?: boolean;
      global?: boolean;
    };
    limitAssignedOnly: boolean;
  }>
): Promise<AdminPortalSettingsResponse> {
  return request<AdminPortalSettingsResponse>("/admins/me/profile-regions", {
    method: "PATCH",
    body: input,
  });
}

// ── Roles ─────────────────────────────────────────────────────────────────

export type AdminRoleResponse = {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: number;
};

export type AdminCreateRoleInput = {
  name: string;
  description?: string;
  permissions: string[];
};

export type AdminUpdateRoleInput = Partial<{
  name: string;
  description: string;
  permissions: string[];
}>;

export async function listAdminRoles(): Promise<AdminRoleResponse[]> {
  return request<AdminRoleResponse[]>("/admin/roles", { method: "GET" });
}

export async function getAdminRole(roleId: string): Promise<AdminRoleResponse> {
  return request<AdminRoleResponse>(`/admin/roles/${roleId}`, { method: "GET" });
}

export async function createAdminRole(input: AdminCreateRoleInput) {
  return request<{ roleId: string }>("/admin/roles", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminRole(roleId: string, input: AdminUpdateRoleInput) {
  return request<AdminRoleResponse>(`/admin/roles/${roleId}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Pricing Zone (Geofence) ───────────────────────────────────────────────

export type AdminPricingZoneResponse = {
  id: string;
  name: string;
  city?: string;
  country?: string;
  status: "active" | "inactive";
  boundaries: {
    type: "Polygon";
    coordinates: number[][][]; // [ [ [lng, lat], ... ] ]
  };
  services?: any[];
  pricingRules?: Record<string, any> | Record<string, any>[];
  createdAt?: number;
  updatedAt?: number;
};

export type AdminUpdatePricingZoneInput = Partial<{
  name: string;
  city: string;
  country: string;
  status: "active" | "inactive";
  boundaries: { type: "Polygon"; coordinates: number[][][] };
  services: any[];
  pricingRules: Record<string, any> | Record<string, any>[];
}>;

export async function getAdminPricingZone(zoneId: string): Promise<AdminPricingZoneResponse> {
  return request<AdminPricingZoneResponse>(`/admin/pricing-zones/${zoneId}`);
}

export async function listAdminPricingZones(): Promise<AdminPricingZoneResponse[]> {
  return request<AdminPricingZoneResponse[]>("/admin/pricing-zones");
}

export async function createAdminPricingZone(input: Partial<AdminPricingZoneResponse>) {
  return request<AdminPricingZoneResponse>("/admin/pricing-zones", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminPricingZone(zoneId: string, input: AdminUpdatePricingZoneInput) {
  return request<AdminPricingZoneResponse>(`/admin/pricing-zones/${zoneId}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Services ────────────────────────────────────────────────────────────────

export type AdminServiceResponse = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  description?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type AdminUpdateServiceInput = Partial<{
  name: string;
  enabled: boolean;
  description: string;
}>;

export async function listAdminServices(): Promise<AdminServiceResponse[]> {
  return request<AdminServiceResponse[]>("/admin/services", { method: "GET" });
}

export async function patchAdminService(
  serviceId: string,
  input: AdminUpdateServiceInput
): Promise<AdminServiceResponse> {
  return request<AdminServiceResponse>(`/admin/services/${serviceId}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Training Modules ───────────────────────────────────────────────────────

export type AdminTrainingModuleResponse = {
  id: string;
  title: string;
  category: string;
  status: "draft" | "published" | "archived";
  content?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
};

export type AdminCreateTrainingModuleInput = {
  title: string;
  category: string;
  status?: "draft" | "published" | "archived";
  content?: string;
};

export type AdminUpdateTrainingModuleInput = Partial<AdminCreateTrainingModuleInput>;

export async function listAdminTrainingModules(): Promise<AdminTrainingModuleResponse[]> {
  return request<AdminTrainingModuleResponse[]>("/admin/training/modules", { method: "GET" });
}

export async function createAdminTrainingModule(
  input: AdminCreateTrainingModuleInput
): Promise<AdminTrainingModuleResponse> {
  return request<AdminTrainingModuleResponse>("/admin/training/modules", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminTrainingModule(
  moduleId: string,
  input: AdminUpdateTrainingModuleInput
): Promise<AdminTrainingModuleResponse> {
  return request<AdminTrainingModuleResponse>(`/admin/training/modules/${moduleId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteAdminTrainingModule(moduleId: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/admin/training/modules/${moduleId}`, {
    method: "DELETE",
  });
}

// ── Feature Flags ───────────────────────────────────────────────────────────

export type AdminFeatureFlagResponse = {
  id: string;
  key: string;
  enabled: boolean;
  scope: string;
  description?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type AdminUpdateFeatureFlagInput = Partial<{
  enabled: boolean;
  scope: string;
  description: string;
}>;

export async function listAdminFeatureFlags(): Promise<AdminFeatureFlagResponse[]> {
  return request<AdminFeatureFlagResponse[]>("/admin/system/flags", { method: "GET" });
}

export async function patchAdminFeatureFlag(
  flagKey: string,
  input: AdminUpdateFeatureFlagInput
): Promise<AdminFeatureFlagResponse> {
  return request<AdminFeatureFlagResponse>(`/admin/system/flags/${flagKey}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Analytics ───────────────────────────────────────────────────────────────

export type AdminAnalyticsPeriod = "today" | "7days" | "thisMonth" | "thisYear" | "custom";

export type AdminFinanceAnalytics = {
  grossEarnings: number;
  earningsCount: number;
  payoutsPending: number;
  currency: string;
};

export type AdminOperationsAnalytics = {
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
    online: number;
    total: number;
  };
  hourly?: Array<{ time?: string; demand?: number; supply?: number; rides?: number; deliveries?: number; bookings?: number }>;
  regions?: Array<{ region?: string; rides?: number; deliveries?: number }>;
};

type AnalyticsQuery = {
  period: AdminAnalyticsPeriod;
  start?: string;
  end?: string;
};

function mapPeriodToBackend(period: AdminAnalyticsPeriod): "day" | "week" | "month" | "year" {
  switch (period) {
    case "today":
      return "day";
    case "7days":
      return "week";
    case "thisYear":
      return "year";
    case "custom":
    case "thisMonth":
    default:
      return "month";
  }
}

function toQueryString(input: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) search.set(key, String(value));
  });
  const raw = search.toString();
  return raw ? `?${raw}` : "";
}

export async function getAdminFinanceAnalytics(
  query: AnalyticsQuery
): Promise<AdminFinanceAnalytics> {
  return request<AdminFinanceAnalytics>(
    `/admin/analytics/finance${toQueryString({
      period: mapPeriodToBackend(query.period),
    })}`,
    { method: "GET" }
  );
}

export async function getAdminOperationsAnalytics(
  query: AnalyticsQuery
): Promise<AdminOperationsAnalytics> {
  return request<AdminOperationsAnalytics>(
    `/admin/analytics/operations${toQueryString({
      period: mapPeriodToBackend(query.period),
    })}`,
    { method: "GET" }
  );
}

// ── Real-time Operations Monitoring ─────────────────────────────────────────

export type AdminMonitoringSnapshot = {
  onlineDrivers: number;
  staleDrivers: number;
  activeRideJobs: number;
  activeDeliveryJobs: number;
  failedDispatches: number;
  expiredDocumentCount: number;
  compliancePendingCount: number;
  lastUpdatedAt?: string;
};

export async function getAdminMonitoringSnapshot(): Promise<AdminMonitoringSnapshot> {
  return request<AdminMonitoringSnapshot>("/admin/monitoring/snapshot", { method: "GET" });
}

// ── Monitoring detail endpoints (observability dashboards) ──────────────────
// NOTE: These endpoints are not fully exposed by the backend yet. The wrappers
// below fall back to the closest existing endpoints so the UI can render real
// data as soon as the backend implements them, while staying accurate today.

export type AdminOnlineDriver = AdminDriverResponse & {
  lastHeartbeatAt?: string;
};

export type AdminStaleDriver = AdminOnlineDriver & {
  secondsSinceHeartbeat: number;
};

export type AdminActiveJob = {
  id: string;
  serviceType: "ride" | "delivery";
  status: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  driverId?: string;
  driverName?: string;
  riderId?: string;
  riderName?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminFailedDispatch = {
  id: string;
  serviceType: "ride" | "delivery";
  reason?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  createdAt?: string;
};

function normalizeBookingToJob(
  booking: AdminRecentBooking,
  serviceType: "ride" | "delivery"
): AdminActiveJob {
  return {
    id: booking.id,
    serviceType,
    status: booking.status,
    pickupAddress:
      typeof booking.pickup === "string"
        ? booking.pickup
        : booking.pickupAddress,
    dropoffAddress:
      typeof booking.destination === "string"
        ? booking.destination
        : typeof booking.dropoff === "string"
        ? booking.dropoff
        : booking.dropoffAddress,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

export async function listAdminOnlineDrivers(): Promise<AdminOnlineDriver[]> {
  // Gap: backend has no dedicated /admin/monitoring/drivers/online endpoint.
  // Closest existing endpoint is the driver list.
  const drivers = await listAdminDrivers();
  return drivers.filter((driver) => driver.status === "active");
}

export async function listAdminStaleDrivers(): Promise<AdminStaleDriver[]> {
  // Gap: backend does not expose driver heartbeat timestamps yet.
  const drivers = await listAdminOnlineDrivers();
  return drivers.map((driver) => ({
    ...driver,
    secondsSinceHeartbeat: 0,
  }));
}

export async function listAdminActiveRideJobs(): Promise<AdminActiveJob[]> {
  // Gap: backend has no dedicated active-jobs endpoint yet.
  // Closest existing endpoint is recent bookings.
  const recent = await getAdminRecentBookings();
  return (recent.rides || [])
    .filter(
      (booking) =>
        booking.status && !["completed", "cancelled", "failed"].includes(booking.status)
    )
    .map((booking) => normalizeBookingToJob(booking, "ride"));
}

export async function listAdminActiveDeliveryJobs(): Promise<AdminActiveJob[]> {
  const recent = await getAdminRecentBookings();
  return (recent.deliveries || [])
    .filter(
      (booking) =>
        booking.status && !["completed", "cancelled", "failed"].includes(booking.status)
    )
    .map((booking) => normalizeBookingToJob(booking, "delivery"));
}

export async function listAdminFailedDispatches(): Promise<AdminFailedDispatch[]> {
  // Gap: backend has no dedicated failed-dispatches endpoint yet.
  const recent = await getAdminRecentBookings();
  const mapBooking = (
    booking: AdminRecentBooking,
    serviceType: "ride" | "delivery"
  ): AdminFailedDispatch => ({
    id: booking.id,
    serviceType,
    reason: booking.status,
    pickupAddress:
      typeof booking.pickup === "string"
        ? booking.pickup
        : booking.pickupAddress,
    dropoffAddress:
      typeof booking.destination === "string"
        ? booking.destination
        : typeof booking.dropoff === "string"
        ? booking.dropoff
        : booking.dropoffAddress,
    createdAt: booking.createdAt,
  });

  const rides = (recent.rides || [])
    .filter((booking) => ["failed", "no_driver", "cancelled"].includes(booking.status))
    .map((booking) => mapBooking(booking, "ride"));
  const deliveries = (recent.deliveries || [])
    .filter((booking) => ["failed", "no_driver", "cancelled"].includes(booking.status))
    .map((booking) => mapBooking(booking, "delivery"));

  return [...rides, ...deliveries];
}

// ── Matching Inspection ─────────────────────────────────────────────────────

export type AdminMatchingJob = {
  id: string;
  serviceType: string;
  serviceId: string;
  status: string;
  pickupLatitude: number;
  pickupLongitude: number;
  currentRadiusMeters: number;
  dispatchRound: number;
  expiresAt?: string;
  assignedDriverId?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminMatchingJobOffer = {
  id: string;
  jobId: string;
  driverId: string;
  status: string;
  offeredAt: string;
  expiresAt: string;
  respondedAt?: string;
  distanceMeters?: number;
};

export type AdminDispatchSnapshot = {
  dispatchRound: number;
  radiusMeters: number;
  timestamp: string;
  nearbyDrivers: Array<{
    driverId: string;
    distanceKm: number;
    latitude?: number;
    longitude?: number;
  }>;
  eligibleDrivers: string[];
  rejectedDrivers: Array<{
    driverId: string;
    reason: string;
    details?: Record<string, unknown>;
  }>;
  rankedDrivers: Array<{
    rank: number;
    driverId: string;
    distanceKm: number;
  }>;
};

export type AdminMatchingJobDetail = {
  job: AdminMatchingJob;
  offers: AdminMatchingJobOffer[];
  dispatchSnapshot: AdminDispatchSnapshot | null;
  failureReason: string | null;
};

export async function listAdminMatchingJobs(
  status?: string,
  limit = 50,
): Promise<{ items: AdminMatchingJob[] }> {
  return request<{ items: AdminMatchingJob[] }>(
    `/matching/jobs${toQueryString({ status, limit: String(limit) })}`,
    { method: "GET" },
  );
}

export async function getAdminMatchingJobDetail(id: string): Promise<AdminMatchingJobDetail> {
  return request<AdminMatchingJobDetail>(`/matching/jobs/${id}`, { method: "GET" });
}

export async function retryAdminMatchingJob(id: string): Promise<{ dispatched: boolean; reason?: string }> {
  return request<{ dispatched: boolean; reason?: string }>(`/matching/jobs/${id}/retry`, { method: "POST" });
}

// ── Driver / Vehicle Document Review ────────────────────────────────────────

export type AdminPendingDocument = {
  id: string;
  type: string;
  status: string;
  fileUrl: string;
  issueDate?: string;
  expiryDate?: string;
  createdAt: string;
  driverId?: string;
  vehicleId?: string;
  rejectionReason?: string;
  reviewedAt?: string;
};

export type AdminDocumentReviewInput = {
  status: "verified" | "rejected";
  rejectionReason?: string;
};

export async function listAdminPendingDriverDocuments(page = 1, limit = 20): Promise<{
  items: AdminPendingDocument[];
  meta: { page: number; limit: number; total: number; pageCount: number };
}> {
  return request<{ items: AdminPendingDocument[]; meta: { page: number; limit: number; total: number; pageCount: number } }>(
    `/admin/driver-documents/pending${toQueryString({ page: String(page), limit: String(limit) })}`,
    { method: "GET" },
  );
}

export async function reviewAdminDriverDocument(id: string, input: AdminDocumentReviewInput) {
  return request<AdminPendingDocument>(`/admin/driver-documents/${id}/review`, { method: "PATCH", body: input });
}

export async function listAdminPendingVehicleDocuments(page = 1, limit = 20): Promise<{
  items: AdminPendingDocument[];
  meta: { page: number; limit: number; total: number; pageCount: number };
}> {
  return request<{ items: AdminPendingDocument[]; meta: { page: number; limit: number; total: number; pageCount: number } }>(
    `/admin/vehicle-documents/pending${toQueryString({ page: String(page), limit: String(limit) })}`,
    { method: "GET" },
  );
}

export async function reviewAdminVehicleDocument(id: string, input: AdminDocumentReviewInput) {
  return request<AdminPendingDocument>(`/admin/vehicle-documents/${id}/review`, { method: "PATCH", body: input });
}

export type AdminDashboardCounts = {
  activeRides: number;
  activeDeliveries: number;
  drivers: number;
  rides: number;
  deliveries: number;
};

export async function getAdminDashboard(): Promise<AdminDashboardCounts> {
  const raw = await request<Record<string, number>>("/admin/dashboard", { method: "GET" });
  return {
    activeRides: raw.activeRides ?? 0,
    activeDeliveries: raw.activeDeliveries ?? 0,
    drivers: raw.drivers ?? 0,
    rides: raw.rides ?? 0,
    deliveries: raw.deliveries ?? 0,
  };
}

export type AdminRecentBooking = {
  id: string;
  status: string;
  pickup?: string | Record<string, unknown>;
  destination?: string | Record<string, unknown>;
  dropoff?: string | Record<string, unknown>;
  pickupAddress?: string;
  dropoffAddress?: string;
  createdAt?: string;
  updatedAt?: string;
  estimatedFare?: number;
};

export type AdminRecentBookings = {
  rides: AdminRecentBooking[];
  deliveries: AdminRecentBooking[];
  touristVehicles: AdminRecentBooking[];
  ambulance: AdminRecentBooking[];
  carRentals: AdminRecentBooking[];
};

export async function getAdminRecentBookings(limit = 50): Promise<AdminRecentBookings> {
  return request<AdminRecentBookings>(`/admin/bookings/recent${toQueryString({ limit: String(limit) })}`, { method: "GET" });
}

// ── Admin Finance ───────────────────────────────────────────────────────────

export type AdminFinanceListQuery = {
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type AdminCashout = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminPayout = {
  id: string;
  recipientId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type AdminPayment = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: string;
};

export type AdminSettlement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  currency?: string;
  totalAmount?: number;
  status: string;
  postedAt?: string;
  createdAt: string;
};

export type AdminWalletReconciliation = {
  id: string;
  periodStart: string;
  periodEnd: string;
  type?: string;
  currency?: string;
  status: string;
  createdAt: string;
};

export type AdminRevenueSummary = {
  totalRevenue: number;
  currency: string;
  byService?: Array<{ serviceType: string; amount: number }>;
};

export async function listAdminCashouts(query: AdminFinanceListQuery = {}): Promise<{ items: AdminCashout[]; meta?: { page: number; limit: number; total: number } }> {
  return request<{ items: AdminCashout[]; meta?: { page: number; limit: number; total: number } }>(`/admin-finance/cashouts${toQueryString(query)}`, { method: "GET" });
}

export async function reviewAdminCashout(id: string, input: { status: string; reason?: string; provider?: string }) {
  return request<AdminCashout>(`/admin-finance/cashouts/${id}/review`, { method: "PATCH", body: input });
}

export async function listAdminPayouts(query: AdminFinanceListQuery = {}): Promise<{ items: AdminPayout[]; meta?: { page: number; limit: number; total: number } }> {
  return request<{ items: AdminPayout[]; meta?: { page: number; limit: number; total: number } }>(`/admin-finance/payouts${toQueryString(query)}`, { method: "GET" });
}

export async function retryAdminPayout(id: string) {
  return request<AdminPayout>(`/admin-finance/payouts/${id}/retry`, { method: "POST" });
}

export async function listAdminPayments(query: AdminFinanceListQuery = {}): Promise<{ items: AdminPayment[]; meta?: { page: number; limit: number; total: number } }> {
  return request<{ items: AdminPayment[]; meta?: { page: number; limit: number; total: number } }>(`/admin-finance/payments${toQueryString(query)}`, { method: "GET" });
}

export async function refundAdminPayment(id: string, input: { amount?: number; reason?: string; idempotencyKey?: string }) {
  return request<AdminPayment>(`/admin-finance/payments/${id}/refund`, { method: "POST", body: input });
}

export async function getAdminRevenueSummary(query: AdminFinanceListQuery = {}): Promise<AdminRevenueSummary> {
  return request<AdminRevenueSummary>(`/admin-finance/revenue/summary${toQueryString(query)}`, { method: "GET" });
}

export async function listAdminSettlements(query: AdminFinanceListQuery = {}): Promise<{ items: AdminSettlement[]; meta?: { page: number; limit: number; total: number } }> {
  return request<{ items: AdminSettlement[]; meta?: { page: number; limit: number; total: number } }>(`/admin-finance/settlements${toQueryString(query)}`, { method: "GET" });
}

export async function createAdminSettlement(input: { periodStart: string; periodEnd: string; currency?: string; totalAmount?: number; provider?: string; settlementDate?: string }) {
  return request<AdminSettlement>("/admin-finance/settlements", { method: "POST", body: input });
}

export async function postAdminSettlement(id: string) {
  return request<AdminSettlement>(`/admin-finance/settlements/${id}/post`, { method: "PATCH" });
}

export async function cancelAdminSettlement(id: string) {
  return request<AdminSettlement>(`/admin-finance/settlements/${id}/cancel`, { method: "PATCH" });
}

export async function listAdminWalletReconciliations(query: AdminFinanceListQuery = {}): Promise<{ items: AdminWalletReconciliation[]; meta?: { page: number; limit: number; total: number } }> {
  return request<{ items: AdminWalletReconciliation[]; meta?: { page: number; limit: number; total: number } }>(`/admin-finance/wallet-reconciliation${toQueryString(query)}`, { method: "GET" });
}

export async function createAdminWalletReconciliation(input: { periodStart: string; periodEnd: string; type?: string; currency?: string; runId?: string }) {
  return request<AdminWalletReconciliation>("/admin-finance/wallet-reconciliation", { method: "POST", body: input });
}

// ── Reconciliation ──────────────────────────────────────────────────────────

export type AdminReconciliationRun = {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  summary?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
};

export type AdminReconciliationRecord = {
  id: string;
  runId: string;
  internalRecordType: string;
  internalRecordId: string;
  providerReference?: string;
  expectedAmount: number;
  settledAmount: number;
  variance: number;
  status: string;
  resolution?: string;
  createdAt: string;
};

export async function listAdminReconciliationRuns(query: { type?: string; status?: string } = {}): Promise<AdminReconciliationRun[]> {
  return request<AdminReconciliationRun[]>(`/admin/reconciliation/runs${toQueryString(query)}`, { method: "GET" });
}

export async function startAdminReconciliationRun(input: { type: string; periodStart: string; periodEnd: string; provider?: string; tolerance?: number }) {
  return request<AdminReconciliationRun>("/admin/reconciliation/runs", { method: "POST", body: input });
}

export async function getAdminReconciliationRun(id: string): Promise<AdminReconciliationRun> {
  return request<AdminReconciliationRun>(`/admin/reconciliation/runs/${id}`, { method: "GET" });
}

export async function listAdminReconciliationRecords(runId: string, query: { status?: string } = {}): Promise<AdminReconciliationRecord[]> {
  return request<AdminReconciliationRecord[]>(`/admin/reconciliation/runs/${runId}/records${toQueryString(query)}`, { method: "GET" });
}

export async function resolveAdminReconciliationRecord(runId: string, recordId: string, input: { status: string; resolution?: string }) {
  return request<AdminReconciliationRecord>(`/admin/reconciliation/runs/${runId}/records/${recordId}/resolve`, { method: "POST", body: input });
}

export async function listAdminReconciliationProviders(): Promise<{ providers: string[] }> {
  return request<{ providers: string[] }>("/admin/reconciliation/providers", { method: "GET" });
}

// ── Promotions ──────────────────────────────────────────────────────────────

export type AdminPromoResponse = {
  id: string;
  code: string;
  description?: string;
  discountType: "percent" | "flat";
  discountValue: number;
  status?: "active" | "inactive";
  createdAt?: number;
  updatedAt?: number;
};

export type AdminCreatePromoInput = {
  code: string;
  description?: string;
  discountType: "percent" | "flat";
  discountValue: number;
};

export type AdminUpdatePromoInput = Partial<AdminCreatePromoInput & {
  status: "active" | "inactive";
}>;

export async function listAdminPromos(): Promise<AdminPromoResponse[]> {
  return request<AdminPromoResponse[]>("/admin/promos", { method: "GET" });
}

export async function getAdminPromo(promoId: string): Promise<AdminPromoResponse> {
  return request<AdminPromoResponse>(`/admin/promos/${promoId}`, { method: "GET" });
}

export async function createAdminPromo(input: AdminCreatePromoInput): Promise<{ promoId: string }> {
  return request<{ promoId: string }>("/admin/promos", {
    method: "POST",
    body: input,
  });
}

export async function patchAdminPromo(
  promoId: string,
  input: AdminUpdatePromoInput
): Promise<AdminPromoResponse> {
  return request<AdminPromoResponse>(`/admin/promos/${promoId}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Risk Cases ──────────────────────────────────────────────────────────────

export type AdminRiskCaseResponse = {
  id: string;
  subjectId: string;
  subjectType: string;
  type: string;
  severity: "Low" | "Medium" | "High";
  notes?: string;
  createdAt: number;
  status?: "open" | "under_review" | "resolved";
};

export type AdminUpdateRiskCaseInput = Partial<{
  notes: string;
  status: "open" | "under_review" | "resolved";
}>;

export async function listAdminRiskCases(): Promise<AdminRiskCaseResponse[]> {
  return request<AdminRiskCaseResponse[]>("/admin/risk/cases", { method: "GET" });
}

export async function getAdminRiskCase(riskCaseId: string): Promise<AdminRiskCaseResponse> {
  return request<AdminRiskCaseResponse>(`/admin/risk/cases/${riskCaseId}`, { method: "GET" });
}

export async function patchAdminRiskCase(
  riskCaseId: string,
  input: AdminUpdateRiskCaseInput,
): Promise<AdminRiskCaseResponse> {
  return request<AdminRiskCaseResponse>(`/admin/risk/cases/${riskCaseId}`, {
    method: "PATCH",
    body: input,
  });
}

export type AdminRiderServiceResponse = {
  id: string;
  riderId: string;
  driverId?: string;
  serviceType: "rental" | "tour" | "ambulance";
  status: string;
  payload: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
};

export async function listAdminRiderServices(query?: {
  serviceType?: "rental" | "tour" | "ambulance";
  status?: string;
  riderId?: string;
}): Promise<AdminRiderServiceResponse[]> {
  return request<AdminRiderServiceResponse[]>(
    `/admin/rider-services${toQueryString({
      serviceType: query?.serviceType,
      status: query?.status,
      riderId: query?.riderId,
    })}`,
    { method: "GET" }
  );
}

export async function getAdminRiderService(requestId: string): Promise<AdminRiderServiceResponse> {
  return request<AdminRiderServiceResponse>(`/admin/rider-services/${requestId}`, { method: "GET" });
}

// ── Admin Backend Token Helpers ────────────────────────────────────────────

export function saveAdminBackendTokens(accessToken: string, refreshToken: string): void {
  writeAdminBackendAccessToken(accessToken);
  writeAdminBackendRefreshToken(refreshToken);
}

export function isAdminBackendEnabled(): boolean {
  return getBackendEnabled();
}

// ── Audit Events ────────────────────────────────────────────────────────────

export async function listAdminAuditEvents(): Promise<AdminAuditEventResponse[]> {
  return request<AdminAuditEventResponse[]>("/admin/system/audit-log", { method: "GET" });
}

export async function getAdminSystemOverview(): Promise<{
  totals: { users: number; riders: number; drivers: number; companies: number; trips: number };
  queues: { approvals: number; riskCases: number; safetyIncidents: number };
}> {
  return request<{ totals: { users: number; riders: number; drivers: number; companies: number; trips: number }; queues: { approvals: number; riskCases: number; safetyIncidents: number } }>("/admin/system/overview", { method: "GET" });
}

// ── Reference Data Sync ─────────────────────────────────────────────────────

export async function syncAdminReferenceData(): Promise<void> {
  if (typeof window === "undefined" || !getBackendEnabled() || !readAdminBackendAccessToken()) {
    return;
  }

  // Fetch reference data to warm the backend session and keep the summary event
  // source accurate. No localStorage caching is used; the admin portal reads
  // directly from the backend on every relevant page.
  await Promise.all([
    listAdminRiders(),
    listAdminDrivers(),
    listAdminAuditEvents(),
  ]);

  window.dispatchEvent(new Event(ADMIN_SUMMARY_UPDATED_EVENT));
}

export async function getAdminOperationalSummary(): Promise<{
  pendingApprovals: number;
  openRiskCases: number;
  openIncidents: number;
  payoutQueue: number;
  disabledServices: number;
  enabledFlags: number;
  notifications: Array<{
    id: string;
    type: "warning" | "error" | "info" | "success";
    title: string;
    message: string;
    time: string;
    read: boolean;
    path: string;
  }>;
}> {
  const [overview, approvals, riskCases, finance, services, flags] = await Promise.all([
    getAdminSystemOverview(),
    listAdminApprovals(),
    listAdminRiskCases(),
    getAdminFinanceAnalytics({ period: "today" }),
    listAdminServices(),
    listAdminFeatureFlags(),
  ]);

  const pendingApprovals = approvals.filter((approval) => approval.status === "pending").length;
  const openRiskCases = riskCases.filter((riskCase) => (riskCase.status ?? "open") !== "resolved").length;
  const openIncidents = overview.queues.safetyIncidents ?? 0;
  const payoutQueue = finance.payoutsPending ?? 0;
  const disabledServices = services.filter((service) => !service.enabled).length;
  const enabledFlags = flags.filter((flag) => flag.enabled).length;

  return {
    pendingApprovals,
    openRiskCases,
    openIncidents,
    payoutQueue,
    disabledServices,
    enabledFlags,
    notifications: [
      {
        id: "approvals",
        type: pendingApprovals > 0 ? "warning" : "success",
        title: "Company approvals",
        message: `${pendingApprovals} approval${pendingApprovals === 1 ? "" : "s"} awaiting review`,
        time: "live",
        read: pendingApprovals === 0,
        path: "/admin/approvals",
      },
      {
        id: "payouts",
        type: payoutQueue > 0 ? "warning" : "success",
        title: "Payout queue",
        message: `${payoutQueue.toLocaleString()} payout${payoutQueue === 1 ? "" : "s"} pending`,
        time: "live",
        read: payoutQueue === 0,
        path: "/admin/finance",
      },
      {
        id: "incidents",
        type: openIncidents > 0 ? "error" : "success",
        title: "Service health",
        message: `${openIncidents} incident${openIncidents === 1 ? "" : "s"} need attention`,
        time: "live",
        read: openIncidents === 0,
        path: "/admin/safety",
      },
      {
        id: "risk",
        type: openRiskCases > 0 ? "warning" : "success",
        title: "Risk desk",
        message: `${openRiskCases} case${openRiskCases === 1 ? "" : "s"} open`,
        time: "live",
        read: openRiskCases === 0,
        path: "/admin/risk",
      },
      {
        id: "services",
        type: disabledServices > 0 ? "info" : "success",
        title: "Integrations health",
        message: `${disabledServices} service${disabledServices === 1 ? "" : "s"} disabled · ${enabledFlags} feature flag${enabledFlags === 1 ? "" : "s"} enabled`,
        time: "live",
        read: disabledServices === 0,
        path: "/admin/system/integrations",
      },
    ],
  };
}

// ── Socket.io ───────────────────────────────────────────────────────────────

export function createAdminSocket(): Socket {
  const token = readAdminBackendAccessToken();
  const socket = io(`${SOCKET_BASE_URL}/admin`, {
    path: SOCKET_PATH,
    transports: ["websocket"],
    auth: token ? { token } : undefined,
    autoConnect: false,
    withCredentials: false,
  });
  return socket;
}

// ── Input Types ─────────────────────────────────────────────────────────────

export type AdminCreateUserInput = {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  country?: string;
  password?: string;
  invite?: boolean;
};

export type AdminUpdateUserInput = Partial<{
  fullName: string;
  email: string;
  phone: string;
  city: string;
  status: 'active' | 'deleted' | 'suspended';
  roles: string[];
}>;

export type AdminCreateDriverInput = {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  country?: string;
  password?: string;
  invite?: boolean;
  licensePlate?: string;
  model?: string;
  vehicleType: 'Bike' | 'Car';
};

export type AdminUpdateDriverInput = Partial<{
  fullName: string;
  phone: string;
  city: string;
  status: 'active' | 'deleted' | 'suspended';
  licensePlate: string;
  model: string;
  vehicleType: 'Bike' | 'Car';
}>;

export type AdminCreatePlatformUserInput = {
  email: string;
  phone?: string;
  roles: string[];
  password?: string;
  invite?: boolean;
  fullName?: string;
  city?: string;
  country?: string;
};

export async function createAdminUser(input: AdminCreatePlatformUserInput): Promise<{ userId: string }> {
  const created = await request<{
    id: string;
  }>("/admin/users", {
    method: "POST",
    body: normalizeAdminCreatePlatformUserInput(input),
  });
  return { userId: created.id };
}

export async function listAdminUsers(): Promise<AdminUserResponse[]> {
  return request<AdminUserResponse[]>("/admin/users", { method: "GET" });
}

export async function getAdminUser(userId: string): Promise<AdminUserResponse> {
  return request<AdminUserResponse>(`/admin/users/${userId}`, { method: "GET" });
}

export async function patchAdminUser(userId: string, input: AdminUpdateUserInput): Promise<AdminUserResponse> {
  return request<AdminUserResponse>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Approvals ───────────────────────────────────────────────────────────────

export type AdminApprovalResponse = {
  id: string;
  entityId: string;
  entityType: string;
  status: "pending" | "approved" | "rejected";
  requestedBy: string;
  reviewedBy: string | null;
  notes: string | null;
  createdAt: number;
  reviewedAt: number | null;
};

export type AdminReviewApprovalInput = {
  decision: "approved" | "rejected";
  notes?: string;
};

export async function listAdminApprovals(): Promise<AdminApprovalResponse[]> {
  return request<AdminApprovalResponse[]>("/admin/approvals", { method: "GET" });
}

export async function getAdminApproval(approvalId: string): Promise<AdminApprovalResponse> {
  return request<AdminApprovalResponse>(`/admin/approvals/${approvalId}`, { method: "GET" });
}

export async function reviewAdminApproval(
  approvalId: string,
  input: AdminReviewApprovalInput
): Promise<AdminApprovalResponse> {
  return request<AdminApprovalResponse>(`/admin/approvals/${approvalId}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Companies ───────────────────────────────────────────────────────────────

export type AdminCompanyResponse = {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  registrationNumber: string;
  taxId: string;
  status: "active" | "suspended" | "inactive";
  verticals: {
    ride: boolean;
    delivery: boolean;
    rental: boolean;
    school: boolean;
    ems: boolean;
    tours: boolean;
  };
  createdAt?: number;
  updatedAt?: number;
};

export type AdminUpdateCompanyInput = Partial<{
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  registrationNumber: string;
  taxId: string;
  status: "active" | "suspended" | "inactive";
  verticals: AdminCompanyResponse["verticals"];
}>;

export async function listAdminCompanies(): Promise<AdminCompanyResponse[]> {
  return request<AdminCompanyResponse[]>("/admin/companies", { method: "GET" });
}

export async function getAdminCompany(companyId: string): Promise<AdminCompanyResponse> {
  return request<AdminCompanyResponse>(`/admin/companies/${companyId}`, { method: "GET" });
}

export async function patchAdminCompany(
  companyId: string,
  input: AdminUpdateCompanyInput
): Promise<AdminCompanyResponse> {
  return request<AdminCompanyResponse>(`/admin/companies/${companyId}`, {
    method: "PATCH",
    body: input,
  });
}

// ── Centralized Pricing Management ─────────────────────────────────────────

export type VehicleCategory = {
  id: string;
  name: string;
  type: string; // "ride" | "delivery" | "rental" | "ambulance"
  description?: string;
  status: "active" | "inactive";
  createdAt?: number;
  updatedAt?: number;
};

export type RidePricing = {
  id: string;
  vehicleCategoryId: string;
  vehicleCategory: VehicleCategory;
  ratePerKm: number;
  baseFare: number;
  minimumFare: number;
  perMinuteRate: number;
  surgeMultiplier: number;
  currency: string;
  status: string;
};

export type DeliveryPricing = {
  id: string;
  vehicleCategoryId: string;
  vehicleCategory: VehicleCategory;
  ratePerKm: number;
  baseFare: number;
  minimumFare: number;
  weightSurcharge: number;
  currency: string;
  status: string;
};

export type RentalPricing = {
  id: string;
  vehicleCategoryId: string;
  vehicleCategory: VehicleCategory;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  currency: string;
  status: string;
};

export type AmbulancePricing = {
  id: string;
  ambulanceType: string; // "basic" | "advanced" | "icu"
  baseFare: number;
  ratePerKm: number;
  emergencySurcharge: number;
  nightSurcharge: number;
  currency: string;
  status: string;
};

export type FarePreview = {
  baseFare: number;
  distanceCharge: number;
  durationCharge: number;
  surcharge: number;
  subtotal: number;
  total: number;
  minimumFare: number;
  currency: string;
  formula: string;
};

// Vehicle categories
export async function listVehicleCategories(type?: string): Promise<VehicleCategory[]> {
  const qs = type ? `?type=${type}` : "";
  return request<VehicleCategory[]>(`/admin/pricing/vehicle-categories${qs}`);
}
export async function createVehicleCategory(input: Partial<VehicleCategory>): Promise<VehicleCategory> {
  return request<VehicleCategory>("/admin/pricing/vehicle-categories", { method: "POST", body: input });
}
export async function patchVehicleCategory(id: string, input: Partial<VehicleCategory>): Promise<VehicleCategory> {
  return request<VehicleCategory>(`/admin/pricing/vehicle-categories/${id}`, { method: "PATCH", body: input });
}
export async function deleteVehicleCategory(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/admin/pricing/vehicle-categories/${id}`, { method: "DELETE" });
}

// Ride pricing
export async function listRidePricing(): Promise<RidePricing[]> {
  return request<RidePricing[]>("/admin/pricing/rides");
}
export async function createRidePricing(input: Partial<RidePricing>): Promise<RidePricing> {
  return request<RidePricing>("/admin/pricing/rides", { method: "POST", body: input });
}
export async function patchRidePricing(id: string, input: Partial<RidePricing>): Promise<RidePricing> {
  return request<RidePricing>(`/admin/pricing/rides/${id}`, { method: "PATCH", body: input });
}
export async function deleteRidePricing(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/admin/pricing/rides/${id}`, { method: "DELETE" });
}

// Delivery pricing
export async function listDeliveryPricing(): Promise<DeliveryPricing[]> {
  return request<DeliveryPricing[]>("/admin/pricing/deliveries");
}
export async function createDeliveryPricing(input: Partial<DeliveryPricing>): Promise<DeliveryPricing> {
  return request<DeliveryPricing>("/admin/pricing/deliveries", { method: "POST", body: input });
}
export async function patchDeliveryPricing(id: string, input: Partial<DeliveryPricing>): Promise<DeliveryPricing> {
  return request<DeliveryPricing>(`/admin/pricing/deliveries/${id}`, { method: "PATCH", body: input });
}
export async function deleteDeliveryPricing(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/admin/pricing/deliveries/${id}`, { method: "DELETE" });
}

// Rental pricing
export async function listRentalPricing(): Promise<RentalPricing[]> {
  return request<RentalPricing[]>("/admin/pricing/rentals");
}
export async function createRentalPricing(input: Partial<RentalPricing>): Promise<RentalPricing> {
  return request<RentalPricing>("/admin/pricing/rentals", { method: "POST", body: input });
}
export async function patchRentalPricing(id: string, input: Partial<RentalPricing>): Promise<RentalPricing> {
  return request<RentalPricing>(`/admin/pricing/rentals/${id}`, { method: "PATCH", body: input });
}
export async function deleteRentalPricing(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/admin/pricing/rentals/${id}`, { method: "DELETE" });
}

// Ambulance pricing
export async function listAmbulancePricing(): Promise<AmbulancePricing[]> {
  return request<AmbulancePricing[]>("/admin/pricing/ambulances");
}
export async function createAmbulancePricing(input: Partial<AmbulancePricing>): Promise<AmbulancePricing> {
  return request<AmbulancePricing>("/admin/pricing/ambulances", { method: "POST", body: input });
}
export async function patchAmbulancePricing(id: string, input: Partial<AmbulancePricing>): Promise<AmbulancePricing> {
  return request<AmbulancePricing>(`/admin/pricing/ambulances/${id}`, { method: "PATCH", body: input });
}
export async function deleteAmbulancePricing(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/admin/pricing/ambulances/${id}`, { method: "DELETE" });
}

// Fare preview
export async function previewFare(
  serviceType: "ride" | "delivery" | "rental" | "ambulance",
  input: Record<string, unknown>
): Promise<FarePreview> {
  return request<FarePreview>(`/admin/pricing/preview/${serviceType}`, { method: "POST", body: input });
}

// Canonical /api/v1/pricing endpoints
export type PricingRule = {
  id: string;
  serviceType: string;
  vehicleType?: string;
  zoneId?: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  bookingFee: number;
  cancellationFee?: number;
  waitingPerMinute?: number;
  defaultMultiplier?: number;
  extras?: Record<string, number>;
  currency: string;
  active: boolean;
};

export type SurgeZone = {
  id: string;
  zoneId?: string;
  name: string;
  serviceType: string;
  multiplier: number;
  polygon?: Record<string, unknown>;
  active: boolean;
};

export type PromoCode = {
  id: string;
  code: string;
  serviceType?: string;
  discountType: "PERCENT" | "FIXED";
  value: number;
  maximumDiscount?: number;
  minimumSpend?: number;
  globalUsageLimit?: number;
  perUserLimit?: number;
  active: boolean;
};

export async function listPricingRules(): Promise<PricingRule[]> {
  return request<PricingRule[]>("/pricing/rules");
}
export async function createPricingRule(input: Partial<PricingRule>): Promise<PricingRule> {
  return request<PricingRule>("/pricing/rules", { method: "POST", body: input });
}
export async function patchPricingRule(id: string, input: Partial<PricingRule>): Promise<PricingRule> {
  return request<PricingRule>(`/pricing/rules/${id}`, { method: "PATCH", body: input });
}
export async function deletePricingRule(id: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/pricing/rules/${id}`, { method: "DELETE" });
}

export async function listSurgeZones(): Promise<SurgeZone[]> {
  return request<SurgeZone[]>("/pricing/surges");
}
export async function createSurgeZone(input: Partial<SurgeZone>): Promise<SurgeZone> {
  return request<SurgeZone>("/pricing/surges", { method: "POST", body: input });
}

export async function listPromoCodes(): Promise<PromoCode[]> {
  return request<PromoCode[]>("/pricing/promos");
}
export async function createPromoCode(input: Partial<PromoCode>): Promise<PromoCode> {
  return request<PromoCode>("/pricing/promos", { method: "POST", body: input });
}

// ── Delivery Workspace & Package Labels ───────────────────────────────────
// Frontend permission strings (see permissions.ts for backend mapping comments):
// view_deliveries, manage_deliveries, view_delivery_labels, print_delivery_labels,
// regenerate_delivery_labels, bulk_print_delivery_labels, activate_blank_labels.

export type AdminDeliveryLocation = {
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
};

export type AdminDeliveryPackageResponse = {
  id: string;
  deliveryId: string;
  trackingCode?: string;
  weight?: number;
  weightUnit?: string;
  dimensions?: { length?: number; width?: number; height?: number; unit?: string };
  description?: string;
  status: string;
  labelStatus?: string;
  activeLabelId?: string | null;
  activeLabelUrl?: string | null;
  activeLabelFormat?: 'pdf' | 'png' | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDeliveryLabelResponse = {
  id: string;
  packageId: string;
  version: number;
  status: 'active' | 'revoked' | 'failed' | 'draft' | string;
  format: 'pdf' | 'png' | string;
  downloadUrl?: string;
  generatedAt?: string;
  generatedBy?: string;
  revokedAt?: string;
  revokeReason?: string;
};

export type AdminDeliveryEventResponse = {
  id: string;
  deliveryId: string;
  type: string;
  status?: string;
  description?: string;
  occurredAt: string;
  actorType?: string;
  actorId?: string;
  location?: AdminDeliveryLocation;
  metadata?: Record<string, unknown>;
};

export type AdminDeliveryOrderResponse = {
  id: string;
  trackingCode?: string;
  originType?: 'merchant' | 'individual' | string;
  status: string;
  readinessStatus?: 'not_ready' | 'ready' | 'in_transit' | 'completed' | string;
  labelStatus?: 'pending' | 'generated' | 'attached' | 'exception' | string;
  merchantOrganizationId?: string;
  merchantOrganizationName?: string;
  sender?: AdminDeliveryLocation;
  recipient?: AdminDeliveryLocation;
  route?: {
    estimatedDistanceMeters?: number;
    estimatedDurationSeconds?: number;
    pickupEta?: string;
    dropoffEta?: string;
  };
  driverId?: string;
  driverName?: string;
  packages?: AdminDeliveryPackageResponse[];
  events?: AdminDeliveryEventResponse[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminDeliveryListResponse = {
  items: AdminDeliveryOrderResponse[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ListAdminDeliveriesFilters = {
  page?: number;
  limit?: number;
  originType?: string;
  status?: string;
  readinessStatus?: string;
  labelStatus?: string;
  merchantOrganizationId?: string;
  driverId?: string;
  trackingCode?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
};

export async function listAdminDeliveries(
  filters: ListAdminDeliveriesFilters = {}
): Promise<AdminDeliveryListResponse> {
  return request<AdminDeliveryListResponse>(
    `/admin/deliveries${toQueryString({
      page: filters.page,
      limit: filters.limit,
      originType: filters.originType,
      status: filters.status,
      readinessStatus: filters.readinessStatus,
      labelStatus: filters.labelStatus,
      merchantOrganizationId: filters.merchantOrganizationId,
      driverId: filters.driverId,
      trackingCode: filters.trackingCode,
      search: filters.search,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    })}`,
    { method: "GET" }
  );
}

export async function getAdminDelivery(id: string): Promise<AdminDeliveryOrderResponse> {
  return request<AdminDeliveryOrderResponse>(`/admin/deliveries/${id}`, { method: "GET" });
}

export async function getAdminDeliveryPackages(
  id: string
): Promise<{ items: AdminDeliveryPackageResponse[] }> {
  return request<{ items: AdminDeliveryPackageResponse[] }>(
    `/admin/deliveries/${id}/packages`,
    { method: "GET" }
  );
}

export async function getAdminPackageLabels(
  packageId: string
): Promise<{ items: AdminDeliveryLabelResponse[] }> {
  return request<{ items: AdminDeliveryLabelResponse[] }>(
    `/admin/delivery-packages/${packageId}/labels`,
    { method: "GET" }
  );
}

export async function downloadAdminLabelAsset(
  labelId: string,
  format: 'pdf' | 'png' = 'pdf'
): Promise<{ downloadUrl: string; mimeType: string; fileName: string }> {
  return request<{ downloadUrl: string; mimeType: string; fileName: string }>(
    `/admin/delivery-labels/${labelId}/download${toQueryString({ format })}`,
    { method: "GET" }
  );
}

export async function regenerateAdminPackageLabel(
  packageId: string,
  reason: string,
  note?: string
): Promise<AdminDeliveryLabelResponse> {
  return request<AdminDeliveryLabelResponse>(
    `/admin/delivery-packages/${packageId}/labels/regenerate`,
    {
      method: "POST",
      body: { reason, note },
    }
  );
}

export async function recordAdminLabelPrintEvent(
  labelId: string,
  source?: string
): Promise<AdminDeliveryLabelResponse> {
  return request<AdminDeliveryLabelResponse>(
    `/admin/delivery-labels/${labelId}/print-events`,
    {
      method: "POST",
      body: { source },
    }
  );
}

export async function markAdminLabelAttached(
  packageId: string,
  attachedByUserId?: string,
  location?: string
): Promise<AdminDeliveryPackageResponse> {
  return request<AdminDeliveryPackageResponse>(
    `/admin/delivery-packages/${packageId}/mark-attached`,
    {
      method: "POST",
      body: { attachedByUserId, location },
    }
  );
}

export async function bulkExportAdminLabels(
  packageIds: string[],
  reason?: string
): Promise<{ batchId: string; packageCount: number; downloadUrl?: string }> {
  return request<{ batchId: string; packageCount: number; downloadUrl?: string }>(
    "/admin/delivery-labels/bulk-export",
    {
      method: "POST",
      body: { packageIds, reason },
    }
  );
}
