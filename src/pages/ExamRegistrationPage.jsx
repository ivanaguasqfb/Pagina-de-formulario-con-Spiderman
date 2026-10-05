import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ExamRegistrationForm from "../components/ExamRegistrationForm";
import ThemeToggle from "../components/ThemeToggle";
import spiderHero from "../assets/spider-hero.png";

export default function ExamRegistrationPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="registration-page">
      <header className="registration-header">
        <a className="registration-brand" href="/" aria-label="Aulaforma, página principal">
          <span className="registration-brand-mark">A</span>
          <span>Aulaforma</span>
        </a>
        <div className="registration-header-actions">
          <ThemeToggle />
          <button className="registration-logout" type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>
      <main className="registration-main">
        <section className="registration-intro">
          <p className="registration-eyebrow">PORTAL DE EVALUACIÓN <span>·</span> INSCRIPCIÓN</p>
          <h1>Registro al examen</h1>
          <p>Completa tus datos para reservar tu lugar. Tu progreso se guarda temporalmente en este navegador.</p>
        </section>
        <div className="registration-content">
          <section className="registration-form-card" aria-labelledby="registration-details-heading">
            <div className="registration-card-heading">
              <span className="registration-step" aria-hidden="true">01</span>
              <div>
                <h2 id="registration-details-heading">Tus datos</h2>
                <p>Información personal y documento de identificación</p>
              </div>
            </div>
            <ExamRegistrationForm />
          </section>
          <aside className="registration-visual" aria-label="Ilustración del portal">
            <div className="registration-visual-glow" />
            <img src={spiderHero} alt="Spider-Man realizando acrobacias" />
            <div className="registration-visual-caption">
              <span>PREPÁRATE PARA EL SIGUIENTE NIVEL</span>
              <strong>Tu próximo reto empieza aquí.</strong>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}