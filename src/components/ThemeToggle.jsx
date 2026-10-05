import { useTheme } from "../theme/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "light" ? "oscuro" : "claro";

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      aria-label={`Cambiar a modo ${nextTheme}`}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}
    >
      <span className="theme-toggle-icon" aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
      <span>Modo {theme === "light" ? "oscuro" : "claro"}</span>
    </button>
  );
}
