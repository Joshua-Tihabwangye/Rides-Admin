import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminReconciliationRun,
  listAdminReconciliationProviders,
  listAdminReconciliationRecords,
  listAdminReconciliationRuns,
  resolveAdminReconciliationRecord,
  startAdminReconciliationRun,
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

describe("admin reconciliation API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ id: "ok" })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists reconciliation runs with backend filters", async () => {
    await listAdminReconciliationRuns({ type: "PAYMENTS", status: "FAILED" });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/reconciliation/runs");
    expect(url).toContain("type=PAYMENTS");
    expect(url).toContain("status=FAILED");
    expect(init.method).toBe("GET");
  });

  it("starts reconciliation runs with period, provider, and tolerance", async () => {
    await startAdminReconciliationRun({
      type: "PAYOUTS",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-17",
      provider: "paytota",
      tolerance: 0.05,
    });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/reconciliation/runs");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      type: "PAYOUTS",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-17",
      provider: "paytota",
      tolerance: 0.05,
    });
  });

  it("gets run detail and filtered records", async () => {
    await getAdminReconciliationRun("run-1");
    let [url, init] = lastCall();
    expect(url).toContain("/admin/reconciliation/runs/run-1");
    expect(init.method).toBe("GET");

    await listAdminReconciliationRecords("run-1", { status: "VARIANCE" });
    [url, init] = lastCall();
    expect(url).toContain("/admin/reconciliation/runs/run-1/records");
    expect(url).toContain("status=VARIANCE");
    expect(init.method).toBe("GET");
  });

  it("resolves reconciliation records through the run record endpoint", async () => {
    await resolveAdminReconciliationRecord("run-1", "record-1", {
      status: "RESOLVED",
      resolution: "Matched against provider settlement export.",
    });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/reconciliation/runs/run-1/records/record-1/resolve");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      status: "RESOLVED",
      resolution: "Matched against provider settlement export.",
    });
  });

  it("loads available reconciliation providers", async () => {
    await listAdminReconciliationProviders();
    const [url, init] = lastCall();

    expect(url).toContain("/admin/reconciliation/providers");
    expect(init.method).toBe("GET");
  });
});
