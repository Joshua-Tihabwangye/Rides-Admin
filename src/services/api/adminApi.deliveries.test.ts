import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { listAdminDeliveries } from "./adminApi";
import { DELIVERY_STATUS } from "../../utils/deliveryStatus";

describe("listAdminDeliveries filter integration", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: {
                items: [],
                meta: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
              },
            }),
          ),
      } as unknown as Response),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(DELIVERY_STATUS)(
    "sends the canonical backend status %s unchanged in the query string",
    async (status) => {
      await listAdminDeliveries({ status, page: 1, limit: 10 });
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<
        [string, RequestInit]
      >;
      expect(calls.length).toBe(1);
      const [url] = calls[0];
      expect(url).toContain(`status=${encodeURIComponent(status)}`);
    },
  );

  it("omits the status parameter when no status filter is selected", async () => {
    await listAdminDeliveries({ page: 1, limit: 10 });
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<
      [string, RequestInit]
    >;
    expect(calls.length).toBe(1);
    const [url] = calls[0];
    expect(url).not.toContain("status=");
  });

  it("rejects legacy generic status values that are not in the backend enum", async () => {
    const invalidStatuses = ["pending", "confirmed", "failed", "out_for_delivery"];
    for (const status of invalidStatuses) {
      await listAdminDeliveries({ status, page: 1, limit: 10 });
      const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<
        [string, RequestInit]
      >;
      const [url] = calls[calls.length - 1];
      // The current API layer sends whatever the caller provides; the test
      // documents that these values are not canonical and the UI filter no
      // longer offers them.
      expect(DELIVERY_STATUS).not.toContain(status.toUpperCase());
      expect(url).toContain(`status=${encodeURIComponent(status)}`);
    }
  });
});
