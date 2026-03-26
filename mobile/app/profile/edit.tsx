import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { apiGet, apiPatch } from '@/lib/api';
import { Button } from '@/components/Button';
import { colors } from '@/lib/theme';

type ProfileData = {
  name?: string;
  email?: string;
  bio?: string;
  phone?: string;
  location?: string;
};

export default function EditProfileScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiGet<ProfileData>('/api/user/profile', token);
      if (data) {
        setName(data.name || '');
        setEmail(data.email || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
      }
    } catch {
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    try {
      await apiPatch('/api/user/profile', { name, bio, phone, location }, token);
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.primary,
    backgroundColor: colors.bg.surface,
  } as const;

  const labelStyle = {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.secondary,
    marginBottom: 6,
    marginTop: 16,
  } as const;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Edit Profile',
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
        style={{ flex: 1, backgroundColor: '#ffffff' }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {loading ? (
            <ActivityIndicator
              color={colors.accent[400]}
              style={{ marginTop: 48 }}
            />
          ) : (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={labelStyle}>Name</Text>
              <TextInput
                style={inputStyle}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={labelStyle}>Email</Text>
              <TextInput
                style={[
                  inputStyle,
                  {
                    backgroundColor: '#f0f0f0',
                    color: colors.text.tertiary,
                  },
                ]}
                value={email}
                editable={false}
                placeholder="Email"
                placeholderTextColor={colors.text.tertiary}
              />

              <Text style={labelStyle}>Bio</Text>
              <TextInput
                style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.text.tertiary}
                multiline
              />

              <Text style={labelStyle}>Phone</Text>
              <TextInput
                style={inputStyle}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
              />

              <Text style={labelStyle}>Location</Text>
              <TextInput
                style={inputStyle}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                placeholderTextColor={colors.text.tertiary}
              />

              <View style={{ marginTop: 24 }}>
                <Button
                  title="Save Changes"
                  onPress={handleSave}
                  loading={saving}
                />
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
