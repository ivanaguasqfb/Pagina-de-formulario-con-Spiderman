import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoginForm from "../components/LoginForm";
import ThemeToggle from "../components/ThemeToggle";
import spiderHero from "../assets/spider-hero.png";

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const destination = location.state?.from?.pathname || "/";

  return (
    <div className="login-layout">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="login-visual" style={{ transform: `translate3d(0, ${scrollY * 0.14}px, 0)` }}>
        <img src={spiderHero} alt="Spider-Man realizando acrobacias" />
      </div>
      <ThemeToggle className="login-theme-toggle" />
      <aside className="login-aside">
        <a className="brand" href="/"><span className="brand-mark">A</span><span>Aula<span className="brand-light">forma</span></span></a>
        <div className="login-quote">
          <p className="eyebrow">APRENDER ES COMPARTIR</p>
          <h2>Las buenas ideas también se ponen a prueba.</h2>
          <p>Diseña evaluaciones que despierten curiosidad. Comparte lo que sabes y aprende de los demás.</p>
        </div>
        <p className="login-aside-footer">Un lugar para aprender juntos.</p>
      </aside>
      <main className="login-panel">
        <div className="login-card">
          <p className="eyebrow">AULA · EXÁMENES</p>
          <h1>Tu espacio de evaluación</h1>
          <p>Inicia sesión o crea una cuenta para diseñar, compartir y responder exámenes.</p>
          <LoginForm onSuccess={() => navigate(destination, { replace: true })} />
        </div>
      </main>
    </div>
  );
}