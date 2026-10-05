import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute() {
  const { user, isLoading, authError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <main aria-busy="true"><p>Cargando sesión...</p></main>;
  }

  if (authError) {
    return <main><p className="error" role="alert">No se pudo conectar con el servidor: {authError}</p><p>Comprueba que la API esté iniciada y vuelve a cargar la página.</p></main>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}