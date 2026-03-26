import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { colors } from '@/lib/theme';

export default function GameScreen() {
  const { gameType } = useLocalSearchParams<{ gameType: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Game',
          headerTitleStyle: {
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 17,
          },
          headerTintColor: colors.text.primary,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <SafeAreaView
        edges={['bottom']}
        style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.text.secondary,
          }}
        >
          Game: {gameType}
        </Text>
      </SafeAreaView>
    </>
  );
}
