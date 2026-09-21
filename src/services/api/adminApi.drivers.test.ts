import { afterEach, describe, expect, it, vi } from "vitest";
import type * as AdminApi from "./adminApi";
import { normalizePaginatedDriver } from "./adminApi";

const okResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({ data })),
  }) as unknown as Response;

const fetchCalls = () =>
  (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;

// The httpClient short-TTL GET cache persists for 10s across tests on the same
// URL, so network tests load a fresh module copy to guarantee a real fetch.
const loadApi = async () => {
  vi.resetModules();
  return (await import("./adminApi")) as typeof AdminApi;
};

// Mirrors the backend `AdminService.listDrivers` raw shape: DriverProfile
// fields at top level (id/userId/availabilityStatus/rating/completedRides)
// plus a nested joined `user`. There is no flattened driverId/fullName etc.
// in this raw response.
const rawRow = (idx: number) => ({
  id: `profile-${idx}`,
  userId: `user-${idx}`,
  availabilityStatus: "available",
  rating: 4.7,
  completedRides: 10,
  completedDeliveries: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  user: {
    id: `user-${idx}`,
    firstName: `F${idx}`,
    lastName: `L${idx}`,
    email: `driver${idx}@example.com`,
    phone: `+2567000000${idx}`,
    city: "Kampala",
    roles: ["driver"],
    status: "active",
  },
});

describe("admin driver listing helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("listAdminDriversPaginated requests page/limit against /admin/drivers", async () => {
    const api = await loadApi();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ items: [], meta: { total: 0 } })));
    await api.listAdminDriversPaginated(3, 50);

    const [url, init] = fetchCalls().at(-1)!;
    expect(url).toContain("/admin/drivers");
    expect(url).toContain("page=3");
    expect(url).toContain("limit=50");
    expect(init.method).toBe("GET");
  });

  it("listAllAdminDrivers walks every page until hasNext is false", async () => {
    const api = await loadApi();
    const page1: AdminApi.AdminDriverListResponse = {
      items: [rawRow(1), rawRow(2)],
      meta: { page: 1, limit: 2, total: 3, totalPages: 2, hasNext: true, hasPrevious: false },
    };
    const page2: AdminApi.AdminDriverListResponse = {
      items: [rawRow(3)],
      meta: { page: 2, limit: 2, total: 3, totalPages: 2, hasNext: false, hasPrevious: true },
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(okResponse(page1))
        .mockResolvedValueOnce(okResponse(page2)),
    );

    const drivers = await api.listAllAdminDrivers(2, 200);

    expect(fetchCalls()).toHaveLength(2);
    expect(drivers).toHaveLength(3);
    expect(drivers.map((d) => d.fullName)).toEqual(["F1 L1", "F2 L2", "F3 L3"]);
    // The normalized driverId matches the backend mapped `mapDriver` shape (profile id).
    expect(drivers.map((d) => d.driverId)).toEqual(["profile-1", "profile-2", "profile-3"]);
    expect(drivers.map((d) => d.totalTrips)).toEqual([12, 12, 12]);
  });

  it("listAllAdminDrivers falls back to the plain endpoint when pagination fails", async () => {
    const api = await loadApi();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new Error("pagination unavailable"))
        .mockResolvedValueOnce(
          okResponse([
            {
              driverId: "driver-x",
              userId: "user-x",
              fullName: "Fallen Back Driver",
              email: "x@example.com",
              status: "active",
            },
          ]),
        ),
    );

    const drivers = await api.listAllAdminDrivers();

    // Paginated call happened first, then the plain endpoint without query params.
    const calls = fetchCalls();
    expect(calls).toHaveLength(2);
    const plainUrl = calls[1][0] as string;
    expect(plainUrl).toContain("/admin/drivers");
    expect(plainUrl).not.toContain("page=");
    expect(calls[1][1].method).toBe("GET");
    expect(drivers).toHaveLength(1);
    expect(drivers[0].fullName).toBe("Fallen Back Driver");
  });

  it("listAdminDrivers hits the plain endpoint and returns the mapped array", async () => {
    const api = await loadApi();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okResponse([
          {
            driverId: "driver-y",
            userId: "user-y",
            fullName: "Plain Driver",
            email: "y@example.com",
            status: "active",
          },
        ]),
      ),
    );

    const drivers = await api.listAdminDrivers();
    const [url, init] = fetchCalls().at(-1)!;
    expect(url).toContain("/admin/drivers");
    expect(url).not.toContain("page=");
    expect(init.method).toBe("GET");
    expect(drivers).toHaveLength(1);
    expect(drivers[0].driverId).toBe("driver-y");
  });

  it("normalizePaginatedDriver merges the nested user row into the mapped shape", () => {
    const normalized = normalizePaginatedDriver(rawRow(5));

    expect(normalized).toMatchObject({
      driverId: "profile-5",
      userId: "user-5",
      fullName: "F5 L5",
      email: "driver5@example.com",
      phone: "+25670000005",
      city: "Kampala",
      status: "active",
      availabilityStatus: "available",
      vehicleType: "Car",
      totalTrips: 12,
      rating: 4.7,
      roles: ["driver"],
    });
  });

  it("normalizePaginatedDriver resolves status/phone/city from the nested user when absent", () => {
    const normalized = normalizePaginatedDriver({
      ...rawRow(1),
      status: undefined,
      user: { ...rawRow(1).user, status: "suspended" },
    });
    expect(normalized.status).toBe("suspended");
    expect(normalized.driverId).toBe("profile-1");
    expect(normalized.userId).toBe("user-1");
  });

  it("normalizePaginatedDriver leaves totalTrips undefined when ride counts are unknown", () => {
    const normalized = normalizePaginatedDriver({
      id: "profile-9",
      userId: "user-9",
      user: { id: "user-9", firstName: "N", lastName: "O" },
    });
    expect(normalized.driverId).toBe("profile-9");
    expect(normalized.userId).toBe("user-9");
    expect(normalized.totalTrips).toBeUndefined();
    expect(normalized.fullName).toBe("N O");
  });
});