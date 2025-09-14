import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Theme {
  background: string;
  text: string;
  textSecondary: string;
  surface: string;
  primary: string;
  error: string;
}

interface ThemeContextProps {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const lightTheme: Theme = {
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  surface: '#F3F3F3',
  primary: '#29B6F6',
  error: '#E53935',
};

const darkTheme: Theme = {
  background: '#121212',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  surface: '#1E1E1E',
  primary: '#29B6F6',
  error: '#E53935',
};

// ✅ إنشاء Context
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// ✅ Provider
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ✅ Hook لتسهيل الوصول للكونتكست
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
