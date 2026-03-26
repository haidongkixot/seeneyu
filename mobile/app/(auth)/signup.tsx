import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/Button';
import { colors } from '@/lib/theme';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await apiPost('/api/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
      });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#ffffff',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'PlusJakartaSans_700Bold',
            color: colors.text.primary,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Account Created
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'PlusJakartaSans_400Regular',
            color: colors.text.secondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 32,
          }}
        >
          Your account is pending approval. You will be notified when it is
          activated.
        </Text>
        <Link href="/(auth)/login">
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.accent[600],
            }}
          >
            Back to Sign In
          </Text>
        </Link>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        {/* Title */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text
            style={{
              fontSize: 28,
              fontFamily: 'PlusJakartaSans_700Bold',
              color: colors.text.primary,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans_400Regular',
              color: colors.text.secondary,
              marginTop: 8,
            }}
          >
            Join seeneyu and start learning
          </Text>
        </View>

        {/* Name */}
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'PlusJakartaSans_500Medium',
            color: colors.text.primary,
            marginBottom: 6,
          }}
        >
          Name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.text.tertiary}
          autoComplete="name"
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
          placeholder="Min. 6 characters"
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry
          autoComplete="new-password"
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

        <Button title="Create Account" onPress={handleSignup} loading={loading} />

        {/* Login Link */}
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
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/login">
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'PlusJakartaSans_600SemiBold',
                color: colors.accent[600],
              }}
            >
              Sign In
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
