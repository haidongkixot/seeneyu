import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/theme';

const EMOTIONS = [
  { key: 'happy', label: 'Happy', emoji: '\u{1F60A}' },
  { key: 'sad', label: 'Sad', emoji: '\u{1F622}' },
  { key: 'angry', label: 'Angry', emoji: '\u{1F621}' },
  { key: 'surprised', label: 'Surprised', emoji: '\u{1F632}' },
  { key: 'fearful', label: 'Fearful', emoji: '\u{1F628}' },
  { key: 'disgusted', label: 'Disgusted', emoji: '\u{1F922}' },
] as const;

type ExpressionGridProps = {
  onSelect: (emotion: string) => void;
  selectedEmotion?: string | null;
  correctEmotion?: string | null;
  disabled?: boolean;
};

function ExpressionGridInner({
  onSelect,
  selectedEmotion,
  correctEmotion,
  disabled,
}: ExpressionGridProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
        paddingHorizontal: 16,
      }}
    >
      {EMOTIONS.map(({ key, label, emoji }) => {
        const isSelected = selectedEmotion === key;
        const isCorrect = correctEmotion === key;
        const isWrong = isSelected && correctEmotion != null && !isCorrect;

        let bgColor = 'rgba(0,0,0,0.04)';
        let borderColor = 'transparent';
        if (isCorrect && correctEmotion != null) {
          bgColor = 'rgba(34,197,94,0.12)';
          borderColor = '#22c55e';
        } else if (isWrong) {
          bgColor = 'rgba(239,68,68,0.12)';
          borderColor = '#ef4444';
        } else if (isSelected) {
          bgColor = 'rgba(251,191,36,0.15)';
          borderColor = colors.accent[400];
        }

        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelect(key)}
            disabled={disabled}
            activeOpacity={0.7}
            style={{
              width: '30%',
              aspectRatio: 1,
              borderRadius: 16,
              backgroundColor: bgColor,
              borderWidth: 2,
              borderColor,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled && !isSelected && !isCorrect ? 0.4 : 1,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 4 }}>{emoji}</Text>
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.text.primary,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const ExpressionGrid = React.memo(ExpressionGridInner);
