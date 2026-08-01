import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  listAdminReturnRequests,
  decideAdminReturnRequest,
  listAdminReturnShipments,
  getAdminReturnShipment,
  inspectAdminReturnShipment,
  refundAdminReturnShipment,
  listAdminReturnReconciliation,
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

describe("adminApi — reverse logistics & returns (DLV-192)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists return requests with an optional status filter", async () => {
    stubFetch([{ id: "req-1", status: "REQUESTED" }]);
    const items = await listAdminReturnRequests({ status: "REQUESTED" });
    const [url] = lastCall();
    expect(url).toContain("/deliveries/returns/requests");
    expect(url).toContain("status=REQUESTED");
    expect(items).toEqual([{ id: "req-1", status: "REQUESTED" }]);
  });

  it("omits filters when not provided", async () => {
    stubFetch([]);
    await listAdminReturnRequests();
    const [url] = lastCall();
    expect(url).toContain("/deliveries/returns/requests");
    expect(url).not.toContain("status=");
    expect(url).not.toContain("orderId=");
  });

  it("POSTs an approve/reject decision to the request endpoint", async () => {
    stubFetch({ id: "req-1", status: "APPROVED" });
    await decideAdminReturnRequest("req-1", "APPROVE", "authorized");
    const [url, init] = lastCall();
    expect(url).toContain("/deliveries/returns/requests/req-1/decision");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ decision: "APPROVE", note: "authorized" });
  });

  it("lists return shipments with status/source/order filters", async () => {
    stubFetch([]);
    await listAdminReturnShipments({ status: "IN_TRANSIT", source: "CUSTOMER", orderId: "ord-1" });
    const [url] = lastCall();
    expect(url).toContain("/deliveries/returns?");
    expect(url).toContain("status=IN_TRANSIT");
    expect(url).toContain("source=CUSTOMER");
    expect(url).toContain("orderId=ord-1");
  });

  it("fetches a single return shipment by id", async () => {
    stubFetch({ id: "ship-1", returnShipmentCode: "RTN-1" });
    const shipment = await getAdminReturnShipment("ship-1");
    const [url] = lastCall();
    expect(url).toContain("/deliveries/returns/ship-1");
    expect(shipment.returnShipmentCode).toBe("RTN-1");
  });

  it("POSTs an inspection payload for restock", async () => {
    stubFetch({ id: "ship-1", status: "RESTOCKED" });
    await inspectAdminReturnShipment("ship-1", {
      condition: "ACCEPTABLE",
      disposition: "RESTOCK",
      restockTargets: [{ productVariantId: "v-1", merchantLocationId: "loc-1", quantity: 2 }],
      notes: "sellable",
    });
    const [url, init] = lastCall();
    expect(url).toContain("/deliveries/returns/ship-1/inspect");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      condition: "ACCEPTABLE",
      disposition: "RESTOCK",
      restockTargets: [{ productVariantId: "v-1", merchantLocationId: "loc-1", quantity: 2 }],
      notes: "sellable",
    });
  });

  it("POSTs a bounded refund with the supplied amount and client request id", async () => {
    stubFetch({ id: "ship-1", status: "REFUNDED", refundAmountCents: 5000 });
    await refundAdminReturnShipment("ship-1", 5000, "admin-refund-1");
    const [url, init] = lastCall();
    expect(url).toContain("/deliveries/returns/ship-1/refund");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ amountCents: 5000, clientRequestId: "admin-refund-1" });
  });

  it("fetches the return reconciliation view", async () => {
    stubFetch([{ returnShipmentId: "ship-1", refundWithinEligible: true }]);
    const rows = await listAdminReturnReconciliation();
    const [url] = lastCall();
    expect(url).toContain("/deliveries/returns/reconciliation");
    expect(rows).toHaveLength(1);
  });
});
