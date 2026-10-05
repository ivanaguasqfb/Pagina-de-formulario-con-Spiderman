import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout({ children, active = "home" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Ir al inicio">
          <span className="brand-mark">A</span>
          <span>Aula<span className="brand-light">forma</span></span>
        </a>
        <nav className="main-nav" aria-label="Navegación principal">
          <a className={active === "home" ? "nav-link active" : "nav-link"} href="/">Explorar</a>
          <a className="nav-link" href="/?view=mine">Mis exámenes</a>
          <button className="button button-small" type="button" onClick={() => navigate("/examenes/nuevo")}>+ Crear examen</button>
        </nav>
        <div className="account-menu">
          <span className="user-avatar" aria-hidden="true">{user?.username?.charAt(0).toUpperCase()}</span>
          <span className="account-name">{user?.username}</span>
          <button className="text-button" type="button" onClick={handleLogout}>Salir</button>
        </div>
      </header>
      <main className="page-content">
        {logoutError && <p className="error notice" role="alert">{logoutError}</p>}
        {children}
      </main>
      <footer className="site-footer">Aulaforma <span>·</span> Crea, comparte y aprende</footer>
    </div>
  );
}
