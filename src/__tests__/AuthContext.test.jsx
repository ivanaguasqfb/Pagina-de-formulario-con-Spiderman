import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../auth/authService.js", () => ({
  getCurrentSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

import * as authService from "../auth/authService.js";
import { AuthProvider, useAuth } from "../auth/AuthContext.jsx";

function AuthControls() {
  const { user, isLoading, authError, signIn, signUp, signOut } = useAuth();

  return (
    <div>
      <p role="status">{isLoading ? "Cargando" : user?.username || "Sin sesión"}</p>
      {authError && <p role="alert">{authError}</p>}
      <button onClick={() => signIn("ana", "password")}>Iniciar sesión</button>
      <button onClick={() => signUp("ana", "password")}>Crear cuenta</button>
      <button onClick={signOut}>Cerrar sesión</button>
    </div>
  );
}

function renderAuthControls() {
  return render(
    <AuthProvider>
      <AuthControls />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.getCurrentSession.mockResolvedValue(null);
  });

  it("restores a user session before finishing the loading state", async () => {
    authService.getCurrentSession.mockResolvedValue({ username: "ana" });
    renderAuthControls();

    expect(screen.getByRole("status")).toHaveTextContent("Cargando");
    expect(await screen.findByRole("status")).toHaveTextContent("ana");
  });

  it("surfaces errors encountered while restoring the session", async () => {
    authService.getCurrentSession.mockRejectedValue(new Error("API no disponible"));
    renderAuthControls();

    expect(await screen.findByRole("alert")).toHaveTextContent("API no disponible");
    expect(screen.getByRole("status")).toHaveTextContent("Sin sesión");
  });

  it("updates the user after sign-in, registration, and sign-out", async () => {
    const user = userEvent.setup();
    authService.login.mockResolvedValue({ username: "ana" });
    authService.register.mockResolvedValue({ username: "berta" });
    renderAuthControls();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Sin sesión"));

    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
    expect(await screen.findByRole("status")).toHaveTextContent("ana");
    expect(authService.login).toHaveBeenCalledWith("ana", "password");

    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByRole("status")).toHaveTextContent("berta");
    expect(authService.register).toHaveBeenCalledWith("ana", "password");

    await user.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Sin sesión"));
    expect(authService.logout).toHaveBeenCalledOnce();
  });
});
