import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  adminForceDeliveryStatus,
  adminReassignDelivery,
  adminCancelDelivery,
  adminCancelRide,
  adminReassignRide,
} from "./adminApi";

const okResponse = {
  ok: true,
  status: 200,
  text: () => Promise.resolve(JSON.stringify({ data: { id: "x", status: "ok" } })),
} as unknown as Response;

describe("admin control command bodies are single-encoded JSON objects", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const parsedBodyOf = () => {
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<
      [string, RequestInit]
    >;
    expect(calls.length).toBe(1);
    const [, init] = calls[0];
    expect(typeof init.body).toBe("string");
    const parsed = JSON.parse(init.body as string);
    // A double-encoded body would parse to a string, not an object.
    expect(typeof parsed).toBe("object");
    return parsed;
  };

  it("adminForceDeliveryStatus sends {status, reason} as a plain JSON object", async () => {
    await adminForceDeliveryStatus("order-1", "ASSIGNED", "ops override");
    expect(parsedBodyOf()).toEqual({ status: "ASSIGNED", reason: "ops override" });
  });

  it("adminReassignDelivery sends {newDriverId, reason} as a plain JSON object", async () => {
    await adminReassignDelivery("order-1", "driver-9", "closer");
    expect(parsedBodyOf()).toEqual({ newDriverId: "driver-9", reason: "closer" });
  });

  it("adminCancelDelivery sends {status, reason} as a plain JSON object", async () => {
    await adminCancelDelivery("order-1", "no stock");
    expect(parsedBodyOf()).toEqual({ status: "CANCELLED", reason: "no stock" });
  });

  it("adminCancelRide sends {reason} as a plain JSON object", async () => {
    await adminCancelRide("ride-1", "driver unavailable");
    expect(parsedBodyOf()).toEqual({ reason: "driver unavailable" });
  });

  it("adminReassignRide sends {newDriverId, reason} as a plain JSON object", async () => {
    await adminReassignRide("ride-1", "driver-4", "cover shift");
    expect(parsedBodyOf()).toEqual({ newDriverId: "driver-4", reason: "cover shift" });
  });
});