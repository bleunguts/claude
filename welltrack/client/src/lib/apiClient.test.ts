import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, ApiError, setUnauthorizedHandler } from "./apiClient";

function jsonResponse(status: number, body: unknown) {
  return new Response(status === 204 ? null : JSON.stringify(body), { status });
}

describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setUnauthorizedHandler(null);
  });

  it("retries once after a successful silent refresh on a 401 UNAUTHORIZED", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse(401, {
          error: { code: "UNAUTHORIZED", message: "Invalid or expired access token" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    setUnauthorizedHandler(vi.fn().mockResolvedValue(true));

    const result = await apiFetch<{ ok: boolean }>("/symptom-logs");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws without retrying again when the refresh itself fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(401, {
        error: { code: "UNAUTHORIZED", message: "Invalid or expired access token" },
      }),
    );

    setUnauthorizedHandler(vi.fn().mockResolvedValue(false));

    await expect(apiFetch("/symptom-logs")).rejects.toThrow(ApiError);
  });

  it("does not attempt a refresh for non-auth errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse(400, { error: { code: "VALIDATION_ERROR", message: "Bad input" } }),
    );
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(apiFetch("/symptom-logs")).rejects.toThrow(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });
});
