import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminContent, listAdminContent, patchAdminContent } from "./adminApi";

const okResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({ data })),
  }) as unknown as Response;

describe("admin content API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ id: "content-1" })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;
    expect(calls.length).toBeGreaterThan(0);
    return calls[calls.length - 1];
  };

  it("lists content by kind", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse([{ id: "policy-1", kind: "vertical-policies" }]));

    const rows = await listAdminContent("vertical-policies");
    const [url, init] = lastCall();

    expect(url).toContain("/admin/content/vertical-policies");
    expect(init.method).toBe("GET");
    expect(rows).toHaveLength(1);
  });

  it("creates content under the requested kind", async () => {
    await createAdminContent("vertical-policies", { title: "Vertical policies" });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/content/vertical-policies");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ title: "Vertical policies" });
  });

  it("patches an existing content item by kind and id", async () => {
    await patchAdminContent("vertical-policies", "policy-1", { status: "published" });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/content/vertical-policies/policy-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ status: "published" });
  });
});
