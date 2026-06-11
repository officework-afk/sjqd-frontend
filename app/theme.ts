export const DEFAULT_THEME = {
  bg: "#f6e7a7",
  card: "#fff8dd",
  panel: "rgba(255,255,255,0.82)",
  btn: "#d97706",
  btnText: "#ffffff",
  text: "#4a3500",
  darkText: "#3b2a00",
  border: "rgba(184,134,11,0.22)",
};

export function applyTheme(theme: any = {}) {
  const t = { ...DEFAULT_THEME, ...theme };

  document.documentElement.style.setProperty("--theme-bg", t.bg || t.backgroundColor);
  document.documentElement.style.setProperty("--theme-card", t.card || t.cardColor);
  document.documentElement.style.setProperty("--theme-panel", t.panel);
  document.documentElement.style.setProperty("--theme-btn", t.btn || t.buttonColor);
  document.documentElement.style.setProperty("--theme-btn-text", t.btnText || t.buttonTextColor);
  document.documentElement.style.setProperty("--theme-text", t.text);
  document.documentElement.style.setProperty("--theme-dark-text", t.darkText);
  document.documentElement.style.setProperty("--theme-border", t.border);
}
