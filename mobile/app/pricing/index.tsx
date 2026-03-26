import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { Card } from '@/components/Card';
import { colors } from '@/lib/theme';

type BillingCycle = 'monthly' | 'annual';

type Plan = {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: { label: string; included: boolean }[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { label: '5 lessons per month', included: true },
      { label: '3 practice recordings', included: true },
      { label: 'Basic AI feedback', included: true },
      { label: 'Mini-games', included: true },
      { label: 'Arcade challenges', included: false },
      { label: 'Advanced AI coaching', included: false },
      { label: 'Unlimited recordings', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    monthlyPrice: 9.99,
    annualPrice: 7.99,
    highlight: true,
    features: [
      { label: 'Unlimited lessons', included: true },
      { label: '20 practice recordings/month', included: true },
      { label: 'Advanced AI feedback', included: true },
      { label: 'Mini-games', included: true },
      { label: 'Arcade challenges', included: true },
      { label: 'Advanced AI coaching', included: false },
      { label: 'Unlimited recordings', included: false },
      { label: 'Priority support', included: false },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    monthlyPrice: 19.99,
    annualPrice: 15.99,
    features: [
      { label: 'Unlimited lessons', included: true },
      { label: 'Unlimited recordings', included: true },
      { label: 'Advanced AI coaching', included: true },
      { label: 'Mini-games', included: true },
      { label: 'Arcade challenges', included: true },
      { label: 'Coach Ney AI assistant', included: true },
      { label: 'Detailed analytics', included: true },
      { label: 'Priority support', included: true },
    ],
  },
];

export default function PricingScreen() {
  const { token } = useAuth();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currentPlan, setCurrentPlan] = useState('basic');

  // Attempt to fetch actual plan
  useEffect(() => {
    apiGet<{ plan?: string }>('/api/user/profile', token)
      .then((data) => {
        if (data?.plan) setCurrentPlan(data.plan.toLowerCase());
      })
      .catch(() => {});
  }, [token]);

  function handleUpgrade(planId: string) {
    Linking.openURL('https://seeneyu.vercel.app/pricing');
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Plans & Pricing',
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
          {/* Billing Toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignSelf: 'center',
              backgroundColor: colors.bg.surface,
              borderRadius: 12,
              padding: 4,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => setCycle('monthly')}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor:
                  cycle === 'monthly' ? '#ffffff' : 'transparent',
                shadowColor: cycle === 'monthly' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: cycle === 'monthly' ? 0.08 : 0,
                shadowRadius: 2,
                elevation: cycle === 'monthly' ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily:
                    cycle === 'monthly'
                      ? 'PlusJakartaSans_600SemiBold'
                      : 'PlusJakartaSans_400Regular',
                  color:
                    cycle === 'monthly'
                      ? colors.text.primary
                      : colors.text.tertiary,
                }}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCycle('annual')}
              activeOpacity={0.7}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 10,
                backgroundColor:
                  cycle === 'annual' ? '#ffffff' : 'transparent',
                shadowColor: cycle === 'annual' ? '#000' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: cycle === 'annual' ? 0.08 : 0,
                shadowRadius: 2,
                elevation: cycle === 'annual' ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily:
                    cycle === 'annual'
                      ? 'PlusJakartaSans_600SemiBold'
                      : 'PlusJakartaSans_400Regular',
                  color:
                    cycle === 'annual'
                      ? colors.text.primary
                      : colors.text.tertiary,
                }}
              >
                Annual
              </Text>
            </TouchableOpacity>
          </View>

          {cycle === 'annual' && (
            <View
              style={{
                alignSelf: 'center',
                backgroundColor: 'rgba(34,197,94,0.1)',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 4,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                  color: colors.status.success,
                }}
              >
                Save up to 20% with annual billing
              </Text>
            </View>
          )}

          {/* Plan Cards */}
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const price =
              cycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

            return (
              <Card
                key={plan.id}
                style={{
                  marginBottom: 16,
                  borderWidth: plan.highlight ? 2 : 1,
                  borderColor: plan.highlight
                    ? colors.accent[400]
                    : colors.border.default,
                }}
              >
                {plan.highlight && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -12,
                      alignSelf: 'center',
                      backgroundColor: colors.accent[400],
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: 'PlusJakartaSans_700Bold',
                        color: '#1a1a2e',
                      }}
                    >
                      MOST POPULAR
                    </Text>
                  </View>
                )}

                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'PlusJakartaSans_700Bold',
                    color: colors.text.primary,
                    marginTop: plan.highlight ? 4 : 0,
                  }}
                >
                  {plan.name}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    marginTop: 8,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 32,
                      fontFamily: 'PlusJakartaSans_700Bold',
                      color: colors.text.primary,
                    }}
                  >
                    {price === 0 ? 'Free' : `$${price}`}
                  </Text>
                  {price > 0 && (
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'PlusJakartaSans_400Regular',
                        color: colors.text.tertiary,
                        marginLeft: 4,
                      }}
                    >
                      /month
                    </Text>
                  )}
                </View>

                {/* Features */}
                {plan.features.map((feat, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {feat.included ? (
                      <Check size={16} color={colors.status.success} />
                    ) : (
                      <X size={16} color={colors.text.tertiary} />
                    )}
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: 'PlusJakartaSans_400Regular',
                        color: feat.included
                          ? colors.text.primary
                          : colors.text.tertiary,
                      }}
                    >
                      {feat.label}
                    </Text>
                  </View>
                ))}

                {/* CTA */}
                <TouchableOpacity
                  onPress={() => handleUpgrade(plan.id)}
                  disabled={isCurrent}
                  activeOpacity={0.7}
                  style={{
                    marginTop: 12,
                    height: 44,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isCurrent
                      ? colors.bg.surface
                      : plan.highlight
                      ? colors.accent[400]
                      : 'transparent',
                    borderWidth: isCurrent || plan.highlight ? 0 : 1.5,
                    borderColor: colors.accent[400],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: 'PlusJakartaSans_600SemiBold',
                      color: isCurrent
                        ? colors.text.tertiary
                        : plan.highlight
                        ? '#1a1a2e'
                        : colors.accent[600],
                    }}
                  >
                    {isCurrent ? 'Current Plan' : 'Upgrade'}
                  </Text>
                </TouchableOpacity>
              </Card>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
