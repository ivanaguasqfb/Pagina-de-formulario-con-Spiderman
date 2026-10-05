import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "./authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    authService.getCurrentSession().then((session) => {
      setUser(session);
    }).catch((error) => {
      setAuthError(error.message);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  async function signIn(username, password) {
    const session = await authService.login(username, password);
    setUser(session);
  }

  async function signUp(username, password) {
    const session = await authService.register(username, password);
    setUser(session);
  }

  async function signOut() {
    await authService.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}