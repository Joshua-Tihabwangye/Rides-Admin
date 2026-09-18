import { afterEach, describe, expect, it, vi } from "vitest";
import { extractFileAssetIdFromUrl, getFreshFileDownloadUrl } from "./adminApi";

describe("admin file download helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("extracts a file asset id from a signed download URL", () => {
    expect(
      extractFileAssetIdFromUrl(
        "http://localhost:3001/api/v1/files/b91a1e22-3d8b-4704-a093-5bf1af3eab18/download?expiresAt=1&signature=abc",
      ),
    ).toBe("b91a1e22-3d8b-4704-a093-5bf1af3eab18");
  });

  it("refreshes an expired signed URL through the stable file asset endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              data: {
                fileAssetId: "asset-1",
                downloadUrl: "http://localhost:3001/api/v1/files/asset-1/download?expiresAt=999&signature=fresh",
              },
            }),
          ),
      } as unknown as Response),
    );

    const url = await getFreshFileDownloadUrl(
      "http://localhost:3001/api/v1/files/asset-1/download?expiresAt=1&signature=expired",
    );

    expect(url).toContain("signature=fresh");
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain("/files/asset-1");
  });
});
