import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminAgent,
  getAdminAgentChat,
  getAdminAnalyticsTimeseries,
  getAdminExperimentResults,
  sendAdminAgentChat,
} from "./adminApi";

const okResponse = (data: unknown) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({ data })),
  }) as unknown as Response;

describe("admin agent, experiment, and analytics API helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ id: "ok" })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const lastCall = () => {
    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<[string, RequestInit]>;
    expect(calls.length).toBeGreaterThan(0);
    return calls[calls.length - 1];
  };

  it("creates agents with backend profile fields intact", async () => {
    await createAdminAgent({
      fullName: "Amina Agent",
      email: "amina@example.com",
      phone: "+256700000001",
      password: "temporary-pass",
      roles: ["agent"],
      department: "Safety",
      title: "Safety desk agent",
      portalRole: "support_t2",
      serviceCapabilities: ["RIDE"],
    });

    const [url, init] = lastCall();
    const body = JSON.parse(init.body as string);

    expect(url).toContain("/admin/agents");
    expect(init.method).toBe("POST");
    expect(body).toMatchObject({
      fullName: "Amina Agent",
      email: "amina@example.com",
      roles: ["agent"],
      department: "Safety",
      title: "Safety desk agent",
      portalRole: "support_t2",
      serviceCapabilities: ["RIDE"],
    });
  });

  it("loads and sends backend-backed agent chat", async () => {
    await getAdminAgentChat("agent-1");
    let [url, init] = lastCall();
    expect(url).toContain("/admin/agents/agent-1/chat");
    expect(init.method).toBe("GET");

    await sendAdminAgentChat("agent-1", "Please review the open SOS queue.");
    [url, init] = lastCall();
    expect(url).toContain("/admin/agents/agent-1/chat");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ message: "Please review the open SOS queue." });
  });

  it("loads experiment result analytics by experiment id", async () => {
    await getAdminExperimentResults("experiment-1");
    const [url, init] = lastCall();

    expect(url).toContain("/admin/experiments/experiment-1/results");
    expect(init.method).toBe("GET");
  });

  it("passes analytics filters as backend query parameters", async () => {
    await getAdminAnalyticsTimeseries("thisMonth", {
      service: "Delivery",
      region: "Kampala",
    });
    const [url, init] = lastCall();

    expect(url).toContain("/admin/analytics/timeseries");
    expect(url).toContain("period=month");
    expect(url).toContain("service=Delivery");
    expect(url).toContain("region=Kampala");
    expect(init.method).toBe("GET");
  });
});
