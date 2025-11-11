import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { themes, ThemeDefinition, ThemeName } from "./colors";

export type Theme = ThemeDefinition & {
  radii: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  spacing: (value: number) => number;
  typography: {
    family: string;
    headings: string;
  };
};

type ThemeContextValue = {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  availableThemes: ThemeName[];
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [themeName, setThemeName] = useState<ThemeName>("pionero");

  const theme = useMemo<Theme>(() => {
    const definition = themes[themeName];
    return {
      ...definition,
      radii: {
        xs: 6,
        sm: 10,
        md: 14,
        lg: 20,
        xl: 32,
        full: 999,
      },
      spacing: (v: number) => v * 8,
      typography: {
        family: "System",
        headings: "System",
      },
    };
  }, [themeName]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeName,
      setTheme: setThemeName,
      availableThemes: Object.keys(themes) as ThemeName[],
    }),
    [theme, themeName],
  );

  return (
    <ThemeContext.Provider value={value}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
};
