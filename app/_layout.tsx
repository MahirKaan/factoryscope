// app/_layout.tsx
import { ThemeProvider } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import 'react-native-gesture-handler'; // ilk import şart
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
