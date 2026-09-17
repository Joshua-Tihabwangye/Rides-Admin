import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminRole,
  getAdminRole,
  listAdminPermissions,
  listAdminRoles,
  patchAdminRole,
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

describe("admin roles and permissions API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ permissions: ["admin:user:read"] })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads canonical backend permissions", async () => {
    const permissions = await listAdminPermissions();
    const [url, init] = lastCall();

    expect(url).toContain("/admin/permissions");
    expect(init.method).toBe("GET");
    expect(permissions).toEqual(["admin:user:read"]);
  });

  it("loads role list and role detail", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse([{ id: "role-1", permissions: ["admin:user:read"] }]));
    await listAdminRoles();
    let [url, init] = lastCall();
    expect(url).toContain("/admin/roles");
    expect(init.method).toBe("GET");

    await getAdminRole("role-1");
    [url, init] = lastCall();
    expect(url).toContain("/admin/roles/role-1");
    expect(init.method).toBe("GET");
  });

  it("creates and patches roles with canonical permission strings", async () => {
    await createAdminRole({
      name: "Finance reviewer",
      description: "Reviews finance queues",
      permissions: ["finance:cashout:read"],
    });
    let [url, init] = lastCall();
    expect(url).toContain("/admin/roles");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      name: "Finance reviewer",
      description: "Reviews finance queues",
      permissions: ["finance:cashout:read"],
    });

    await patchAdminRole("role-1", {
      permissions: ["finance:cashout:read", "finance:cashout:review"],
    });
    [url, init] = lastCall();
    expect(url).toContain("/admin/roles/role-1");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({
      permissions: ["finance:cashout:read", "finance:cashout:review"],
    });
  });
});
