import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { apiRequest } from "../services/api";

const newQuestion = () => ({
  prompt: "",
  type: "single",
  options: ["", ""],
  correctOption: 0,
  correctOptions: [0],
});

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([newQuestion()]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateQuestion(index, changes) {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? { ...question, ...changes } : question));
  }

  function changeType(index, type) {
    updateQuestion(index, {
      type,
      options: type === "text" ? [] : ["", ""],
      correctOption: 0,
      correctOptions: [0],
    });
  }

  function updateOption(questionIndex, optionIndex, value) {
    setQuestions((current) => current.map((question, index) => index !== questionIndex ? question : {
      ...question,
      options: question.options.map((option, optionIndexInQuestion) => optionIndexInQuestion === optionIndex ? value : option),
    }));
  }

  function removeOption(questionIndex, optionIndex) {
    setQuestions((current) => current.map((question, index) => {
      if (index !== questionIndex) return question;
      const options = question.options.filter((_, optionIndexInQuestion) => optionIndexInQuestion !== optionIndex);
      const correctOptions = question.correctOptions.filter((choice) => choice !== optionIndex).map((choice) => choice > optionIndex ? choice - 1 : choice);
      return {
        ...question,
        options,
        correctOption: Math.min(question.correctOption >= optionIndex ? question.correctOption - 1 : question.correctOption, options.length - 1),
        correctOptions,
      };
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const payload = questions.map((question) => ({
      ...question,
      ...(question.type === "multiple" ? { correctOptions: question.correctOptions } : {}),
    }));
    apiRequest("/api/exams", { method: "POST", body: { title, description, questions: payload } })
      .then(({ exam }) => navigate(`/examenes/${exam.id}/resultados`, { replace: true }))
      .catch((saveError) => setError(saveError.message))
      .finally(() => setSaving(false));
  }

  return (
    <AppLayout>
      <div className="form-page">
        <button className="back-link" type="button" onClick={() => navigate("/")}>← Volver a explorar</button>
        <div className="page-intro">
          <p className="eyebrow">CREA ALGO PARA COMPARTIR</p>
          <h1>Diseña tu examen</h1>
          <p>Agrega preguntas, define las respuestas correctas y publícalo para la comunidad.</p>
        </div>
        <form className="builder-form" onSubmit={handleSubmit}>
          <section className="builder-section">
            <div className="section-number">01</div>
            <div className="builder-fields">
              <label className="field-label" htmlFor="exam-title">Nombre del examen</label>
              <input id="exam-title" className="text-input title-input" maxLength={120} placeholder="Por ejemplo: Fundamentos de biología" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} />
              <label className="field-label" htmlFor="exam-description">Descripción <span className="optional-label">· opcional</span></label>
              <textarea id="exam-description" className="text-input" rows={3} maxLength={1000} placeholder="¿Qué temas cubre este examen?" value={description} onChange={(event) => setDescription(event.target.value)} />
            </div>
          </section>
          <div className="builder-divider" />
          <div className="questions-heading"><div><p className="eyebrow">02 · PREGUNTAS</p><h2>¿Qué quieres preguntar?</h2></div><span className="question-count">{questions.length} {questions.length === 1 ? "pregunta" : "preguntas"}</span></div>
          <div className="question-editor-list">
            {questions.map((question, index) => (
              <section className="question-editor" key={index}>
                <div className="question-editor-top">
                  <span className="question-index">PREGUNTA {String(index + 1).padStart(2, "0")}</span>
                  <div className="question-tools">
                    <select aria-label={`Tipo de pregunta ${index + 1}`} value={question.type} onChange={(event) => changeType(index, event.target.value)}>
                      <option value="single">Opción única</option>
                      <option value="multiple">Varias opciones</option>
                      <option value="text">Respuesta abierta</option>
                    </select>
                    {questions.length > 1 && <button className="remove-button" type="button" onClick={() => setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))}>Eliminar</button>}
                  </div>
                </div>
                <textarea className="text-input question-prompt" placeholder="Escribe aquí tu pregunta..." value={question.prompt} maxLength={500} rows={2} required onChange={(event) => updateQuestion(index, { prompt: event.target.value })} />
                {question.type === "text" ? (
                  <p className="helper-text">Las respuestas abiertas se mostrarán al creador y no se califican automáticamente.</p>
                ) : (
                  <div className="option-list">
                    {question.options.map((option, optionIndex) => (
                      <div className="option-row" key={optionIndex}>
                        <input
                          aria-label={question.type === "single" ? `Marcar opción ${optionIndex + 1} como correcta` : `Incluir opción ${optionIndex + 1} en las respuestas correctas`}
                          type={question.type === "single" ? "radio" : "checkbox"}
                          name={`correct-${index}`}
                          checked={question.type === "single" ? question.correctOption === optionIndex : question.correctOptions.includes(optionIndex)}
                          onChange={() => question.type === "single"
                            ? updateQuestion(index, { correctOption: optionIndex })
                            : updateQuestion(index, { correctOptions: question.correctOptions.includes(optionIndex) ? question.correctOptions.filter((choice) => choice !== optionIndex) : [...question.correctOptions, optionIndex] })}
                          required={question.type === "single" && optionIndex === 0}
                        />
                        <input className="option-input" placeholder={`Opción ${optionIndex + 1}`} value={option} maxLength={120} required onChange={(event) => updateOption(index, optionIndex, event.target.value)} />
                        <span className="correct-hint">{question.type === "single" ? "Correcta" : "Válida"}</span>
                        {question.options.length > 2 && <button type="button" className="remove-option" aria-label={`Eliminar opción ${optionIndex + 1}`} onClick={() => removeOption(index, optionIndex)}>×</button>}
                      </div>
                    ))}
                    {question.options.length < 8 && <button type="button" className="add-option" onClick={() => updateQuestion(index, { options: [...question.options, ""] })}>+ Agregar opción</button>}
                    <p className="helper-text">{question.type === "single" ? "Selecciona el círculo de la respuesta correcta." : "Marca todas las respuestas correctas."}</p>
                  </div>
                )}
              </section>
            ))}
          </div>
          <button className="add-question" type="button" disabled={questions.length >= 50} onClick={() => setQuestions((current) => [...current, newQuestion()])}><span>+</span> Agregar pregunta</button>
          <div className="publish-bar">
            <p>Tu examen se publicará para que cualquier usuario pueda responderlo.</p>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="button" type="submit" disabled={saving}>{saving ? "Publicando..." : "Publicar examen →"}</button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
