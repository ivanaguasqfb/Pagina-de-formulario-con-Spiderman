import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { apiRequest } from "../services/api";

export default function ExamResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest(`/api/exams/${id}`), apiRequest(`/api/exams/${id}/results`)])
      .then(([examResponse, resultsResponse]) => {
        setExam(examResponse.exam);
        setResults(resultsResponse.results);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [id]);

  const gradedResults = results.filter((result) => result.maxScore > 0);
  const average = gradedResults.length
    ? Math.round(gradedResults.reduce((sum, result) => sum + result.score / result.maxScore, 0) / gradedResults.length * 100)
    : null;

  return (
    <AppLayout active="mine">
      <div className="form-page results-page">
        <button className="back-link" type="button" onClick={() => navigate("/")}>← Volver a mis exámenes</button>
        {loading && <p className="muted">Cargando resultados...</p>}
        {error && <p className="error notice" role="alert">{error}</p>}
        {exam && !error && (
          <>
            <div className="page-intro">
              <p className="eyebrow">PANEL DEL CREADOR</p>
              <h1>{exam.title}</h1>
              <p>Revisa las respuestas de las personas que completaron tu examen.</p>
            </div>
            <section className="results-summary">
              <div><span className="summary-number">{results.length}</span><span>Respuestas recibidas</span></div>
              <div><span className="summary-number">{exam.questions.length}</span><span>Preguntas</span></div>
              <div><span className="summary-number">{average === null ? "—" : `${average}%`}</span><span>Promedio automático</span></div>
            </section>
            {results.length === 0 ? (
              <div className="empty-state results-empty">
                <span className="empty-icon" aria-hidden="true">◷</span>
                <h3>Aún no hay respuestas</h3>
                <p>Tu examen ya está publicado. Comparte su título con otros usuarios para que lo encuentren en Explorar.</p>
                <button className="button button-secondary" onClick={() => navigate(`/examenes/${id}`)}>Vista previa del examen</button>
              </div>
            ) : (
              <div className="results-list">
                {results.map((result, index) => (
                  <article className="result-card" key={`${result.respondent}-${result.submittedAt}`}>
                    <div className="result-header">
                      <span className="result-avatar">{result.respondent.charAt(0).toUpperCase()}</span>
                      <div className="result-identity"><h2>{result.respondent}</h2><span>Respondió el {new Date(result.submittedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span></div>
                      <div className="result-score">{result.maxScore > 0 ? <><strong>{result.score}/{result.maxScore}</strong><span>aciertos</span></> : <span>Sin calificación automática</span>}</div>
                    </div>
                    <div className="result-answers">
                      {result.answers.map((answer, answerIndex) => (
                        <div className="result-answer" key={answerIndex}>
                          <span className="answer-index">PREGUNTA {String(answerIndex + 1).padStart(2, "0")}</span>
                          <h3>{answer.prompt}</h3>
                          <p className="submitted-answer">{answer.answer}</p>
                          {answer.correctAnswer && <p className={answer.answer === answer.correctAnswer ? "answer-feedback correct" : "answer-feedback"}>Respuesta correcta: {answer.correctAnswer}</p>}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
