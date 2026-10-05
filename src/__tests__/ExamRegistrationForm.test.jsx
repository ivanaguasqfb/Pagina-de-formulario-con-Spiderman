import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../services/registrationService.js", () => ({
  registerExamCandidate: vi.fn(),
}));

import { registerExamCandidate } from "../services/registrationService.js";
import ExamRegistrationForm from "../components/ExamRegistrationForm.jsx";

const DRAFT_KEY = "exam-registration-form-draft";

async function completeRequiredFields(user) {
  await user.type(screen.getByLabelText("Nombre completo:"), "Ana López");
  await user.type(screen.getByLabelText("Correo electrónico:"), "ana@example.com");
  await user.type(screen.getByLabelText("Teléfono:"), "5551234567");
  await user.type(screen.getByLabelText("Edad:"), "24");
}

describe("ExamRegistrationForm", () => {
  beforeEach(() => {
    sessionStorage.clear();
    registerExamCandidate.mockReset();
    registerExamCandidate.mockResolvedValue(undefined);
  });

  it("restores saved fields and persists edits to the draft", async () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      nombre: "Ana López",
      correo: "ana@example.com",
      direccion: "Calle 1",
      edad: 24,
    }));

    const user = userEvent.setup();
    render(<ExamRegistrationForm />);

    const nameInput = screen.getByLabelText("Nombre completo:");
    expect(nameInput).toHaveValue("Ana López");
    expect(screen.getByLabelText("Dirección:")).toHaveValue("Calle 1");

    await user.clear(nameInput);
    await user.type(nameInput, "María");
    expect(JSON.parse(sessionStorage.getItem(DRAFT_KEY))).toMatchObject({ nombre: "María" });
  });

  it("reports a malformed saved draft without preventing form use", () => {
    sessionStorage.setItem(DRAFT_KEY, "{not-json");
    render(<ExamRegistrationForm />);

    expect(screen.getByRole("alert")).toHaveTextContent("No fue posible recuperar el progreso guardado.");
    expect(screen.getByLabelText("Nombre completo:")).toHaveValue("");
  });

  it("rejects non-PDF files", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<ExamRegistrationForm />);

    await user.upload(
      screen.getByLabelText("Documento PDF:"),
      new File(["contenido"], "documento.txt", { type: "text/plain" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Solo se permiten archivos PDF.");
    expect(screen.queryByText(/^Archivo seleccionado:/)).not.toBeInTheDocument();
  });

  it("rejects PDFs larger than 10 MB", async () => {
    const user = userEvent.setup();
    render(<ExamRegistrationForm />);
    const oversizedPdf = new File(["x".repeat(10 * 1024 * 1024 + 1)], "grande.pdf", {
      type: "application/pdf",
    });

    await user.upload(screen.getByLabelText("Documento PDF:"), oversizedPdf);

    expect(screen.getByRole("alert")).toHaveTextContent("El PDF no puede superar los 10 MB.");
  });

  it("submits numeric age and the selected PDF, then clears the form and draft", async () => {
    const user = userEvent.setup();
    render(<ExamRegistrationForm />);
    const pdfFile = new File(["%PDF-1.4"], "identificacion.pdf", { type: "application/pdf" });

    await completeRequiredFields(user);
    await user.upload(screen.getByLabelText("Documento PDF:"), pdfFile);
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Registro enviado correctamente.");
    expect(registerExamCandidate).toHaveBeenCalledWith({
      nombre: "Ana López",
      direccion: "",
      correo: "ana@example.com",
      telefono: "5551234567",
      edad: 24,
      pdfFile,
    });
    expect(screen.getByLabelText("Nombre completo:")).toHaveValue("");
    expect(sessionStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("shows a visible error when registration fails", async () => {
    registerExamCandidate.mockRejectedValue(new Error("Not configured"));
    const user = userEvent.setup();
    render(<ExamRegistrationForm />);

    await completeRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Registrarse" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No fue posible enviar el registro todavía.");
  });
});
