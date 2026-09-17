import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPricingRule,
  createPromoCode,
  createSurgeZone,
  deletePricingRule,
  deletePromoCode,
  deleteSurgeZone,
  listPricingRules,
  listPromoCodes,
  listSurgeZones,
  patchPricingRule,
  patchPromoCode,
  patchSurgeZone,
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

describe("admin pricing API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ id: "ok" })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses canonical pricing rule CRUD endpoints", async () => {
    await listPricingRules();
    let [url, init] = lastCall();
    expect(url).toContain("/pricing/rules");
    expect(init.method).toBe("GET");

    await createPricingRule({ serviceType: "RIDE", baseFare: 2500, currency: "UGX" });
    [url, init] = lastCall();
    expect(url).toContain("/pricing/rules");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ serviceType: "RIDE", baseFare: 2500, currency: "UGX" });

    await patchPricingRule("rule-1", { active: false });
    [url, init] = lastCall();
    expect(url).toContain("/pricing/rules/rule-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ active: false });

    await deletePricingRule("rule-1");
    [url, init] = lastCall();
    expect(url).toContain("/pricing/rules/rule-1");
    expect(init.method).toBe("DELETE");
  });

  it("uses canonical surge zone CRUD endpoints", async () => {
    await listSurgeZones();
    let [url, init] = lastCall();
    expect(url).toContain("/pricing/surges");
    expect(init.method).toBe("GET");

    await createSurgeZone({ name: "Kampala CBD", serviceType: "RIDE", multiplier: 1.5 });
    [url, init] = lastCall();
    expect(url).toContain("/pricing/surges");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ name: "Kampala CBD", multiplier: 1.5 });

    await patchSurgeZone("surge-1", { active: false });
    [url, init] = lastCall();
    expect(url).toContain("/pricing/surges/surge-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ active: false });

    await deleteSurgeZone("surge-1");
    [url, init] = lastCall();
    expect(url).toContain("/pricing/surges/surge-1");
    expect(init.method).toBe("DELETE");
  });

  it("uses canonical promo code CRUD endpoints", async () => {
    await listPromoCodes();
    let [url, init] = lastCall();
    expect(url).toContain("/pricing/promos");
    expect(init.method).toBe("GET");

    await createPromoCode({ code: "WELCOME10", discountType: "PERCENT", value: 10 });
    [url, init] = lastCall();
    expect(url).toContain("/pricing/promos");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ code: "WELCOME10", discountType: "PERCENT", value: 10 });

    await patchPromoCode("promo-1", { active: false });
    [url, init] = lastCall();
    expect(url).toContain("/pricing/promos/promo-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ active: false });

    await deletePromoCode("promo-1");
    [url, init] = lastCall();
    expect(url).toContain("/pricing/promos/promo-1");
    expect(init.method).toBe("DELETE");
  });
});
