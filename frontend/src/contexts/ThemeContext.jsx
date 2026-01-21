import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark',
    background: 'bg-black',
    surface: 'bg-black/40',
    text: 'text-white',
    textMuted: 'text-slate-400',
    border: 'border-white/10',
    accent: 'teal',
    cssVars: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#0a0a0a',
      '--bg-surface': 'rgba(0,0,0,0.4)',
      '--text-primary': '#ffffff',
      '--text-secondary': '#94a3b8',
      '--border-color': 'rgba(255,255,255,0.1)',
      '--accent-color': '#14b8a6',
      '--accent-glow': 'rgba(20,184,166,0.3)',
    }
  },
  light: {
    id: 'light',
    name: 'Light',
    background: 'bg-slate-100',
    surface: 'bg-white/80',
    text: 'text-slate-900',
    textMuted: 'text-slate-600',
    border: 'border-slate-200',
    accent: 'teal',
    cssVars: {
      '--bg-primary': '#f1f5f9',
      '--bg-secondary': '#ffffff',
      '--bg-surface': 'rgba(255,255,255,0.8)',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--border-color': 'rgba(0,0,0,0.1)',
      '--accent-color': '#0d9488',
      '--accent-glow': 'rgba(13,148,136,0.3)',
    }
  },
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    background: 'bg-black',
    surface: 'bg-black/60',
    text: 'text-green-400',
    textMuted: 'text-green-600',
    border: 'border-green-500/20',
    accent: 'green',
    cssVars: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#001100',
      '--bg-surface': 'rgba(0,0,0,0.6)',
      '--text-primary': '#4ade80',
      '--text-secondary': '#16a34a',
      '--border-color': 'rgba(34,197,94,0.2)',
      '--accent-color': '#22c55e',
      '--accent-glow': 'rgba(34,197,94,0.4)',
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('cognitive-oracle-theme');
    return saved || 'dark';
  });
  
  const currentTheme = THEMES[theme] || THEMES.dark;
  
  useEffect(() => {
    localStorage.setItem('cognitive-oracle-theme', theme);
    
    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(currentTheme.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    // Set body class for theme
    document.body.className = `theme-${theme}`;
  }, [theme, currentTheme]);
  
  const toggleTheme = () => {
    setTheme(prev => {
      const themes = Object.keys(THEMES);
      const currentIndex = themes.indexOf(prev);
      return themes[(currentIndex + 1) % themes.length];
    });
  };
  
  const setThemeById = (themeId) => {
    if (THEMES[themeId]) {
      setTheme(themeId);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ 
      theme, 
      currentTheme, 
      setTheme: setThemeById, 
      toggleTheme,
      themes: THEMES 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
