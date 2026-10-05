import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../services/api.js";

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends JSON requests with same-origin credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ saved: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/exams", {
      method: "POST",
      body: { title: "Biología" },
    })).resolves.toEqual({ saved: true });

    expect(fetchMock).toHaveBeenCalledWith("/api/exams", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Biología" }),
    });
  });

  it("returns null for successful empty responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/api/logout")).resolves.toBeNull();
  });

  it("preserves the server error message and status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 403,
      ok: false,
      json: async () => ({ error: "No tienes permiso." }),
    }));

    await expect(apiRequest("/api/exams/1")).rejects.toMatchObject({
      message: "No tienes permiso.",
      status: 403,
    });
  });

  it("uses a fallback message when an error response has no JSON body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
      json: async () => { throw new SyntaxError("Invalid JSON"); },
    }));

    await expect(apiRequest("/api/exams")).rejects.toMatchObject({
      message: "No fue posible completar la solicitud.",
      status: 500,
    });
  });

  it("reports a clear error when the server cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(apiRequest("/api/exams")).rejects.toThrow(
      "No se pudo conectar con el servidor. Inicia la aplicación con `npm run dev:all` e inténtalo de nuevo.",
    );
  });
});
