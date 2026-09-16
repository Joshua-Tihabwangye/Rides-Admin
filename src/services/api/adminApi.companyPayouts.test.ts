import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminCompanyPayoutSettings,
  listAdminCompanyPayouts,
  patchAdminCompanyPayoutSettings,
} from "./adminApi";

const okResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({ data })),
  }) as unknown as Response;

describe("admin company payout APIs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ companyId: "company-1" })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;
    expect(calls.length).toBeGreaterThan(0);
    return calls[calls.length - 1];
  };

  it("loads company payout settings", async () => {
    await getAdminCompanyPayoutSettings("company-1");
    const [url, init] = lastCall();

    expect(url).toContain("/admin/companies/company-1/payout-settings");
    expect(init.method).toBe("GET");
  });

  it("patches company payout settings with a plain JSON body", async () => {
    await patchAdminCompanyPayoutSettings("company-1", {
      schedule: "weekly",
      minimumAmount: 10000,
      currency: "UGX",
      destination: "bank-account-1",
      enabled: true,
    });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/companies/company-1/payout-settings");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({
      schedule: "weekly",
      minimumAmount: 10000,
      currency: "UGX",
      destination: "bank-account-1",
      enabled: true,
    });
  });

  it("loads company payout history", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse([{ id: "payout-1" }]));

    const rows = await listAdminCompanyPayouts("company-1");
    const [url, init] = lastCall();

    expect(url).toContain("/admin/companies/company-1/payouts");
    expect(init.method).toBe("GET");
    expect(rows).toEqual([{ id: "payout-1" }]);
  });
});
