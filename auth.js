/**
 * Clave utilizada para identificar una sesion autenticada en sessionStorage.
 *
 * La sesion pertenece a la pestana actual y se elimina al cerrar sesion o
 * cuando se limpia el almacenamiento de la pestana.
 *
 * @constant {string}
 */
const SESSION_KEY = "examen-authenticated";

/**
 * Comprueba si existe una sesion activa en la pestana actual.
 *
 * @returns {boolean} true cuando el valor almacenado indica una sesion activa.
 */
function hasActiveSession() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

/**
 * Valida las credenciales recibidas e inicia la sesion si son correctas.
 *
 * La funcion depende de la variable global AUTH_CREDENTIALS, que debe estar
 * definida antes de cargar este archivo. Al autenticarse correctamente solo
 * se guarda un indicador booleano en sessionStorage; no se almacena la
 * contrasena.
 *
 * @param {string} username Nombre de usuario que se desea validar.
 * @param {string} password Contrasena que se desea validar.
 * @returns {boolean} true si las credenciales coinciden; en caso contrario,
 * false.
 */
function startSession(username, password) {
  const validCredentials =
    username === AUTH_CREDENTIALS.username &&
    password === AUTH_CREDENTIALS.password;

  if (validCredentials) {
    sessionStorage.setItem(SESSION_KEY, "true");
  }

  return validCredentials;
}

/**
 * Elimina el indicador de sesion de la pestana actual.
 *
 * No redirige ni modifica la interfaz; la navegacion posterior, si se
 * necesita, debe realizarla la funcion que invoque este metodo.
 *
 * @returns {void}
 */
function endSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Cierra la sesion y reemplaza la pagina actual por la pantalla de login.
 *
 * Se utiliza replace() para evitar que la pagina protegida quede como entrada
 * inmediata en el historial del navegador.
 *
 * @returns {void}
 */
function signOut() {
  endSession();
  window.location.replace("login.html");
}

/**
 * Exige una sesion activa para continuar en la pagina actual.
 *
 * Si no existe una sesion valida, reemplaza la URL actual por la pantalla de
 * login. La funcion no devuelve un valor y no bloquea por si misma el acceso a
 * recursos del servidor.
 *
 * @returns {void}
 */
function requireSession() {
  if (!hasActiveSession()) {
    window.location.replace("login.html");
  }
}