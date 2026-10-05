import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { apiRequest } from "../services/api";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const showMine = searchParams.get("view") === "mine";

  useEffect(() => {
    apiRequest("/api/exams")
      .then(({ exams: availableExams }) => setExams(availableExams))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredExams = useMemo(
    () => exams.filter((exam) => !showMine || exam.isOwner),
    [exams, showMine],
  );

  return (
    <AppLayout active={showMine ? "mine" : "home"}>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">TU ESPACIO DE APRENDIZAJE</p>
          <h1>Las buenas ideas<br />también se ponen a prueba.</h1>
          <p>Crea un examen, compártelo con la comunidad y descubre nuevas formas de aprender.</p>
          <button className="button" type="button" onClick={() => navigate("/examenes/nuevo")}>Diseñar un examen <span aria-hidden="true">→</span></button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-card art-card-back"><span>✓</span><i /><i /><i /></div>
          <div className="art-card art-card-front"><span className="art-star">✳</span><b>Un paso más</b><small>El conocimiento crece al compartirlo.</small><span className="art-progress"><i /></span></div>
          <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
        </div>
      </section>

      <section className="exam-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{showMine ? "TU COLECCIÓN" : "DESCUBRE Y PARTICIPA"}</p>
            <h2>{showMine ? "Mis exámenes" : "Exámenes para explorar"}</h2>
          </div>
          <div className="view-tabs" aria-label="Filtrar exámenes">
            <button className={!showMine ? "view-tab selected" : "view-tab"} onClick={() => navigate("/")}>Todos</button>
            <button className={showMine ? "view-tab selected" : "view-tab"} onClick={() => navigate("/?view=mine")}>Creados por mí</button>
          </div>
        </div>
        {error && <p className="error notice" role="alert">{error}</p>}
        {loading && <p className="muted">Cargando exámenes...</p>}
        {!loading && !error && filteredExams.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">✦</span>
            <h3>{showMine ? "Todavía no has creado un examen" : "Aún no hay exámenes publicados"}</h3>
            <p>{showMine ? "Crea el primero y compártelo con los demás." : "Vuelve pronto o crea el primer examen de la comunidad."}</p>
            <button className="button button-secondary" onClick={() => navigate("/examenes/nuevo")}>Crear examen</button>
          </div>
        )}
        <div className="exam-grid">
          {filteredExams.map((exam, index) => (
            <article className="exam-card" key={exam.id}>
              <div className={`card-art card-art-${index % 4}`}><span>{["✳", "◒", "✦", "⌘"][index % 4]}</span><small>{exam.isOwner ? "TU EXAMEN" : "EXAMEN PÚBLICO"}</small></div>
              <div className="exam-card-body">
                <div className="card-meta"><span>{exam.isOwner ? "Creado por ti" : `Por ${exam.author}`}</span>{exam.completed && <span className="completed-label">Respondido ✓</span>}</div>
                <h3>{exam.title}</h3>
                <p>{exam.description || "Pon a prueba tus conocimientos con este examen."}</p>
                <div className="card-footer">
                  <span>{new Date(exam.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <button className="arrow-button" aria-label={exam.isOwner ? `Ver resultados de ${exam.title}` : `Abrir ${exam.title}`} onClick={() => navigate(exam.isOwner ? `/examenes/${exam.id}/resultados` : `/examenes/${exam.id}`)}>{exam.isOwner ? "Resultados →" : exam.completed ? "Ver examen →" : "Responder →"}</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
