import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '@/lib/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
};

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle }> =
  {
    primary: {
      container: {
        backgroundColor: colors.accent[400],
        borderWidth: 0,
      },
      text: {
        color: '#1a1a2e',
        fontFamily: 'PlusJakartaSans_600SemiBold',
      },
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.accent[400],
      },
      text: {
        color: colors.accent[600],
        fontFamily: 'PlusJakartaSans_600SemiBold',
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      text: {
        color: colors.text.secondary,
        fontFamily: 'PlusJakartaSans_500Medium',
      },
    },
  };

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const styles = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          height: 48,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          opacity: disabled ? 0.5 : 1,
        },
        styles.container,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#1a1a2e' : colors.accent[500]}
        />
      ) : (
        <Text style={[{ fontSize: 16 }, styles.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
