import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function LoginForm({ onSuccess }) {
  const { signIn, signUp } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        await signUp(username.trim(), password);
      } else {
        await signIn(username.trim(), password);
      }
      onSuccess();
    } catch (submissionError) {
      setError(submissionError.message);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <p>
        <label htmlFor="usuario">Usuario:</label><br />
        <input id="usuario" name="usuario" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" minLength={3} maxLength={32} required />
      </p>
      <p>
        <label htmlFor="contrasena">Contraseña:</label><br />
        <input id="contrasena" name="contrasena" type="password" minLength={isRegistering ? 8 : undefined} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegistering ? "new-password" : "current-password"} required />
        {isRegistering && <small>Usa al menos 8 caracteres.</small>}
      </p>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Un momento..." : isRegistering ? "Crear cuenta" : "Iniciar sesión"}</button>
      <button className="link-button" type="button" onClick={() => { setIsRegistering((value) => !value); setError(""); }}>
        {isRegistering ? "Ya tengo una cuenta" : "Crear una cuenta"}
      </button>
    </form>
  );
}