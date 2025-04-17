import { Stack } from 'expo-router';
import { ThemeProvider, ThemeContext } from '../context/ThemeContext';
import { useContext } from 'react';

export const unstable_settings = {
  initialRouteName: 'index',
};

export const linking = {
  prefixes: ['planify://', 'https://planify.app'],
  config: {
    screens: {
      index: '',
      home: 'home',
      'event/create': 'event/create',
      'event/[id]': 'event/:id',
    },
  },
};

export default function Layout() {
  const { isDark } = useContext(ThemeContext) || { isDark: false };

  return (
    <ThemeProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          },
          headerTintColor: isDark ? '#FFFFFF' : '#000000',
          contentStyle: {
            backgroundColor: isDark ? '#121212' : '#F5F5F5',
          },
        }}
      />
    </ThemeProvider>
  );
}
