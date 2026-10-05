import { useState } from "react";
import { registerExamCandidate } from "../services/registrationService";

const initialForm = { nombre: "", direccion: "", correo: "", telefono: "", edad: "" };
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DRAFT_STORAGE_KEY = "exam-registration-form-draft";

function loadDraft() {
  let savedDraft;

  try {
    savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    if (error instanceof DOMException) {
      return { form: initialForm, error: "No fue posible acceder al almacenamiento temporal del navegador." };
    }

    throw error;
  }

  if (!savedDraft) {
    return { form: initialForm, error: "" };
  }

  let parsedDraft;

  try {
    parsedDraft = JSON.parse(savedDraft);
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }

    return { form: initialForm, error: "No fue posible recuperar el progreso guardado." };
  }

  if (!parsedDraft || typeof parsedDraft !== "object" || Array.isArray(parsedDraft)) {
    return { form: initialForm, error: "No fue posible recuperar el progreso guardado." };
  }

  const form = Object.fromEntries(
    Object.keys(initialForm).map((field) => [
      field,
      typeof parsedDraft[field] === "string" ? parsedDraft[field] : ""
    ])
  );

  return { form, error: "" };
}

export default function ExamRegistrationForm() {
  const [draftState] = useState(loadDraft);
  const [form, setForm] = useState(draftState.form);
  const [pdfFile, setPdfFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [draftError, setDraftError] = useState(draftState.error);
  const [status, setStatus] = useState("idle");

  function updateField(event) {
    const { name, value } = event.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    setStatus("idle");

    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedForm));
      setDraftError("");
    } catch (error) {
      if (!(error instanceof DOMException)) {
        throw error;
      }

      setDraftError("No fue posible guardar temporalmente tu progreso en este navegador.");
    }
  }

  function setSelectedFile(file) {
    setFileError("");

    if (!file) {
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setPdfFile(null);
      setFileError("Solo se permiten archivos PDF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPdfFile(null);
      setFileError("El PDF no puede superar los 10 MB.");
      return;
    }

    setPdfFile(file);
    setStatus("idle");
  }

  function handleFileChange(event) {
    setSelectedFile(event.target.files[0]);
  }

  function handleFileDrop(event) {
    event.preventDefault();
    setSelectedFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");

    try {
      await registerExamCandidate({ ...form, edad: Number(form.edad), pdfFile });
      setForm(initialForm);
      setPdfFile(null);
      setStatus("success");

      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        setDraftError("");
      } catch (error) {
        if (!(error instanceof DOMException)) {
          throw error;
        }

        setDraftError("El registro se envió, pero no fue posible borrar el progreso guardado.");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p><label htmlFor="nombre">Nombre completo:</label><br /><input id="nombre" name="nombre" value={form.nombre} onChange={updateField} required /></p>
      <p><label htmlFor="direccion">Dirección:</label><br /><textarea id="direccion" name="direccion" rows="3" value={form.direccion} onChange={updateField} /></p>
      <p><label htmlFor="correo">Correo electrónico:</label><br /><input id="correo" name="correo" type="email" value={form.correo} onChange={updateField} required /></p>
      <p><label htmlFor="telefono">Teléfono:</label><br /><input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={updateField} required /></p>
      <p><label htmlFor="edad">Edad:</label><br /><input id="edad" name="edad" type="number" min="1" value={form.edad} onChange={updateField} required /></p>
      <div className="file-field">
        <label htmlFor="pdf">Documento PDF:</label>
        <div className="file-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleFileDrop}>
          <input id="pdf" name="pdf" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
          <p>Arrastra tu PDF aquí o selecciónalo desde tu dispositivo.</p>
          <small>Solo PDF. Tamaño máximo: 10 MB.</small>
        </div>
        {pdfFile && <p className="file-name" role="status">Archivo seleccionado: {pdfFile.name}</p>}
        {fileError && <p className="error" role="alert">{fileError}</p>}
      </div>
      {draftError && <p className="error" role="alert">{draftError}</p>}
      {status === "success" && <p className="success" role="status">Registro enviado correctamente.</p>}
      {status === "error" && <p className="error" role="alert">No fue posible enviar el registro todavía.</p>}
      <button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Enviando..." : "Registrarse"}</button>
    </form>
  );
}