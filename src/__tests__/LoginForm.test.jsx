import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../auth/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../auth/AuthContext.jsx";
import LoginForm from "../components/LoginForm.jsx";

describe("LoginForm", () => {
  let signIn;
  let signUp;
  let onSuccess;

  beforeEach(() => {
    signIn = vi.fn().mockResolvedValue(undefined);
    signUp = vi.fn().mockResolvedValue(undefined);
    onSuccess = vi.fn();
    useAuth.mockReturnValue({ signIn, signUp });
  });

  it("trims the username, signs in, and reports success", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Usuario:"), "  ana  ");
    await user.type(screen.getByLabelText("Contraseña:"), "password");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(signIn).toHaveBeenCalledWith("ana", "password");
    expect(signUp).not.toHaveBeenCalled();
  });

  it("shows registration requirements and creates an account", async () => {
    const user = userEvent.setup();
    render(<LoginForm onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: "Crear una cuenta" }));
    const passwordInput = screen.getByLabelText("Contraseña:");
    expect(passwordInput).toHaveAttribute("minlength", "8");
    expect(passwordInput).toHaveAttribute("autocomplete", "new-password");

    await user.type(screen.getByLabelText("Usuario:"), "ana");
    await user.type(passwordInput, "password");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(signUp).toHaveBeenCalledWith("ana", "password");
    expect(signIn).not.toHaveBeenCalled();
  });

  it("displays authentication errors and allows retrying", async () => {
    const user = userEvent.setup();
    signIn.mockRejectedValueOnce(new Error("Credenciales incorrectas."));
    render(<LoginForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Usuario:"), "ana");
    await user.type(screen.getByLabelText("Contraseña:"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Credenciales incorrectas.");
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeEnabled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
