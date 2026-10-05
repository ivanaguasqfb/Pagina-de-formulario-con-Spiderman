import { apiRequest } from "../services/api";

export async function login(username, password) {
  const { user } = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
  return user;
}

export async function register(username, password) {
  const { user } = await apiRequest("/api/auth/register", {
    method: "POST",
    body: { username, password },
  });
  return user;
}

export async function getCurrentSession() {
  try {
    const { user } = await apiRequest("/api/auth/me");
    return user;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function logout() {
  await apiRequest("/api/auth/logout", { method: "POST" });
}