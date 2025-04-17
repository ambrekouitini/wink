import React, { createContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDark: boolean | null;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('themePreference');
        if (storedTheme !== null) {
          setIsDark(storedTheme === 'dark');
        } else {
          setIsDark(systemColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setIsDark(systemColorScheme === 'dark');
      }
    };

    loadThemePreference();
  }, [systemColorScheme]);

  useEffect(() => {
    if (isDark === null) {
      setIsDark(systemColorScheme === 'dark');
    }
  }, [systemColorScheme, isDark]);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};