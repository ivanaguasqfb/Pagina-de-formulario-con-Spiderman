import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "../theme/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    sessionStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it("switches between light and dark themes and saves the selection for the session", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    await user.click(screen.getByRole("button", { name: "Cambiar a modo oscuro" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(sessionStorage.getItem("aulaforma-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Cambiar a modo claro" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Cambiar a modo claro" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(sessionStorage.getItem("aulaforma-theme")).toBe("light");
  });

  it("restores the saved theme when the app is mounted again in the same session", () => {
    sessionStorage.setItem("aulaforma-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(screen.getByRole("button", { name: "Cambiar a modo claro" })).toBeInTheDocument();
  });
});
