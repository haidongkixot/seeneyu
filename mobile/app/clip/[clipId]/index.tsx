import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Film } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { YouTubeThumbnail } from '@/components/YouTubeThumbnail';
import { YouTubePlayer } from '@/components/YouTubePlayer';
import { SkillBadge } from '@/components/SkillBadge';
import { DifficultyPill } from '@/components/DifficultyPill';
import { Button } from '@/components/Button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors, spacing } from '@/lib/theme';
import { type ClipItem } from '@/lib/mock-data';

type AccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

function Accordion({ title, children, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <View style={styles.accordion}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={styles.accordionHeader}
      >
        <Text style={styles.accordionTitle}>{title}</Text>
        {open ? (
          <ChevronUp size={20} color={colors.text.secondary} />
        ) : (
          <ChevronDown size={20} color={colors.text.secondary} />
        )}
      </TouchableOpacity>
      {open && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
}

export default function ClipDetailScreen() {
  const { clipId } = useLocalSearchParams<{ clipId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [clip, setClip] = useState<ClipItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<ClipItem>(`/api/clips/${clipId}`, token);
        setClip(data);
      } catch (err) {
        console.warn('Failed to fetch clip detail:', err);
        setClip(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [clipId, token]);

  const handleRecord = useCallback(() => {
    router.push(`/clip/${clipId}/record`);
  }, [router, clipId]);

  const duration = clip ? clip.endSec - clip.startSec : 0;
  const durationLabel = useMemo(() => {
    if (duration >= 60)
      return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${duration}s`;
  }, [duration]);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Clip',
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 17,
            },
            headerTintColor: colors.text.primary,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={styles.loadingContainer}>
            <LoadingSkeleton width="100%" height={220} borderRadius={14} />
            <LoadingSkeleton
              width="40%"
              height={20}
              style={{ marginTop: 16 }}
            />
            <LoadingSkeleton
              width="90%"
              height={16}
              style={{ marginTop: 8 }}
            />
            <LoadingSkeleton
              width="60%"
              height={16}
              style={{ marginTop: 8 }}
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!clip) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Clip',
            headerTitleStyle: {
              fontFamily: 'PlusJakartaSans_600SemiBold',
              fontSize: 17,
            },
            headerTintColor: colors.text.primary,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={styles.empty}>
            <Film size={40} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Clip not found.</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: clip.movieTitle,
          headerTitleStyle: {
            fontFamily: 'PlusJakartaSans_600SemiBold',
            fontSize: 17,
          },
          headerTintColor: colors.text.primary,
          headerStyle: { backgroundColor: '#ffffff' },
        }}
      />
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Video player / thumbnail */}
          {playing ? (
            <YouTubePlayer
              videoId={clip.youtubeVideoId}
              startSec={clip.startSec}
              endSec={clip.endSec}
              style={styles.thumbnail}
            />
          ) : (
            <YouTubeThumbnail
              videoId={clip.youtubeVideoId}
              height={220}
              style={styles.thumbnail}
              onPress={() => setPlaying(true)}
            />
          )}

          {/* Badges */}
          <View style={styles.badgeRow}>
            <SkillBadge skill={clip.skillCategory} />
            <DifficultyPill difficulty={clip.difficulty} />
            <Text style={styles.durationText}>{durationLabel}</Text>
          </View>

          {/* Movie info */}
          <Text style={styles.movieTitle}>
            {clip.movieTitle}
            {clip.year ? ` (${clip.year})` : ''}
          </Text>
          {clip.characterName && (
            <Text style={styles.characterText}>
              {clip.characterName}
              {clip.actorName ? ` \u2014 ${clip.actorName}` : ''}
            </Text>
          )}

          {/* Scene description */}
          <Text style={styles.description}>{clip.sceneDescription}</Text>

          {/* Annotation */}
          <View style={styles.annotationCard}>
            <Text style={styles.annotationLabel}>Analysis</Text>
            <Text style={styles.annotationText}>{clip.annotation}</Text>
          </View>

          {/* Observation guide */}
          {clip.observationGuide?.steps &&
            clip.observationGuide.steps.length > 0 && (
              <Accordion title="Observation Guide" defaultOpen>
                {clip.observationGuide.steps.map((step, i) => (
                  <View key={i} style={styles.guideStep}>
                    <Text style={styles.guideStepNumber}>{i + 1}</Text>
                    <Text style={styles.guideStepText}>{step}</Text>
                  </View>
                ))}
              </Accordion>
            )}

          {/* Transcript */}
          {clip.script && (
            <Accordion title="Transcript">
              <Text style={styles.scriptText}>{clip.script}</Text>
            </Accordion>
          )}

          {/* Record Practice button */}
          <View style={styles.recordSection}>
            <Button title="Record Practice" onPress={handleRecord} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  loadingContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 40,
  },
  thumbnail: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
    marginLeft: 'auto',
  },
  movieTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
  },
  characterText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.secondary,
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 16,
  },
  annotationCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  annotationLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.accent[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  annotationText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.primary,
    lineHeight: 21,
  },
  accordion: {
    backgroundColor: colors.bg.surface,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  accordionTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.primary,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  guideStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent[400] + '20',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.accent[600],
    overflow: 'hidden',
  },
  guideStepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 20,
  },
  scriptText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    lineHeight: 21,
    fontStyle: 'italic',
  },
  recordSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
  },
});
