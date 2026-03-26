import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider } from '@/lib/auth-context';

import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#ffffff' },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(auth)"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="gamification"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="arcade"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="games"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="lesson/[courseSlug]/index"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="lesson/[courseSlug]/[lessonSlug]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="clip/[clipId]/index"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="clip/[clipId]/record"
            options={{ animation: 'slide_from_bottom' }}
          />
          {/* Gamification group (has its own _layout.tsx) */}
          {/* Profile routes */}
          <Stack.Screen
            name="profile/edit"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="profile/submissions/index"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="profile/submissions/[id]"
            options={{ animation: 'slide_from_right' }}
          />
          {/* Pricing */}
          <Stack.Screen
            name="pricing/index"
            options={{ animation: 'slide_from_right' }}
          />
          {/* Settings */}
          <Stack.Screen
            name="settings/index"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
