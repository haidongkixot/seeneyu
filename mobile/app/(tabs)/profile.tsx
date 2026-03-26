import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LogOut, Award, Zap, Flame } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors } from '@/lib/theme';

type ProfileData = {
  name?: string;
  email?: string;
  image?: string;
  plan?: string;
};

type GamificationData = {
  xp?: number;
  level?: number;
  streak?: number;
  badges?: { id: string; name: string }[];
};

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchProfile() {
    try {
      const [prof, gam] = await Promise.all([
        apiGet<ProfileData>('/api/user/profile', token).catch(() => null),
        apiGet<GamificationData>('/api/gamification/profile', token).catch(
          () => null
        ),
      ]);
      setProfile(prof);
      setGamification(gam);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, [token]);

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 24,
            fontFamily: 'PlusJakartaSans_700Bold',
            color: colors.text.primary,
          }}
        >
          Profile
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchProfile();
            }}
            tintColor={colors.accent[400]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator
            color={colors.accent[400]}
            style={{ marginTop: 48 }}
          />
        ) : (
          <>
            {/* User Info */}
            <Card style={{ marginBottom: 16, alignItems: 'center' }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: colors.accent[400],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 28,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: '#1a1a2e',
                  }}
                >
                  {(user?.name || user?.email || '?')[0].toUpperCase()}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                {profile?.name || user?.name || 'User'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: 'PlusJakartaSans_400Regular',
                  color: colors.text.secondary,
                  marginTop: 2,
                }}
              >
                {profile?.email || user?.email}
              </Text>
              {profile?.plan && (
                <View
                  style={{
                    marginTop: 8,
                    backgroundColor: 'rgba(251,191,36,0.12)',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: colors.accent[600],
                    }}
                  >
                    {profile.plan} plan
                  </Text>
                </View>
              )}
            </Card>

            {/* Stats */}
            {gamification && (
              <Card style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.text.primary,
                    marginBottom: 12,
                  }}
                >
                  Statistics
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  <View style={{ alignItems: 'center' }}>
                    <Zap size={20} color={colors.accent[500]} />
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        color: colors.text.primary,
                        marginTop: 4,
                      }}
                    >
                      {gamification.xp ?? 0}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.text.tertiary,
                        fontFamily: 'PlusJakartaSans_400Regular',
                      }}
                    >
                      XP
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Award size={20} color={colors.accent[500]} />
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        color: colors.text.primary,
                        marginTop: 4,
                      }}
                    >
                      {gamification.level ?? 1}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.text.tertiary,
                        fontFamily: 'PlusJakartaSans_400Regular',
                      }}
                    >
                      Level
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Flame size={20} color="#f97316" />
                    <Text
                      style={{
                        fontSize: 18,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        color: colors.text.primary,
                        marginTop: 4,
                      }}
                    >
                      {gamification.streak ?? 0}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.text.tertiary,
                        fontFamily: 'PlusJakartaSans_400Regular',
                      }}
                    >
                      Streak
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Sign Out */}
            <Button
              title="Sign Out"
              variant="secondary"
              onPress={handleSignOut}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
