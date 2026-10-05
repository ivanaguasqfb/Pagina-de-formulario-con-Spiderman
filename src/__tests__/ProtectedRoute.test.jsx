import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../auth/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../auth/AuthContext.jsx";
import ProtectedRoute from "../routes/ProtectedRoute.jsx";

function LoginLocation() {
  const location = useLocation();
  return <p>Ruta solicitada: {location.state?.from?.pathname}</p>;
}

function renderProtectedRoute(initialEntry = "/privado") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginLocation />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/privado" element={<h1>Contenido privado</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  it("shows a loading state while checking the session", () => {
    useAuth.mockReturnValue({ user: null, isLoading: true, authError: "" });
    renderProtectedRoute();

    expect(screen.getByText("Cargando sesión...").closest("main")).toHaveAttribute("aria-busy", "true");
  });

  it("redirects unauthenticated visitors and preserves their destination", () => {
    useAuth.mockReturnValue({ user: null, isLoading: false, authError: "" });
    renderProtectedRoute();

    expect(screen.getByText("Ruta solicitada: /privado")).toBeInTheDocument();
  });

  it("shows the session error instead of redirecting", () => {
    useAuth.mockReturnValue({ user: null, isLoading: false, authError: "sin conexión" });
    renderProtectedRoute();

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo conectar con el servidor: sin conexión");
    expect(screen.queryByText(/Ruta solicitada/)).not.toBeInTheDocument();
  });

  it("renders the protected content for an authenticated user", () => {
    useAuth.mockReturnValue({ user: { username: "ana" }, isLoading: false, authError: "" });
    renderProtectedRoute();

    expect(screen.getByRole("heading", { name: "Contenido privado" })).toBeInTheDocument();
  });
});
