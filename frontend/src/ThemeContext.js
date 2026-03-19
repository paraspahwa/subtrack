import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const THEMES = {
  indigo: {
    label: "Indigo",
    swatch: "#6366F1",
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    primaryLight: "#818CF8",
    primaryBg: "rgba(99,102,241,0.08)",
    primaryBg2: "rgba(99,102,241,0.14)",
    heroGradient: ["#4F46E5", "#6366F1"],
    proGradient: ["#4F46E5", "#7C3AED"],
    border: "rgba(99,102,241,0.18)",
    accent: "#EC4899",
  },
  teal: {
    label: "Teal",
    swatch: "#0d5c57",
    primary: "#0d5c57",
    primaryDark: "#0a4844",
    primaryLight: "#178077",
    primaryBg: "rgba(13,92,87,0.08)",
    primaryBg2: "rgba(13,92,87,0.14)",
    heroGradient: ["#0d5c57", "#0a4844"],
    proGradient: ["#0f4b47", "#125e59"],
    border: "rgba(13,92,87,0.18)",
    accent: "#EC4899",
  },
  ocean: {
    label: "Ocean",
    swatch: "#1d4ed8",
    primary: "#1d4ed8",
    primaryDark: "#1e40af",
    primaryLight: "#3b82f6",
    primaryBg: "rgba(29,78,216,0.08)",
    primaryBg2: "rgba(29,78,216,0.14)",
    heroGradient: ["#1d4ed8", "#1e3a8a"],
    proGradient: ["#1e3a8a", "#1d4ed8"],
    border: "rgba(29,78,216,0.18)",
    accent: "#EC4899",
  },
  violet: {
    label: "Violet",
    swatch: "#7c3aed",
    primary: "#7c3aed",
    primaryDark: "#6d28d9",
    primaryLight: "#8b5cf6",
    primaryBg: "rgba(124,58,237,0.08)",
    primaryBg2: "rgba(124,58,237,0.14)",
    heroGradient: ["#7c3aed", "#5b21b6"],
    proGradient: ["#5b21b6", "#6d28d9"],
    border: "rgba(124,58,237,0.18)",
    accent: "#EC4899",
  },
  rose: {
    label: "Rose",
    swatch: "#e11d48",
    primary: "#e11d48",
    primaryDark: "#be123c",
    primaryLight: "#f43f5e",
    primaryBg: "rgba(225,29,72,0.08)",
    primaryBg2: "rgba(225,29,72,0.14)",
    heroGradient: ["#e11d48", "#9f1239"],
    proGradient: ["#9f1239", "#be123c"],
    border: "rgba(225,29,72,0.18)",
    accent: "#EC4899",
  },
  amber: {
    label: "Amber",
    swatch: "#d97706",
    primary: "#d97706",
    primaryDark: "#b45309",
    primaryLight: "#f59e0b",
    primaryBg: "rgba(217,119,6,0.08)",
    primaryBg2: "rgba(217,119,6,0.14)",
    heroGradient: ["#d97706", "#92400e"],
    proGradient: ["#92400e", "#b45309"],
    border: "rgba(217,119,6,0.18)",
    accent: "#EC4899",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState("indigo");

  useEffect(() => {
    AsyncStorage.getItem("st_theme").then((val) => {
      if (val && THEMES[val]) setThemeKey(val);
    }).catch(() => {});
  }, []);

  const setTheme = async (key) => {
    if (!THEMES[key]) return;
    setThemeKey(key);
    await AsyncStorage.setItem("st_theme", key).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ themeKey, theme: THEMES[themeKey], themes: THEMES, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
