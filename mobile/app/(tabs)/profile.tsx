import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  LogOut,
  Award,
  Zap,
  Flame,
  Crown,
  ChevronRight,
  Edit3,
  CreditCard,
  FileText,
  Medal,
  BarChart3,
  Target,
  Settings,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type ProfileData = {
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  plan?: string;
  role?: string;
};

type GamificationData = {
  xp?: number;
  level?: number;
  streak?: number;
  tier?: string;
  badges?: { id: string; name: string }[];
};

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  color?: string;
};

function MenuItem({ icon, label, onPress, color }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
      }}
    >
      <View style={{ marginRight: 14 }}>{icon}</View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontFamily: 'PlusJakartaSans_500Medium',
          color: color || colors.text.primary,
        }}
      >
        {label}
      </Text>
      <ChevronRight size={18} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
}

function StatItem({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      {icon}
      <Text
        style={{
          fontSize: 18,
          fontFamily: 'PlusJakartaSans_700Bold',
          color: colors.text.primary,
          marginTop: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 11,
          color: colors.text.tertiary,
          fontFamily: 'PlusJakartaSans_400Regular',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [gamification, setGamification] = useState<GamificationData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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

  const displayName = profile?.name || user?.name || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <View
        style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}
      >
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
            {/* Avatar + User Info */}
            <Card style={{ marginBottom: 16, alignItems: 'center' }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.accent[400],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 30,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: '#1a1a2e',
                  }}
                >
                  {initials}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.text.primary,
                }}
              >
                {displayName}
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
              {profile?.role && (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'PlusJakartaSans_400Regular',
                    color: colors.text.tertiary,
                    marginTop: 2,
                  }}
                >
                  {profile.role}
                </Text>
              )}
            </Card>

            {/* Stats Row */}
            <Card style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                }}
              >
                <StatItem
                  icon={<Award size={20} color={colors.accent[500]} />}
                  value={gamification?.level ?? 1}
                  label="Level"
                />
                <StatItem
                  icon={<Zap size={20} color={colors.accent[500]} />}
                  value={gamification?.xp ?? 0}
                  label="XP"
                />
                <StatItem
                  icon={<Flame size={20} color="#f97316" />}
                  value={gamification?.streak ?? 0}
                  label="Streak"
                />
                <StatItem
                  icon={<Crown size={20} color={colors.accent[600]} />}
                  value={gamification?.tier || 'Bronze'}
                  label="Tier"
                />
              </View>
            </Card>

            {/* My Plan Card */}
            <Card style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans_400Regular',
                      color: colors.text.tertiary,
                    }}
                  >
                    Current Plan
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: colors.text.primary,
                      marginTop: 2,
                    }}
                  >
                    {profile?.plan || 'Basic'}{' '}
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.text.tertiary,
                        fontFamily: 'PlusJakartaSans_400Regular',
                      }}
                    >
                      plan
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/pricing')}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.accent[400],
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: '#1a1a2e',
                    }}
                  >
                    Upgrade
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Menu Items */}
            <Card style={{ marginBottom: 16 }}>
              <MenuItem
                icon={<Edit3 size={20} color={colors.text.secondary} />}
                label="Edit Profile"
                onPress={() => router.push('/profile/edit')}
              />
              <MenuItem
                icon={<FileText size={20} color={colors.text.secondary} />}
                label="My Submissions"
                onPress={() => router.push('/profile/submissions')}
              />
              <MenuItem
                icon={<Medal size={20} color={colors.text.secondary} />}
                label="Badges"
                onPress={() => router.push('/gamification/badges')}
              />
              <MenuItem
                icon={<BarChart3 size={20} color={colors.text.secondary} />}
                label="Leaderboard"
                onPress={() => router.push('/gamification/leaderboard')}
              />
              <MenuItem
                icon={<Target size={20} color={colors.text.secondary} />}
                label="Daily Quests"
                onPress={() => router.push('/gamification/quests')}
              />
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                activeOpacity={0.6}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 4,
                }}
              >
                <View style={{ marginRight: 14 }}>
                  <Settings size={20} color={colors.text.secondary} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontFamily: 'PlusJakartaSans_500Medium',
                    color: colors.text.primary,
                  }}
                >
                  Settings
                </Text>
                <ChevronRight size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            </Card>

            {/* Sign Out */}
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.7}
              style={{
                height: 48,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: colors.status.error,
                marginBottom: 32,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <LogOut size={18} color={colors.status.error} />
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'PlusJakartaSans_600SemiBold',
                    color: colors.status.error,
                  }}
                >
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
