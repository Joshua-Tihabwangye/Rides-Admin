import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelAdminSettlement,
  createAdminSettlement,
  createAdminWalletReconciliation,
  getAdminRevenueSummary,
  listAdminCashouts,
  listAdminPayouts,
  listAdminPayments,
  listAdminSettlements,
  listAdminWalletReconciliations,
  postAdminSettlement,
  refundAdminPayment,
  retryAdminPayout,
  reviewAdminCashout,
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

describe("admin finance API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ items: [], meta: { total: 0 } })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes list filters to cashouts, payouts, and payments", async () => {
    const query = { page: 2, limit: 50, status: "PENDING", search: "user-1", from: "2026-09-01", to: "2026-09-17" };

    await listAdminCashouts(query);
    let [url, init] = lastCall();
    expect(url).toContain("/admin-finance/cashouts");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=50");
    expect(url).toContain("status=PENDING");
    expect(url).toContain("search=user-1");
    expect(url).toContain("from=2026-09-01");
    expect(url).toContain("to=2026-09-17");
    expect(init.method).toBe("GET");

    await listAdminPayouts(query);
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/payouts");
    expect(url).toContain("status=PENDING");
    expect(init.method).toBe("GET");

    await listAdminPayments(query);
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/payments");
    expect(url).toContain("status=PENDING");
    expect(init.method).toBe("GET");
  });

  it("sends cashout review, payout retry, and payment refund mutations", async () => {
    await reviewAdminCashout("cashout-1", { status: "APPROVED", reason: "Verified", provider: "mobile-money" });
    let [url, init] = lastCall();
    expect(url).toContain("/admin-finance/cashouts/cashout-1/review");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ status: "APPROVED", reason: "Verified", provider: "mobile-money" });

    await retryAdminPayout("payout-1");
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/payouts/payout-1/retry");
    expect(init.method).toBe("POST");

    await refundAdminPayment("payment-1", { amount: 5000, reason: "Duplicate", idempotencyKey: "refund-key" });
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/payments/payment-1/refund");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ amount: 5000, reason: "Duplicate", idempotencyKey: "refund-key" });
  });

  it("covers settlement list/create/post/cancel endpoints", async () => {
    await listAdminSettlements({ status: "DRAFT", from: "2026-09-01", to: "2026-09-17" });
    let [url, init] = lastCall();
    expect(url).toContain("/admin-finance/settlements");
    expect(url).toContain("status=DRAFT");
    expect(init.method).toBe("GET");

    await createAdminSettlement({ periodStart: "2026-09-01", periodEnd: "2026-09-17", currency: "UGX", provider: "paytota" });
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/settlements");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ periodStart: "2026-09-01", periodEnd: "2026-09-17", currency: "UGX" });

    await postAdminSettlement("settlement-1");
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/settlements/settlement-1/post");
    expect(init.method).toBe("PATCH");

    await cancelAdminSettlement("settlement-1");
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/settlements/settlement-1/cancel");
    expect(init.method).toBe("PATCH");
  });

  it("covers revenue summary and wallet reconciliation endpoints", async () => {
    await getAdminRevenueSummary({ from: "2026-09-01", to: "2026-09-17" });
    let [url, init] = lastCall();
    expect(url).toContain("/admin-finance/revenue/summary");
    expect(url).toContain("from=2026-09-01");
    expect(init.method).toBe("GET");

    await listAdminWalletReconciliations({ status: "COMPLETED", search: "run-1" });
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/wallet-reconciliation");
    expect(url).toContain("status=COMPLETED");
    expect(url).toContain("search=run-1");
    expect(init.method).toBe("GET");

    await createAdminWalletReconciliation({ periodStart: "2026-09-01", periodEnd: "2026-09-17", type: "PAYMENTS", currency: "UGX", runId: "run-1" });
    [url, init] = lastCall();
    expect(url).toContain("/admin-finance/wallet-reconciliation");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ type: "PAYMENTS", currency: "UGX", runId: "run-1" });
  });
});
