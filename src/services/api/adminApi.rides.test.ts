import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminCancelRide,
  adminReassignRide,
  getAdminRide,
  getAdminRideAnomalies,
  getAdminRidePayments,
  listAdminRideCommunications,
  listAdminRideIncidents,
  listAdminRides,
} from "./adminApi";

const okResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({ data })),
  }) as unknown as Response;

const lastCall = () => {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1];
};

describe("admin rides API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ items: [], meta: { total: 0 } })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes ride list filters to the backend", async () => {
    await listAdminRides({
      page: 2,
      limit: 50,
      status: "IN_PROGRESS",
      tripType: "MULTI_STOP",
      paymentStatus: "PAID",
      riderId: "rider-1",
      driverId: "driver-1",
      search: "Kampala",
      fromDate: "2026-09-01T00:00:00.000Z",
      toDate: "2026-09-17T23:59:59.999Z",
    });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/rides");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=50");
    expect(url).toContain("status=IN_PROGRESS");
    expect(url).toContain("tripType=MULTI_STOP");
    expect(url).toContain("paymentStatus=PAID");
    expect(url).toContain("riderId=rider-1");
    expect(url).toContain("driverId=driver-1");
    expect(url).toContain("search=Kampala");
    expect(url).toContain(`fromDate=${encodeURIComponent("2026-09-01T00:00:00.000Z")}`);
    expect(url).toContain(`toDate=${encodeURIComponent("2026-09-17T23:59:59.999Z")}`);
    expect(init.method).toBe("GET");
  });

  it("normalizes the backend paginated envelope into ride list items", async () => {
    const ride = {
      id: "ride-1",
      status: "COMPLETED",
      mode: "ON_DEMAND",
      category: "STANDARD",
      tripType: "ONE_WAY",
      riderId: "rider-1",
      passengerCount: 1,
      estimatedFare: 12000,
      currency: "UGX",
      paymentStatus: "PAID",
      createdAt: "2026-09-18T08:00:00.000Z",
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            success: true,
            data: [ride],
            meta: { page: 3, limit: 1, total: 7, totalPages: 7, hasNext: true, hasPrevious: true },
          }),
        ),
    } as unknown as Response);

    const response = await listAdminRides({ page: 3, limit: 1 });

    expect(response.items).toEqual([ride]);
    expect(response.meta.total).toBe(7);
  });

  it("loads ride detail, payments, communications, incidents, and anomalies", async () => {
    await getAdminRide("ride-1");
    let [url, init] = lastCall();
    expect(url).toContain("/admin/rides/ride-1");
    expect(init.method).toBe("GET");

    await getAdminRidePayments("ride-1");
    [url, init] = lastCall();
    expect(url).toContain("/admin/rides/ride-1/payments");
    expect(init.method).toBe("GET");

    await listAdminRideCommunications("ride-1");
    [url, init] = lastCall();
    expect(url).toContain("/admin/rides/ride-1/communications");
    expect(init.method).toBe("GET");

    await listAdminRideIncidents("ride-1");
    [url, init] = lastCall();
    expect(url).toContain("/admin/rides/ride-1/incidents");
    expect(init.method).toBe("GET");

    await getAdminRideAnomalies("distance", 25);
    [url, init] = lastCall();
    expect(url).toContain("/admin/rides/anomalies");
    expect(url).toContain("flag=distance");
    expect(url).toContain("limit=25");
    expect(init.method).toBe("GET");
  });

  it("sends admin ride control mutations", async () => {
    await adminCancelRide("ride-1", "Unsafe route");
    let [url, init] = lastCall();
    expect(url).toContain("/admin/rides/ride-1/cancel");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ reason: "Unsafe route" });

    await adminReassignRide("ride-1", "driver-2", "Driver unavailable");
    [url, init] = lastCall();
    expect(url).toContain("/admin/rides/ride-1/reassign");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      newDriverId: "driver-2",
      reason: "Driver unavailable",
    });
  });
});
