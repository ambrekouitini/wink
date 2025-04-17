import { Stack } from 'expo-router';
import { useContext } from 'react';
import { ThemeProvider, ThemeContext } from '../context/ThemeContext';

function StackNavigator() {
  const { isDark } = useContext(ThemeContext) || { isDark: false };
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        },
        headerTintColor: isDark ? '#FFFFFF' : '#000000',
        contentStyle: {
          backgroundColor: isDark ? '#121212' : '#F5F5F5',
        }
      }}
    >
      <Stack.Screen name="index" options={{ 
        headerShown: false 
      }} />
      <Stack.Screen name="home" options={{ 
        title: 'Planify',
        headerBackVisible: false,
      }} />
      <Stack.Screen name="event/create" options={{ 
        title: 'Créer un événement',
        headerShown: false
      }} />
      <Stack.Screen name="event/[id]" options={{ 
        title: 'Détails de l\'événement',
      }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <StackNavigator />
    </ThemeProvider>
  );
}