import { View, Text } from 'react-native';
import { Flame, Heart, Zap } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type Props = {
  streak?: number;
  hearts?: number;
  xp?: number;
  level?: number;
};

export function GamificationHeader({
  streak = 0,
  hearts = 5,
  xp = 0,
  level = 1,
}: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.bg.base,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
      }}
    >
      {/* Streak */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Flame size={18} color={streak > 0 ? '#f97316' : colors.text.tertiary} />
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.text.primary,
          }}
        >
          {streak}
        </Text>
      </View>

      {/* Hearts */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Heart size={18} color="#ef4444" fill={hearts > 0 ? '#ef4444' : 'none'} />
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.text.primary,
          }}
        >
          {hearts}
        </Text>
      </View>

      {/* XP + Level */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Zap size={18} color={colors.accent[500]} />
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: colors.text.primary,
          }}
        >
          {xp} XP
        </Text>
        <View
          style={{
            backgroundColor: colors.accent[400],
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginLeft: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: '#1a1a2e',
            }}
          >
            Lv.{level}
          </Text>
        </View>
      </View>
    </View>
  );
}
