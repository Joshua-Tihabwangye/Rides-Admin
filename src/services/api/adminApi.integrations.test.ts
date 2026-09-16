import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminIntegrationsHealth } from "./adminApi";

describe("getAdminIntegrationsHealth", () => {
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
                schoolConnections: [{ id: "school-1", name: "North Campus" }],
                outbox: { pending: 2, failed: 1 },
                dispatch: { desks: 3, agents: 12 },
                generatedAt: "2026-09-16T06:47:00.000Z",
              },
            }),
          ),
      } as unknown as Response),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads integration health from the authoritative admin endpoint", async () => {
    const health = await getAdminIntegrationsHealth();
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toContain("/admin/integrations/health");
    expect(calls[0][1].method).toBe("GET");
    expect(health.outbox.failed).toBe(1);
    expect(health.dispatch.agents).toBe(12);
    expect(health.schoolConnections[0].name).toBe("North Campus");
  });
});
