import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/api.js", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "../services/api.js";
import { getCurrentSession, login, logout, register } from "../auth/authService.js";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs in and returns the authenticated user", async () => {
    const user = { username: "ana" };
    apiRequest.mockResolvedValue({ user });

    await expect(login("ana", "password")).resolves.toBe(user);
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      body: { username: "ana", password: "password" },
    });
  });

  it("registers an account and returns its user", async () => {
    const user = { username: "ana" };
    apiRequest.mockResolvedValue({ user });

    await expect(register("ana", "password")).resolves.toBe(user);
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      body: { username: "ana", password: "password" },
    });
  });

  it("returns null when no authenticated session exists", async () => {
    const unauthorized = Object.assign(new Error("Unauthorized"), { status: 401 });
    apiRequest.mockRejectedValue(unauthorized);

    await expect(getCurrentSession()).resolves.toBeNull();
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/me");
  });

  it("propagates session errors other than unauthorized", async () => {
    const failure = Object.assign(new Error("Server unavailable"), { status: 503 });
    apiRequest.mockRejectedValue(failure);

    await expect(getCurrentSession()).rejects.toBe(failure);
  });

  it("ends the current session", async () => {
    apiRequest.mockResolvedValue(null);

    await expect(logout()).resolves.toBeUndefined();
    expect(apiRequest).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });
});
