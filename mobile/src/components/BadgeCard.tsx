import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { colors } from '@/lib/theme';

export type Badge = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'consistency' | 'mastery' | 'social' | 'volume' | 'special';
  earned: boolean;
  earnedAt?: string;
};

const categoryColors: Record<Badge['category'], string> = {
  consistency: '#3b82f6',
  mastery: '#8b5cf6',
  social: '#ec4899',
  volume: '#22c55e',
  special: '#f59e0b',
};

type Props = {
  badge: Badge;
  onPress?: (badge: Badge) => void;
};

export function BadgeCard({ badge, onPress }: Props) {
  const accentColor = categoryColors[badge.category];

  return (
    <TouchableOpacity
      onPress={() => onPress?.(badge)}
      activeOpacity={0.7}
      style={{
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: badge.earned ? accentColor + '30' : 'rgba(0,0,0,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
        opacity: badge.earned ? 1 : 0.6,
      }}
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: badge.earned
              ? accentColor + '15'
              : colors.bg.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {badge.earned ? (
            <Text style={{ fontSize: 28 }}>{badge.emoji}</Text>
          ) : (
            <Lock size={24} color={colors.text.tertiary} />
          )}
        </View>

        <Text
          style={{
            fontSize: 13,
            fontFamily: 'PlusJakartaSans_600SemiBold',
            color: badge.earned ? colors.text.primary : colors.text.tertiary,
            textAlign: 'center',
          }}
          numberOfLines={2}
        >
          {badge.name}
        </Text>

        <View
          style={{
            backgroundColor: accentColor + '20',
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: accentColor,
              textTransform: 'capitalize',
            }}
          >
            {badge.category}
          </Text>
        </View>

        {badge.earned && badge.earnedAt && (
          <Text
            style={{
              fontSize: 10,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.tertiary,
            }}
          >
            {new Date(badge.earnedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
