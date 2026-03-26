import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

export default function GamificationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: colors.text.primary,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: {
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 17,
        },
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="badges" options={{ title: 'Badges' }} />
      <Stack.Screen name="leaderboard" options={{ title: 'Leaderboard' }} />
      <Stack.Screen name="quests" options={{ title: 'Daily Quests' }} />
    </Stack>
  );
}
