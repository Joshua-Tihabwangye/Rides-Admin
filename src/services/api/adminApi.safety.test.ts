import { afterEach, describe, expect, it, vi } from "vitest";
import type * as AdminApi from "./adminApi";

const envelopeResponse = (data: unknown, meta?: Record<string, unknown>) =>
  ({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({ success: true, data, meta })),
  }) as unknown as Response;

const fetchCalls = () =>
  (fetch as ReturnType<typeof vi.fn>).mock.calls as Array<
    [string, RequestInit]
  >;

const loadApi = async () => {
  vi.resetModules();
  return (await import("./adminApi")) as typeof AdminApi;
};

describe("admin Safety API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes the backend paginated SOS envelope", async () => {
    const api = await loadApi();
    const incident = { id: "sos-1", sos: true };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        envelopeResponse([incident], {
          page: 1,
          limit: 200,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        }),
      ),
    );

    const response = await api.listAdminSosIncidents({ page: 1, limit: 200 });

    expect(response.items).toEqual([incident]);
    expect(response.meta).toEqual({
      page: 1,
      limit: 200,
      total: 1,
      pageCount: 1,
    });
    expect(fetchCalls().at(-1)?.[0]).toContain(
      "/safety/sos-incidents?page=1&limit=200",
    );
  });

  it("walks every SOS page using envelope metadata", async () => {
    const api = await loadApi();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          envelopeResponse([{ id: "sos-1" }], {
            page: 1,
            limit: 200,
            total: 2,
            totalPages: 2,
          }),
        )
        .mockResolvedValueOnce(
          envelopeResponse([{ id: "sos-2" }], {
            page: 2,
            limit: 200,
            total: 2,
            totalPages: 2,
          }),
        ),
    );

    const incidents = await api.listAllAdminSosIncidents();

    expect(incidents.map((incident) => incident.id)).toEqual([
      "sos-1",
      "sos-2",
    ]);
    expect(fetchCalls()).toHaveLength(2);
  });
});
