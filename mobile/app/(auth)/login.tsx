import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/Button';
import { colors } from '@/lib/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        {/* Logo / Title */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 32,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.text.primary,
            }}
          >
            seeneyu
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.secondary,
              marginTop: 8,
            }}
          >
            Body language coaching
          </Text>
        </View>

        {/* Email */}
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.text.primary,
            marginBottom: 6,
          }}
        >
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          style={{
            height: 48,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: 12,
            paddingHorizontal: 16,
            fontSize: 16,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.primary,
            backgroundColor: '#fafafa',
            marginBottom: 16,
          }}
        />

        {/* Password */}
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.text.primary,
            marginBottom: 6,
          }}
        >
          Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry
          autoComplete="password"
          style={{
            height: 48,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.12)',
            borderRadius: 12,
            paddingHorizontal: 16,
            fontSize: 16,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.primary,
            backgroundColor: '#fafafa',
            marginBottom: 24,
          }}
        />

        {/* Login Button */}
        <Button title="Sign In" onPress={handleLogin} loading={loading} />

        {/* Signup Link */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 24,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.secondary,
            }}
          >
            Don't have an account?{' '}
          </Text>
          <Link href="/(auth)/signup">
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.accent[600],
              }}
            >
              Sign Up
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
