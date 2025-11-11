export type Palette = {
  background: string;
  surface: string;
  elevatedSurface: string;
  overlay: string;
  primary: string;
  primaryAlt: string;
  accentCyan: string;
  accentPurple: string;
  accentBlue: string;
  softPink: string;
  brandOrange: string;
  brandBlue: string;
  brandSilver: string;
  buttonGradientStart: string;
  buttonGradientEnd: string;
  buttonGlow: string;
  cardGradientStart: string;
  cardGradientEnd: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
};

export type ComponentTokens = {
  card: {
    background: string;
    border: string;
    borderWidth: number;
    shadowColor: string;
    gradient: [string, string];
    overlay: string;
  };
  glassCard: {
    gradient: [string, string];
    background: string;
    border: string;
    veil: string;
    innerBorder: string;
  };
  input: {
    gradient: [string, string];
    background: string;
    iconBackground: string;
    focusGlow: string;
    border: string;
    placeholder: string;
  };
  button: {
    primaryGradient: [string, string];
    primaryGlow: string;
    primaryHighlight: string;
    textPrimary: string;
    textGhost: string;
    textGhostDisabled: string;
    ghostGradient: [string, string];
  };
  icon: {
    primary: string;
    accent: string;
    muted: string;
  };
  nav: {
    background: string;
    border: string;
    indicator: string;
    iconActive: string;
    iconInactive: string;
    label: string;
  };
  status: {
    successBackground: string;
    warningBackground: string;
  };
};

export type ThemeDefinition = {
  name: string;
  palette: Palette;
  components: ComponentTokens;
};

const pioneroPalette: Palette = {
  background: "#210305",
  surface: "#2F060A",
  elevatedSurface: "#3C0B12",
  overlay: "rgba(25, 4, 5, 0.72)",
  primary: "#DD141D",
  primaryAlt: "#F0442C",
  accentCyan: "#66F4FF",
  accentPurple: "#8F6BFF",
  accentBlue: "#1B9CFF",
  softPink: "#ffc3c3ff",
  brandOrange: "#F8991D",
  brandBlue: "#0082C4",
  brandSilver: "#D9D6CE",
  buttonGradientStart: "#F1371C",
  buttonGradientEnd: "#FFC125",
  buttonGlow: "rgba(240, 67, 44, 0.46)",
  cardGradientStart: "rgba(255,255,255,0.16)",
  cardGradientEnd: "rgba(94, 12, 16, 0.6)",
  textPrimary: "#FFF6F5",
  textSecondary: "rgba(255, 240, 238, 0.78)",
  textMuted: "rgba(255, 240, 238, 0.52)",
  success: "#2FD67B",
  warning: "#FFB648",
  danger: "#F0442C",
  border: "rgba(255, 255, 255, 0.12)",
};

const pioneroComponents: ComponentTokens = {
  card: {
    background: "rgba(86, 86, 86, 0.48)",
    border: "rgba(255, 255, 255, 0.66)",
    borderWidth: 1,
    shadowColor: "rgba(0, 0, 0, 0.35)",
    gradient: ["rgba(255,255,255,0.08)", "rgba(60, 8, 12, 0.38)"],
    overlay: "rgba(255, 220, 216, 0.12)",
  },
  glassCard: {
    gradient: ["rgba(194, 61, 56, 0.78)", "rgba(122, 24, 28, 0.58)"],
    background: "rgba(86, 86, 86, 0.48)",
    border: "rgba(252, 252, 252, 0.3)",
    veil: "rgba(255, 220, 216, 0.18)",
    innerBorder: "rgba(255, 211, 204, 0.12)",
  },
  input: {
    gradient: ["rgba(221, 20, 30, 0)", "rgba(72, 10, 18, 0)"],
    background: "rgba(45, 8, 12, 0.84)",
    iconBackground: "rgba(255, 255, 255, 0.08)",
    focusGlow: "rgba(255, 216, 211, 1)",
    border: "rgba(255, 255, 255, 0.88)",
    placeholder: "rgba(255, 240, 238, 0.5)",
  },
  button: {
    primaryGradient: ["#DD141D", "#ff3e4897"],
    primaryGlow: "rgba(240, 67, 44, 0.46)",
    primaryHighlight: "rgba(255, 255, 255, 0.2)",
    textPrimary: "#FFF6F5",
    textGhost: "rgba(255, 240, 238, 0.78)",
    textGhostDisabled: "rgba(255, 240, 238, 0.4)",
    ghostGradient: ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.06)"],
  },
  icon: {
    primary: "#FFF6F5",
    accent: "#66F4FF",
    muted: "rgba(255, 240, 238, 0.5)",
  },
  nav: {
    background: "rgba(15, 2, 4, 0.85)",
    border: "rgba(255, 255, 255, 0.08)",
    indicator: "#F0442C",
    iconActive: "#FFF6F5",
    iconInactive: "rgba(255, 240, 238, 0.5)",
    label: "#FFF6F5",
  },
  status: {
    successBackground: "rgba(24, 255, 178, 0.18)",
    warningBackground: "rgba(255, 200, 87, 0.18)",
  },
};

const auroraPalette: Palette = {
  background: "#000000",
  surface: "#0A0A0A",
  elevatedSurface: "#151515",
  overlay: "rgba(0, 0, 0, 0.85)",
  primary: "#00a094",
  primaryAlt: "#00c9b8",
  accentCyan: "#00F0FF",
  accentPurple: "#8F6BFF",
  accentBlue: "#1B9CFF",
  softPink: "#ffc3c3ff",
  brandOrange: "#F8991D",
  brandBlue: "#0082C4",
  brandSilver: "#D9D6CE",
  buttonGradientStart: "#00a094",
  buttonGradientEnd: "#00c9b8",
  buttonGlow: "rgba(0, 160, 148, 0.5)",
  cardGradientStart: "rgba(255,255,255,0.08)",
  cardGradientEnd: "rgba(0, 160, 148, 0.15)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.78)",
  textMuted: "rgba(255, 255, 255, 0.52)",
  success: "#2FD67B",
  warning: "#FFB648",
  danger: "#F0442C",
  border: "rgba(255, 255, 255, 0.12)",
};

const auroraComponents: ComponentTokens = {
  card: {
    background: "rgba(20, 20, 20, 0.60)",
    border: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    shadowColor: "rgba(0, 160, 148, 0.25)",
    gradient: ["rgba(255,255,255,0.06)", "rgba(0, 160, 148, 0.12)"],
    overlay: "rgba(255, 255, 255, 0.04)",
  },
  glassCard: {
    gradient: ["rgba(0, 160, 148, 0.25)", "rgba(0, 201, 184, 0.15)"],
    background: "rgba(20, 20, 20, 0.60)",
    border: "rgba(255, 255, 255, 0.18)",
    veil: "rgba(255, 255, 255, 0.06)",
    innerBorder: "rgba(0, 240, 255, 0.08)",
  },
  input: {
    gradient: ["rgba(0, 160, 148, 0)", "rgba(0, 201, 184, 0)"],
    background: "rgba(10, 10, 10, 0.90)",
    iconBackground: "rgba(0, 160, 148, 0.15)",
    focusGlow: "rgba(0, 240, 255, 1)",
    border: "rgba(0, 160, 148, 0.8)",
    placeholder: "rgba(255, 255, 255, 0.4)",
  },
  button: {
    primaryGradient: ["#00a094", "#00c9b8"],
    primaryGlow: "rgba(0, 160, 148, 0.5)",
    primaryHighlight: "rgba(255, 255, 255, 0.25)",
    textPrimary: "#FFFFFF",
    textGhost: "rgba(255, 255, 255, 0.85)",
    textGhostDisabled: "rgba(255, 255, 255, 0.35)",
    ghostGradient: ["rgba(0, 160, 148, 0.15)", "rgba(0, 201, 184, 0.08)"],
  },
  icon: {
    primary: "#FFFFFF",
    accent: "#00F0FF",
    muted: "rgba(255, 255, 255, 0.5)",
  },
  nav: {
    background: "rgba(0, 0, 0, 0.95)",
    border: "rgba(255, 255, 255, 0.08)",
    indicator: "#00a094",
    iconActive: "#FFFFFF",
    iconInactive: "rgba(255, 255, 255, 0.5)",
    label: "#FFFFFF",
  },
  status: {
    successBackground: "rgba(47, 214, 123, 0.18)",
    warningBackground: "rgba(255, 182, 72, 0.18)",
  },
};

export const themes = {
  pionero: {
    name: "Pionero",
    palette: pioneroPalette,
    components: pioneroComponents,
  },
  aurora: {
    name: "Aurora",
    palette: auroraPalette,
    components: auroraComponents,
  },
} as const;

// Temporary compatibility export while legacy screens transition to the themed API.
export const palette = themes.pionero.palette;

export type ThemeName = keyof typeof themes;
export type ThemeDefinitions = typeof themes;
