import { ALLOW_DEMO_API, API_BASE_URL, APP_ID, getBackendEnabled } from "./config";

interface ApiEnvelope<T> {
  code?: string;
  message?: string;
  details?: unknown;
  requestId?: string;
  data?: T;
}

type QueryValue = string | number | boolean | null | undefined;

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface HttpClientAuthAdapter {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  refresh: (refreshToken: string) => Promise<TokenRefreshResult>;
  onUnauthorized?: () => void;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, QueryValue>;
  retryOnUnauthorized?: boolean;
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

let authAdapter: HttpClientAuthAdapter | null = null;
let inFlightRefresh: Promise<TokenRefreshResult> | null = null;

const DEMO_PREFIX = "evzone_admin_demo";
const DEMO_KEYS = {
  riders: `${DEMO_PREFIX}_riders`,
  drivers: `${DEMO_PREFIX}_drivers`,
  pricingZones: `${DEMO_PREFIX}_pricing_zones`,
  services: `${DEMO_PREFIX}_services`,
  flags: `${DEMO_PREFIX}_flags`,
  promos: `${DEMO_PREFIX}_promos`,
  riskCases: `${DEMO_PREFIX}_risk_cases`,
  approvals: `${DEMO_PREFIX}_approvals`,
  companies: `${DEMO_PREFIX}_companies`,
  auditLog: `${DEMO_PREFIX}_audit_log`,
  riderServices: `${DEMO_PREFIX}_rider_services`,
};

export function configureHttpClientAuth(adapter: HttpClientAuthAdapter) {
  authAdapter = adapter;
}

function parseJson<T>(text: string): T | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function buildHeaders(options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-App-Id": APP_ID,
    ...(options.headers || {}),
  };

  if (!headers.Authorization) {
    const accessToken = authAdapter?.getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  return headers;
}

async function attemptRefresh(): Promise<TokenRefreshResult> {
  const refreshToken = authAdapter?.getRefreshToken();
  if (!authAdapter || !refreshToken) {
    throw new ApiRequestError("Session expired", 401);
  }

  if (!inFlightRefresh) {
    inFlightRefresh = authAdapter.refresh(refreshToken).finally(() => {
      inFlightRefresh = null;
    });
  }

  return inFlightRefresh;
}

function handleUnauthorized() {
  authAdapter?.clearSession();
  authAdapter?.onUnauthorized?.();
}

function buildRequestUrl(path: string, query?: Record<string, QueryValue>): string {
  if (!query) {
    return `${API_BASE_URL}${path}`;
  }

  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.set(key, String(value));
  });

  const suffix = search.toString();
  return suffix ? `${API_BASE_URL}${path}?${suffix}` : `${API_BASE_URL}${path}`;
}

function nowMs(): number {
  return Date.now();
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op
  }
}

function readOrSeed<T>(key: string, seed: () => T): T {
  const existing = readLocal<T>(key);
  if (existing !== null) return existing;
  const initial = seed();
  writeLocal(key, initial);
  return initial;
}

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function seedRiders() {
  return [
    {
      id: "RDR-001",
      userId: "RDR-001",
      riderId: "RDR-001",
      firstName: "Alice",
      lastName: "Johnson",
      fullName: "Alice Johnson",
      email: "alice.johnson@example.com",
      phone: "+256700111001",
      city: "Kampala",
      country: "Uganda",
      rating: 4.8,
      totalTrips: 143,
      status: "active",
      roles: ["rider"],
    },
    {
      id: "RDR-002",
      userId: "RDR-002",
      riderId: "RDR-002",
      firstName: "Brian",
      lastName: "Otieno",
      fullName: "Brian Otieno",
      email: "brian.otieno@example.com",
      phone: "+254700111002",
      city: "Nairobi",
      country: "Kenya",
      rating: 4.4,
      totalTrips: 68,
      status: "active",
      roles: ["rider"],
    },
    {
      id: "RDR-003",
      userId: "RDR-003",
      riderId: "RDR-003",
      firstName: "Charles",
      lastName: "Mensah",
      fullName: "Charles Mensah",
      email: "charles.mensah@example.com",
      phone: "+233700111003",
      city: "Accra",
      country: "Ghana",
      rating: 4.1,
      totalTrips: 29,
      status: "suspended",
      roles: ["rider"],
    },
  ];
}

function seedDrivers() {
  return [
    {
      driverId: "DRV-001",
      userId: "DRV-001",
      fullName: "David Kato",
      firstName: "David",
      lastName: "Kato",
      email: "david.kato@example.com",
      phone: "+256700222001",
      city: "Kampala",
      status: "active",
      vehicleType: "Car",
      totalTrips: 389,
      licensePlate: "UAX-221A",
      model: "Hyundai Kona EV",
      rating: 4.9,
      roles: ["driver"],
    },
    {
      driverId: "DRV-002",
      userId: "DRV-002",
      fullName: "Esther Njeri",
      firstName: "Esther",
      lastName: "Njeri",
      email: "esther.njeri@example.com",
      phone: "+254700222002",
      city: "Nairobi",
      status: "active",
      vehicleType: "Car",
      totalTrips: 241,
      licensePlate: "KDD-921Q",
      model: "Nissan Leaf",
      rating: 4.6,
      roles: ["driver"],
    },
    {
      driverId: "DRV-003",
      userId: "DRV-003",
      fullName: "Femi Ajayi",
      firstName: "Femi",
      lastName: "Ajayi",
      email: "femi.ajayi@example.com",
      phone: "+234700222003",
      city: "Lagos",
      status: "suspended",
      vehicleType: "Car",
      totalTrips: 101,
      licensePlate: "LAG-110X",
      model: "BYD Atto 3",
      rating: 4.0,
      roles: ["driver"],
    },
  ];
}

function seedPricingZones() {
  return [
    {
      id: "ZONE-KLA-CBD",
      name: "Kampala CBD",
      city: "Kampala",
      country: "Uganda",
      status: "active",
      boundaries: {
        type: "Polygon",
        coordinates: [[
          [32.575, 0.321],
          [32.61, 0.321],
          [32.61, 0.35],
          [32.575, 0.35],
          [32.575, 0.321],
        ]],
      },
      services: ["ride", "delivery", "rental"],
      pricingRules: {
        baseFare: 5000,
        perKm: 2000,
        perMin: 200,
        minFare: 7000,
        surgeMultiplier: 1,
      },
      createdAt: nowMs() - 86400000 * 20,
      updatedAt: nowMs() - 86400000,
    },
    {
      id: "ZONE-NBO-WEST",
      name: "Nairobi West",
      city: "Nairobi",
      country: "Kenya",
      status: "active",
      boundaries: {
        type: "Polygon",
        coordinates: [[
          [36.77, -1.31],
          [36.82, -1.31],
          [36.82, -1.26],
          [36.77, -1.26],
          [36.77, -1.31],
        ]],
      },
      services: ["ride", "delivery"],
      pricingRules: {
        baseFare: 4200,
        perKm: 1800,
        perMin: 180,
        minFare: 6200,
        surgeMultiplier: 1,
      },
      createdAt: nowMs() - 86400000 * 15,
      updatedAt: nowMs() - 86400000 * 2,
    },
    {
      id: "ZONE-LAG-ISLAND",
      name: "Lagos Island",
      city: "Lagos",
      country: "Nigeria",
      status: "inactive",
      boundaries: {
        type: "Polygon",
        coordinates: [[
          [3.37, 6.43],
          [3.45, 6.43],
          [3.45, 6.5],
          [3.37, 6.5],
          [3.37, 6.43],
        ]],
      },
      services: ["ride", "delivery", "tours"],
      pricingRules: {
        baseFare: 6000,
        perKm: 2400,
        perMin: 220,
        minFare: 8500,
        surgeMultiplier: 1.2,
      },
      createdAt: nowMs() - 86400000 * 30,
      updatedAt: nowMs() - 86400000 * 5,
    },
  ];
}

function seedServices() {
  return [
    { id: "service-ride", key: "ride", name: "Ride", enabled: true },
    { id: "service-delivery", key: "delivery", name: "Delivery", enabled: true },
    { id: "service-rental", key: "rental", name: "Rental", enabled: true },
    { id: "service-school", key: "school", name: "School Transport", enabled: false },
    { id: "service-tours", key: "tours", name: "Tours", enabled: true },
    { id: "service-ems", key: "ems", name: "Emergency", enabled: false },
  ];
}

function seedFlags() {
  return [
    {
      id: "flag-ops-live-map",
      key: "ops.live_map",
      enabled: true,
      scope: "global",
      description: "Operations live map",
    },
    {
      id: "flag-risk-auto-freeze",
      key: "risk.auto_freeze",
      enabled: false,
      scope: "global",
      description: "Risk auto-freeze rules",
    },
    {
      id: "flag-wallet-v2",
      key: "wallet.v2",
      enabled: true,
      scope: "beta",
      description: "Wallet v2 rollout",
    },
  ];
}

function seedPromos() {
  return [
    {
      id: "PROMO-001",
      code: "WELCOME20",
      description: "New rider discount",
      discountType: "percent",
      discountValue: 20,
      status: "active",
      createdAt: nowMs() - 86400000 * 4,
      updatedAt: nowMs() - 86400000,
    },
    {
      id: "PROMO-002",
      code: "WEEKEND5",
      description: "Weekend flat discount",
      discountType: "flat",
      discountValue: 5,
      status: "active",
      createdAt: nowMs() - 86400000 * 8,
      updatedAt: nowMs() - 86400000 * 3,
    },
    {
      id: "INCENTIVE-001",
      code: "DRIVER-BOOST",
      description: "Driver activity incentive",
      discountType: "flat",
      discountValue: 10,
      status: "inactive",
      createdAt: nowMs() - 86400000 * 10,
      updatedAt: nowMs() - 86400000 * 2,
    },
  ];
}

function seedRiskCases() {
  return [
    {
      id: "RISK-1001",
      subjectId: "RDR-002",
      subjectType: "Rider",
      type: "Account takeover suspicion",
      severity: "High",
      notes: "Multiple device changes in 24 hours",
      createdAt: nowMs() - 3600000 * 14,
      status: "open",
    },
    {
      id: "RISK-1002",
      subjectId: "DRV-003",
      subjectType: "Driver",
      type: "Payment abuse pattern",
      severity: "Medium",
      notes: "Repeated wallet refunds above threshold",
      createdAt: nowMs() - 3600000 * 26,
      status: "under_review",
    },
    {
      id: "RISK-1003",
      subjectId: "RDR-001",
      subjectType: "Rider",
      type: "Device spoofing alert",
      severity: "Low",
      notes: "Suspicious emulator fingerprint",
      createdAt: nowMs() - 3600000 * 48,
      status: "resolved",
    },
  ];
}

function seedApprovals() {
  return [
    {
      id: "APP-001",
      entityId: "CMP-001",
      entityType: "company",
      status: "pending",
      requestedBy: "ops-admin@evzone.app",
      reviewedBy: null,
      notes: "New fleet onboarding request",
      createdAt: nowMs() - 3600000 * 12,
      reviewedAt: null,
    },
    {
      id: "APP-002",
      entityId: "DRV-001",
      entityType: "driver",
      status: "approved",
      requestedBy: "safety-admin@evzone.app",
      reviewedBy: "super-admin@evzone.app",
      notes: "Document review completed",
      createdAt: nowMs() - 3600000 * 70,
      reviewedAt: nowMs() - 3600000 * 60,
    },
    {
      id: "APP-003",
      entityId: "CMP-002",
      entityType: "company",
      status: "rejected",
      requestedBy: "ops-admin@evzone.app",
      reviewedBy: "super-admin@evzone.app",
      notes: "Missing tax documentation",
      createdAt: nowMs() - 3600000 * 120,
      reviewedAt: nowMs() - 3600000 * 96,
    },
  ];
}

function seedCompanies() {
  return [
    {
      id: "CMP-001",
      companyName: "GreenMove Fleet",
      contactEmail: "ops@greenmove.example",
      contactPhone: "+256700333001",
      registrationNumber: "UG-REG-1001",
      taxId: "UG-TAX-88201",
      status: "active",
      verticals: { ride: true, delivery: true, rental: true, school: false, ems: false, tours: true },
      createdAt: nowMs() - 86400000 * 100,
      updatedAt: nowMs() - 86400000 * 3,
    },
    {
      id: "CMP-002",
      companyName: "SwiftHaul Logistics",
      contactEmail: "admin@swifthaul.example",
      contactPhone: "+254700333002",
      registrationNumber: "KE-REG-2044",
      taxId: "KE-TAX-14320",
      status: "suspended",
      verticals: { ride: false, delivery: true, rental: false, school: false, ems: false, tours: false },
      createdAt: nowMs() - 86400000 * 80,
      updatedAt: nowMs() - 86400000 * 8,
    },
    {
      id: "CMP-003",
      companyName: "CityRide Cooperative",
      contactEmail: "support@cityride.example",
      contactPhone: "+234700333003",
      registrationNumber: "NG-REG-8899",
      taxId: "NG-TAX-22409",
      status: "inactive",
      verticals: { ride: true, delivery: false, rental: false, school: true, ems: false, tours: false },
      createdAt: nowMs() - 86400000 * 55,
      updatedAt: nowMs() - 86400000 * 12,
    },
  ];
}

function seedAuditLog() {
  return [
    {
      id: "AUD-001",
      actorId: "super-admin@evzone.app",
      action: "approval.reviewed",
      resource: "approval",
      resourceId: "APP-002",
      createdAt: nowMs() - 3600000 * 24,
      metadata: { decision: "approved" },
    },
    {
      id: "AUD-002",
      actorId: "ops-admin@evzone.app",
      action: "company.updated",
      resource: "company",
      resourceId: "CMP-001",
      createdAt: nowMs() - 3600000 * 20,
      metadata: { field: "status", value: "active" },
    },
  ];
}

function seedRiderServices() {
  return [
    {
      id: "RS-001",
      riderId: "RDR-001",
      driverId: "DRV-001",
      serviceType: "rental",
      status: "active",
      payload: { vehicle: "Bike", durationHours: 4 },
      createdAt: nowMs() - 3600000 * 4,
      updatedAt: nowMs() - 3600000 * 2,
    },
  ];
}

function getCollection(key: string, seed: () => any[]): any[] {
  return readOrSeed<any[]>(key, seed);
}

function saveCollection(key: string, value: any[]): void {
  writeLocal(key, value);
}

function findByAnyId<T extends Record<string, unknown>>(items: T[], id: string, keys: string[]): T | undefined {
  const normalized = id.toLowerCase();
  return items.find((item) =>
    keys.some((key) => String(item[key] ?? "").toLowerCase() === normalized)
  );
}

function ensureRecord<T>(value: unknown): Partial<T> {
  return (value && typeof value === "object" ? (value as Partial<T>) : {}) as Partial<T>;
}

function mockAnalyticsMultiplier(period: string): number {
  if (period === "day") return 0.2;
  if (period === "week") return 1;
  if (period === "year") return 12;
  return 4;
}

async function handleDemoRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const method = options.method || "GET";
  const [pathname, query = ""] = path.split("?");
  const body = ensureRecord<Record<string, unknown>>(options.body);

  if (pathname === "/auth/login" && method === "POST") {
    const email = String(body.email || "demo@evzone.app");
    return {
      accessToken: `demo-access-${nowMs()}`,
      refreshToken: `demo-refresh-${nowMs()}`,
      expiresInSeconds: 3600,
      user: { id: "demo-user", email, roles: ["super_admin"] },
    } as T;
  }

  if (pathname === "/auth/refresh" && method === "POST") {
    return {
      accessToken: `demo-access-${nowMs()}`,
      refreshToken: `demo-refresh-${nowMs()}`,
    } as T;
  }

  if (pathname === "/auth/forgot-password" && method === "POST") {
    return { sent: true } as T;
  }

  if (pathname === "/admin/riders" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.riders, seedRiders)) as T;
  }

  if (pathname === "/admin/riders" && method === "POST") {
    const riders = getCollection(DEMO_KEYS.riders, seedRiders);
    const riderId = makeId("RDR");
    riders.unshift({
      id: riderId,
      userId: riderId,
      riderId,
      fullName: String(body.fullName || "New Rider"),
      email: String(body.email || `${riderId.toLowerCase()}@example.com`),
      phone: String(body.phone || ""),
      city: String(body.city || "Kampala"),
      status: "active",
      roles: ["rider"],
      totalTrips: 0,
      rating: 5,
      createdAt: nowMs(),
    });
    saveCollection(DEMO_KEYS.riders, riders);
    return { userId: riderId } as T;
  }

  if (pathname.startsWith("/admin/riders/") && method === "GET") {
    const id = pathname.split("/").pop() || "";
    const riders = getCollection(DEMO_KEYS.riders, seedRiders);
    const rider = findByAnyId(riders, id, ["id", "userId", "riderId"]);
    if (!rider) throw new ApiRequestError("Rider not found", 404);
    return deepClone(rider) as T;
  }

  if (pathname.startsWith("/admin/riders/") && method === "PATCH") {
    const id = pathname.split("/").pop() || "";
    const riders = getCollection(DEMO_KEYS.riders, seedRiders);
    const index = riders.findIndex((item) =>
      [item.id, item.userId, item.riderId].map((v: string) => String(v).toLowerCase()).includes(id.toLowerCase())
    );
    if (index < 0) throw new ApiRequestError("Rider not found", 404);
    riders[index] = { ...riders[index], ...body };
    saveCollection(DEMO_KEYS.riders, riders);
    return deepClone(riders[index]) as T;
  }

  if (pathname === "/admin/drivers" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.drivers, seedDrivers)) as T;
  }

  if (pathname === "/admin/drivers" && method === "POST") {
    const drivers = getCollection(DEMO_KEYS.drivers, seedDrivers);
    const driverId = makeId("DRV");
    drivers.unshift({
      driverId,
      userId: driverId,
      fullName: String(body.fullName || "New Driver"),
      email: String(body.email || `${driverId.toLowerCase()}@example.com`),
      phone: String(body.phone || ""),
      city: String(body.city || "Kampala"),
      status: "active",
      vehicleType: String(body.vehicleType || "Car"),
      totalTrips: 0,
      rating: 5,
      createdAt: nowMs(),
    });
    saveCollection(DEMO_KEYS.drivers, drivers);
    return { driverId } as T;
  }

  if (pathname.startsWith("/admin/drivers/") && method === "GET") {
    const id = pathname.split("/").pop() || "";
    const drivers = getCollection(DEMO_KEYS.drivers, seedDrivers);
    const driver = findByAnyId(drivers, id, ["driverId", "userId"]);
    if (!driver) throw new ApiRequestError("Driver not found", 404);
    return deepClone(driver) as T;
  }

  if (pathname.startsWith("/admin/drivers/") && method === "PATCH") {
    const id = pathname.split("/").pop() || "";
    const drivers = getCollection(DEMO_KEYS.drivers, seedDrivers);
    const index = drivers.findIndex((item) =>
      [item.driverId, item.userId].map((v: string) => String(v).toLowerCase()).includes(id.toLowerCase())
    );
    if (index < 0) throw new ApiRequestError("Driver not found", 404);
    drivers[index] = { ...drivers[index], ...body };
    saveCollection(DEMO_KEYS.drivers, drivers);
    return deepClone(drivers[index]) as T;
  }

  if (pathname === "/admin/pricing-zones" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.pricingZones, seedPricingZones)) as T;
  }

  if (pathname === "/admin/pricing-zones" && method === "POST") {
    const zones = getCollection(DEMO_KEYS.pricingZones, seedPricingZones);
    const zoneId = makeId("ZONE");
    zones.unshift({
      id: zoneId,
      name: String(body.name || "New Zone"),
      city: String(body.city || ""),
      country: String(body.country || ""),
      status: String(body.status || "active"),
      boundaries: body.boundaries || {
        type: "Polygon",
        coordinates: [[
          [32.57, 0.32],
          [32.59, 0.32],
          [32.59, 0.34],
          [32.57, 0.34],
          [32.57, 0.32],
        ]],
      },
      services: body.services || [],
      pricingRules: body.pricingRules || {},
      createdAt: nowMs(),
      updatedAt: nowMs(),
    });
    saveCollection(DEMO_KEYS.pricingZones, zones);
    return { zoneId } as T;
  }

  if (pathname.startsWith("/admin/pricing-zones/") && method === "GET") {
    const id = pathname.split("/").pop() || "";
    const zones = getCollection(DEMO_KEYS.pricingZones, seedPricingZones);
    const zone = findByAnyId(zones, id, ["id"]);
    if (!zone) throw new ApiRequestError("Zone not found", 404);
    return deepClone(zone) as T;
  }

  if (pathname.startsWith("/admin/pricing-zones/") && method === "PATCH") {
    const id = pathname.split("/").pop() || "";
    const zones = getCollection(DEMO_KEYS.pricingZones, seedPricingZones);
    const index = zones.findIndex((item) => String(item.id).toLowerCase() === id.toLowerCase());
    if (index < 0) throw new ApiRequestError("Zone not found", 404);
    zones[index] = { ...zones[index], ...body, updatedAt: nowMs() };
    saveCollection(DEMO_KEYS.pricingZones, zones);
    return deepClone(zones[index]) as T;
  }

  if (pathname === "/admin/services" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.services, seedServices)) as T;
  }

  if (pathname.startsWith("/admin/services/") && method === "PATCH") {
    const id = pathname.split("/").pop() || "";
    const services = getCollection(DEMO_KEYS.services, seedServices);
    const index = services.findIndex((item) => String(item.id).toLowerCase() === id.toLowerCase());
    if (index < 0) throw new ApiRequestError("Service not found", 404);
    services[index] = { ...services[index], ...body, updatedAt: nowMs() };
    saveCollection(DEMO_KEYS.services, services);
    return deepClone(services[index]) as T;
  }

  if (pathname === "/admin/system/flags" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.flags, seedFlags)) as T;
  }

  if (pathname.startsWith("/admin/system/flags/") && method === "PATCH") {
    const key = decodeURIComponent(pathname.split("/").pop() || "");
    const flags = getCollection(DEMO_KEYS.flags, seedFlags);
    const index = flags.findIndex((item) =>
      [item.id, item.key].map((v: string) => String(v).toLowerCase()).includes(key.toLowerCase())
    );
    if (index < 0) throw new ApiRequestError("Feature flag not found", 404);
    flags[index] = { ...flags[index], ...body, updatedAt: nowMs() };
    saveCollection(DEMO_KEYS.flags, flags);
    return deepClone(flags[index]) as T;
  }

  if (pathname === "/admin/analytics/finance" && method === "GET") {
    const params = new URLSearchParams(query);
    const period = params.get("period") || "week";
    const m = mockAnalyticsMultiplier(period);
    return {
      grossEarnings: Math.round(820000 * m),
      earningsCount: Math.round(211000 * m),
      payoutsPending: Math.round(124000 * m),
      currency: "USD",
    } as T;
  }

  if (pathname === "/admin/analytics/operations" && method === "GET") {
    const params = new URLSearchParams(query);
    const period = params.get("period") || "week";
    const m = mockAnalyticsMultiplier(period);
    return {
      trips: {
        total: Math.round(5400 * m),
        completed: Math.round(4920 * m),
        active: Math.round(110 * m),
      },
      dispatches: {
        total: Math.round(1730 * m),
        pending: Math.round(72 * m),
      },
      drivers: {
        online: Math.max(12, Math.round(280 * (m / 4))),
        total: 640,
      },
    } as T;
  }

  if (pathname === "/admin/promos" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.promos, seedPromos)) as T;
  }

  if (pathname === "/admin/promos" && method === "POST") {
    const promos = getCollection(DEMO_KEYS.promos, seedPromos);
    const isIncentive = String(body.code || "").toUpperCase().startsWith("INC");
    const promoId = makeId(isIncentive ? "INCENTIVE" : "PROMO");
    promos.unshift({
      id: promoId,
      code: String(body.code || promoId),
      description: String(body.description || ""),
      discountType: String(body.discountType || "percent"),
      discountValue: Number(body.discountValue || 0),
      status: "active",
      createdAt: nowMs(),
      updatedAt: nowMs(),
    });
    saveCollection(DEMO_KEYS.promos, promos);
    return { promoId } as T;
  }

  if (pathname.startsWith("/admin/promos/") && method === "PATCH") {
    const id = pathname.split("/").pop() || "";
    const promos = getCollection(DEMO_KEYS.promos, seedPromos);
    const index = promos.findIndex((item) => String(item.id).toLowerCase() === id.toLowerCase());
    if (index < 0) throw new ApiRequestError("Promotion not found", 404);
    promos[index] = { ...promos[index], ...body, updatedAt: nowMs() };
    saveCollection(DEMO_KEYS.promos, promos);
    return deepClone(promos[index]) as T;
  }

  if (pathname === "/admin/risk/cases" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.riskCases, seedRiskCases)) as T;
  }

  if (pathname.startsWith("/admin/risk/cases/") && method === "GET") {
    const id = pathname.split("/").pop() || "";
    const riskCases = getCollection(DEMO_KEYS.riskCases, seedRiskCases);
    const item = findByAnyId(riskCases, id, ["id"]);
    if (!item) throw new ApiRequestError("Risk case not found", 404);
    return deepClone(item) as T;
  }

  if (pathname === "/admin/rider-services" && method === "GET") {
    const params = new URLSearchParams(query);
    const serviceType = params.get("serviceType");
    const riderId = params.get("riderId");
    const status = params.get("status");
    const services = getCollection(DEMO_KEYS.riderServices, seedRiderServices).filter((item) => {
      if (serviceType && item.serviceType !== serviceType) return false;
      if (riderId && item.riderId !== riderId) return false;
      if (status && item.status !== status) return false;
      return true;
    });
    return deepClone(services) as T;
  }

  if (pathname.startsWith("/admin/rider-services/") && method === "GET") {
    const id = pathname.split("/").pop() || "";
    const services = getCollection(DEMO_KEYS.riderServices, seedRiderServices);
    const item = findByAnyId(services, id, ["id"]);
    if (!item) throw new ApiRequestError("Rider service not found", 404);
    return deepClone(item) as T;
  }

  if (pathname === "/admin/system/audit-log" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.auditLog, seedAuditLog)) as T;
  }

  if (pathname === "/admin/approvals" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.approvals, seedApprovals)) as T;
  }

  if (pathname.startsWith("/admin/approvals/") && method === "GET") {
    const id = pathname.split("/").pop() || "";
    const approvals = getCollection(DEMO_KEYS.approvals, seedApprovals);
    const item = findByAnyId(approvals, id, ["id"]);
    if (!item) throw new ApiRequestError("Approval not found", 404);
    return deepClone(item) as T;
  }

  if (pathname.startsWith("/admin/approvals/") && method === "PATCH") {
    const id = pathname.split("/").pop() || "";
    const approvals = getCollection(DEMO_KEYS.approvals, seedApprovals);
    const index = approvals.findIndex((item) => String(item.id).toLowerCase() === id.toLowerCase());
    if (index < 0) throw new ApiRequestError("Approval not found", 404);
    const decision = String(body.decision || "").toLowerCase();
    approvals[index] = {
      ...approvals[index],
      status: decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : approvals[index].status,
      reviewedBy: "demo-admin@evzone.app",
      reviewedAt: nowMs(),
      notes: typeof body.notes === "string" ? body.notes : approvals[index].notes,
    };
    saveCollection(DEMO_KEYS.approvals, approvals);
    return deepClone(approvals[index]) as T;
  }

  if (pathname === "/admin/companies" && method === "GET") {
    return deepClone(getCollection(DEMO_KEYS.companies, seedCompanies)) as T;
  }

  if (pathname.startsWith("/admin/companies/") && method === "GET") {
    const id = pathname.split("/").pop() || "";
    const companies = getCollection(DEMO_KEYS.companies, seedCompanies);
    const item = findByAnyId(companies, id, ["id"]);
    if (!item) throw new ApiRequestError("Company not found", 404);
    return deepClone(item) as T;
  }

  if (pathname.startsWith("/admin/companies/") && method === "PATCH") {
    const id = pathname.split("/").pop() || "";
    const companies = getCollection(DEMO_KEYS.companies, seedCompanies);
    const index = companies.findIndex((item) => String(item.id).toLowerCase() === id.toLowerCase());
    if (index < 0) throw new ApiRequestError("Company not found", 404);
    companies[index] = { ...companies[index], ...body, updatedAt: nowMs() };
    saveCollection(DEMO_KEYS.companies, companies);
    return deepClone(companies[index]) as T;
  }

  throw new ApiRequestError(`No demo handler for ${method} ${pathname}`, 404);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!getBackendEnabled()) {
    if (ALLOW_DEMO_API) {
      return handleDemoRequest<T>(path, options);
    }
    throw new ApiRequestError("Admin backend is disabled. Set VITE_USE_BACKEND=true.", 503);
  }

  const response = await fetch(buildRequestUrl(path, options.query), {
    method: options.method || "GET",
    headers: buildHeaders(options),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && options.retryOnUnauthorized !== false && authAdapter) {
    try {
      const refreshed = await attemptRefresh();
      authAdapter.setTokens(refreshed.accessToken, refreshed.refreshToken);
      return request<T>(path, {
        ...options,
        retryOnUnauthorized: false,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${refreshed.accessToken}`,
        },
      });
    } catch {
      handleUnauthorized();
    }
  }

  const raw = await response.text();
  const parsed = parseJson<ApiEnvelope<T>>(raw);

  if (!response.ok) {
    const message = parsed?.message || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, response.status, parsed?.details);
  }

  if (parsed && "data" in parsed && parsed.data !== undefined) {
    return parsed.data;
  }

  if (parsed !== null) {
    return parsed as unknown as T;
  }

  throw new ApiRequestError("Empty response from server", response.status);
}
