export async function apiRequest(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      credentials: "same-origin",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Inicia la aplicación con `npm run dev:all` e inténtalo de nuevo.");
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || "No fue posible completar la solicitud.");
    error.status = response.status;
    throw error;
  }
  return payload;
}
