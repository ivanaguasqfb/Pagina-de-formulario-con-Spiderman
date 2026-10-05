import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { apiRequest } from "../services/api";

export default function TakeExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    apiRequest(`/api/exams/${id}`)
      .then(({ exam: loadedExam }) => {
        setExam(loadedExam);
        setSubmitted(loadedExam.completed);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [id]);

  function setAnswer(questionId, answer) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  function toggleOption(questionId, optionIndex) {
    const current = answers[questionId] || [];
    setAnswer(questionId, current.includes(optionIndex)
      ? current.filter((option) => option !== optionIndex)
      : [...current, optionIndex]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiRequest(`/api/exams/${id}/submissions`, { method: "POST", body: { answers } });
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout active="explore">
      <div className="form-page take-page">
        <button className="back-link" type="button" onClick={() => navigate("/")}>← Volver a explorar</button>
        {loading && <p className="muted">Cargando examen...</p>}
        {error && !exam && <p className="error notice" role="alert">{error}</p>}
        {exam && (
          <>
            <div className="page-intro exam-intro">
              <p className="eyebrow">EXAMEN · POR {exam.author.toUpperCase()}</p>
              <h1>{exam.title}</h1>
              {exam.description && <p>{exam.description}</p>}
              <span className="exam-question-total">{exam.questions.length} {exam.questions.length === 1 ? "pregunta" : "preguntas"}</span>
            </div>
            {exam.isOwner ? (
              <div className="notice-card">
                <div><h2>Este examen es tuyo</h2><p>Consulta las respuestas que han enviado los participantes.</p></div>
                <button className="button" onClick={() => navigate(`/examenes/${id}/resultados`)}>Ver resultados →</button>
              </div>
            ) : submitted ? (
              <div className="success-card" role="status"><span>✓</span><div><h2>¡Respuesta registrada!</h2><p>Ya respondiste este examen. El creador podrá revisar tus respuestas.</p></div></div>
            ) : (
              <form className="answer-form" onSubmit={handleSubmit}>
                {exam.questions.map((question, index) => (
                  <fieldset className="answer-question" key={question.id}>
                    <legend><span className="question-number">{String(index + 1).padStart(2, "0")}</span>{question.prompt}</legend>
                    {question.type === "text" ? (
                      <textarea className="text-input answer-text" rows={4} maxLength={2000} placeholder="Escribe tu respuesta..." required value={answers[question.id] || ""} onChange={(event) => setAnswer(question.id, event.target.value)} />
                    ) : (
                      <div className="answer-options">
                        {question.options.map((option, optionIndex) => (
                          <label className="answer-option" key={optionIndex}>
                            <input
                              type={question.type === "single" ? "radio" : "checkbox"}
                              name={question.id}
                              checked={question.type === "single" ? answers[question.id] === optionIndex : (answers[question.id] || []).includes(optionIndex)}
                              required={question.type === "single" && optionIndex === 0}
                              onChange={() => question.type === "single" ? setAnswer(question.id, optionIndex) : toggleOption(question.id, optionIndex)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {question.type === "multiple" && <small className="helper-text">Puedes elegir varias respuestas.</small>}
                  </fieldset>
                ))}
                {error && <p className="error" role="alert">{error}</p>}
                <div className="submit-row"><span>Revisa tus respuestas antes de enviar.</span><button className="button" disabled={submitting}>{submitting ? "Enviando..." : "Enviar respuestas →"}</button></div>
              </form>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
