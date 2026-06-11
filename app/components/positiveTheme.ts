import type { CSSProperties } from "react";

export const positiveText = "#4a3500";
export const positiveHeading = "#3f2a00";
export const positiveMuted = "#6b5b20";
export const positiveBorderColor = "rgba(184,134,11,0.22)";
export const positiveBorder = `1px solid ${positiveBorderColor}`;
export const positiveShadow = "0 20px 44px rgba(120,83,13,0.16)";
export const positiveInset =
  "inset 0 1px 0 rgba(255,255,255,0.88), 0 20px 44px rgba(120,83,13,0.16)";

export const positivePage: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,255,255,0.96) 0%, rgba(255,248,220,0.92) 28%, rgba(245,224,148,0.82) 65%, rgba(214,188,95,0.78) 100%)",
};

export const positiveHeroCard: CSSProperties = {
  background:
    "linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,244,202,0.92))",
  border: positiveBorder,
  boxShadow: positiveInset,
};

export const positivePanel: CSSProperties = {
  background:
    "linear-gradient(145deg,rgba(255,255,255,0.95),rgba(255,248,221,0.90))",
  border: positiveBorder,
  boxShadow: positiveInset,
};

export const positivePanelSoft: CSSProperties = {
  background: "rgba(255,255,255,0.82)",
  border: positiveBorder,
  boxShadow: positiveShadow,
};

export const positiveTableHead: CSSProperties = {
  background: "linear-gradient(90deg,#f7ebbc,#edd58a)",
  color: positiveHeading,
};

export const positiveInput: CSSProperties = {
  border: positiveBorder,
  background: "rgba(255,255,255,0.88)",
  color: positiveText,
  boxShadow: "inset 0 2px 8px rgba(120,83,13,0.05)",
};

export const positiveInputStrong: CSSProperties = {
  border: positiveBorder,
  background: "linear-gradient(145deg,#ffffff,#fffdf1)",
  color: positiveText,
  boxShadow: "inset 0 2px 8px rgba(120,83,13,0.05)",
};

const actionButtonBase: CSSProperties = {
  border: "none",
  borderRadius: 14,
  fontWeight: 900,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(120,83,13,0.14)",
};

export const goldButton: CSSProperties = {
  ...actionButtonBase,
  background: "linear-gradient(135deg,#8b5a00,#d4af37,#facc15)",
  color: "#fffdf3",
};

export const paleButton: CSSProperties = {
  ...actionButtonBase,
  background: "linear-gradient(135deg,#fff9e4,#f3df9c)",
  color: positiveHeading,
  border: positiveBorder,
};

export const neutralButton: CSSProperties = {
  ...actionButtonBase,
  background: "linear-gradient(135deg,#b45309,#f59e0b)",
  color: "white",
};

export const successButton: CSSProperties = {
  ...actionButtonBase,
  background: "linear-gradient(135deg,#15803d,#22c55e)",
  color: "white",
};

export const infoButton: CSSProperties = {
  ...actionButtonBase,
  background: "linear-gradient(135deg,#2563eb,#60a5fa)",
  color: "white",
};

export const dangerButton: CSSProperties = {
  ...actionButtonBase,
  background: "linear-gradient(135deg,#dc2626,#f87171)",
  color: "white",
};
