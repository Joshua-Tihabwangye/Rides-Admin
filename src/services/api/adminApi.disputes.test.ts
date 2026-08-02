import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  listAdminDisputes,
  getAdminDispute,
  markAdminDisputeUnderReview,
  decideAdminDispute,
  withdrawAdminDispute,
} from "./adminApi";

function stubFetch(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ data: body })),
    } as unknown as Response),
  );
}

function lastCall() {
  const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;
  return calls[calls.length - 1];
}

describe("adminApi — delivery disputes (DLV-193)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists disputes with optional status/reason/order filters", async () => {
    stubFetch([{ id: "disp-1", status: "OPEN", orderId: "ord-1" }]);
    const items = await listAdminDisputes({ status: "OPEN", reason: "DAMAGED", orderId: "ord-1" });
    const [url] = lastCall();
    expect(url).toContain("/deliveries/disputes");
    expect(url).toContain("status=OPEN");
    expect(url).toContain("reason=DAMAGED");
    expect(url).toContain("orderId=ord-1");
    expect(items).toEqual([{ id: "disp-1", status: "OPEN", orderId: "ord-1" }]);
  });

  it("omits filters when not provided", async () => {
    stubFetch([]);
    await listAdminDisputes();
    const [url] = lastCall();
    expect(url).toContain("/deliveries/disputes");
    expect(url).not.toContain("status=");
    expect(url).not.toContain("reason=");
  });

  it("fetches a single dispute by id", async () => {
    stubFetch({ id: "disp-1", orderId: "ord-1", status: "UNDER_REVIEW" });
    const dispute = await getAdminDispute("disp-1");
    const [url] = lastCall();
    expect(url).toContain("/deliveries/disputes/disp-1");
    expect(dispute.status).toBe("UNDER_REVIEW");
  });

  it("POSTs a review action to move a dispute under review", async () => {
    stubFetch({ id: "disp-1", status: "UNDER_REVIEW" });
    await markAdminDisputeUnderReview("disp-1");
    const [url, init] = lastCall();
    expect(url).toContain("/deliveries/disputes/disp-1/review");
    expect(init.method).toBe("POST");
  });

  it("POSTs a bounded refund decision with amount and client request id", async () => {
    stubFetch({ id: "disp-1", status: "RESOLVED", resolution: "PARTIAL_REFUND", refundAmountCents: 5000 });
    await decideAdminDispute("disp-1", {
      resolution: "PARTIAL_REFUND",
      amountCents: 5000,
      note: "partial refund",
      clientRequestId: "admin-refund-1",
    });
    const [url, init] = lastCall();
    expect(url).toContain("/deliveries/disputes/disp-1/decision");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      resolution: "PARTIAL_REFUND",
      amountCents: 5000,
      note: "partial refund",
      clientRequestId: "admin-refund-1",
    });
  });

  it("POSTs a no-remedy decision without an amount", async () => {
    stubFetch({ id: "disp-1", status: "REJECTED", resolution: "NO_REMEDY" });
    await decideAdminDispute("disp-1", { resolution: "NO_REMEDY", note: "unverified claim" });
    const [url, init] = lastCall();
    expect(url).toContain("/deliveries/disputes/disp-1/decision");
    expect(JSON.parse(init.body as string)).toEqual({
      resolution: "NO_REMEDY",
      note: "unverified claim",
    });
  });

  it("POSTs a withdraw action for a dispute", async () => {
    stubFetch({ id: "disp-1", status: "WITHDRAWN" });
    await withdrawAdminDispute("disp-1");
    const [url, init] = lastCall();
    expect(url).toContain("/deliveries/disputes/disp-1/withdraw");
    expect(init.method).toBe("POST");
  });
});
