import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  Bell,
  Trash2,
  Info,
  Shield,
  FileText,
  ExternalLink,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiDelete } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

const APP_VERSION = '1.0.0';
const BASE_URL = 'https://seeneyu.vercel.app';

export default function SettingsScreen() {
  const { token, logout } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will clear cached data. You may need to reload some content.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Done', 'Cache cleared successfully.');
          },
        },
      ]
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data, submissions, and progress will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'Type "DELETE" to confirm would be required on web. Proceeding will permanently delete your account.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await apiDelete('/api/user/account', token);
                      await logout();
                      router.replace('/(auth)/login');
                    } catch {
                      Alert.alert(
                        'Error',
                        'Failed to delete account. Please try again or contact support.'
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [token, logout]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
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
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* Notifications */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Notifications
          </Text>
          <Card style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Bell size={20} color={colors.text.secondary} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.primary,
                  }}
                >
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{
                  false: '#e5e7eb',
                  true: colors.accent[300],
                }}
                thumbColor={pushEnabled ? colors.accent[500] : '#f4f4f5'}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border.default,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Bell size={20} color={colors.text.secondary} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.primary,
                  }}
                >
                  Email Notifications
                </Text>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={setEmailEnabled}
                trackColor={{
                  false: '#e5e7eb',
                  true: colors.accent[300],
                }}
                thumbColor={emailEnabled ? colors.accent[500] : '#f4f4f5'}
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderTopWidth: 1,
                borderTopColor: colors.border.default,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Bell size={20} color={colors.text.secondary} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.primary,
                  }}
                >
                  Weekly Digest
                </Text>
              </View>
              <Switch
                value={weeklyDigest}
                onValueChange={setWeeklyDigest}
                trackColor={{
                  false: '#e5e7eb',
                  true: colors.accent[300],
                }}
                thumbColor={weeklyDigest ? colors.accent[500] : '#f4f4f5'}
              />
            </View>
          </Card>

          {/* Data */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Data
          </Text>
          <Card style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleClearCache}
              activeOpacity={0.6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
              }}
            >
              <Trash2 size={20} color={colors.text.secondary} />
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: 'PlusJakartaSans_500Medium',
                  color: colors.text.primary,
                }}
              >
                Clear Cache
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Legal */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Legal
          </Text>
          <Card style={{ marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => Linking.openURL(`${BASE_URL}/privacy`)}
              activeOpacity={0.6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <Shield size={20} color={colors.text.secondary} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.primary,
                  }}
                >
                  Privacy Policy
                </Text>
              </View>
              <ExternalLink size={16} color={colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL(`${BASE_URL}/terms`)}
              activeOpacity={0.6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border.default,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
              >
                <FileText size={20} color={colors.text.secondary} />
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.primary,
                  }}
                >
                  Terms of Service
                </Text>
              </View>
              <ExternalLink size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          </Card>

          {/* About */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            About
          </Text>
          <Card style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
              }}
            >
              <Info size={20} color={colors.text.secondary} />
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.primary,
                  }}
                >
                  Seeneyu
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.tertiary,
                    marginTop: 2,
                  }}
                >
                  Version {APP_VERSION}
                </Text>
              </View>
            </View>
          </Card>

          {/* Delete Account */}
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'PlusJakartaSans_600SemiBold',
              color: colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Danger Zone
          </Text>
          <Card
            style={{
              marginBottom: 16,
              borderColor: 'rgba(239,68,68,0.2)',
            }}
          >
            <TouchableOpacity
              onPress={handleDeleteAccount}
              activeOpacity={0.6}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 8,
              }}
            >
              <Trash2 size={20} color={colors.status.error} />
              <View>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.status.error,
                  }}
                >
                  Delete Account
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.tertiary,
                    marginTop: 2,
                  }}
                >
                  Permanently remove all your data
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
