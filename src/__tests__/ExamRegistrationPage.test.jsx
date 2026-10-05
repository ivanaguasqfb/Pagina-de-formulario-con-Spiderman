import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../auth/AuthContext";
import ExamRegistrationPage from "../pages/ExamRegistrationPage";
import { ThemeProvider } from "../theme/ThemeContext";

describe("ExamRegistrationPage", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ signOut: vi.fn() });
  });

  it("shows the registration form alongside the requested hero image", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ExamRegistrationPage />
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Registro al examen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tus datos" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Spider-Man realizando acrobacias" })).toBeInTheDocument();
    expect(screen.getByLabelText("Documento PDF:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cambiar a modo oscuro" })).toBeInTheDocument();
  });
});
