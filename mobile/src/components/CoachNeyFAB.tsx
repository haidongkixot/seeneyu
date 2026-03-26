import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/lib/theme';

type Props = {
  onPress: () => void;
};

export function CoachNeyFAB({ onPress }: Props) {
  const { user } = useAuth();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle idle pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Only render when authenticated
  if (!user) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        transform: [{ scale: pulseAnim }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent[400],
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <MessageCircle size={24} color="#1a1a2e" />
      </TouchableOpacity>
    </Animated.View>
  );
}
