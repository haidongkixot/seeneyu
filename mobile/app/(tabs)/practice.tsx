import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Video } from 'lucide-react-native';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { YouTubeThumbnail } from '@/components/YouTubeThumbnail';
import { SkillBadge } from '@/components/SkillBadge';
import { DifficultyPill } from '@/components/DifficultyPill';
import { ClipSkeletonGrid } from '@/components/LoadingSkeleton';
import { colors, spacing } from '@/lib/theme';
import { SKILL_CATEGORIES, type ClipItem } from '@/lib/mock-data';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const HORIZONTAL_PADDING = spacing.md;
const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

type ClipCardProps = {
  item: ClipItem;
  onPress: (id: string) => void;
};

const ClipCard = React.memo(function ClipCard({ item, onPress }: ClipCardProps) {
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);
  const duration = item.endSec - item.startSec;
  const durationLabel = duration >= 60
    ? `${Math.floor(duration / 60)}m ${duration % 60}s`
    : `${duration}s`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.clipCard}
    >
      <YouTubeThumbnail
        videoId={item.youtubeVideoId}
        height={100}
        onPress={handlePress}
      />
      <View style={styles.clipInfo}>
        <View style={styles.clipBadgeRow}>
          <SkillBadge skill={item.skillCategory} />
          <DifficultyPill difficulty={item.difficulty} />
        </View>
        <Text style={styles.clipTitle} numberOfLines={2}>
          {item.movieTitle}
        </Text>
        {item.characterName && (
          <Text style={styles.clipCharacter} numberOfLines={1}>
            {item.characterName}
          </Text>
        )}
        <Text style={styles.clipDuration}>{durationLabel}</Text>
      </View>
    </TouchableOpacity>
  );
});

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

const FilterChip = React.memo(function FilterChip({
  label,
  active,
  onPress,
}: FilterChipProps) {
  const displayLabel = label === 'all'
    ? 'All'
    : label
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {displayLabel}
      </Text>
    </TouchableOpacity>
  );
});

export default function PracticeScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchClips = useCallback(async () => {
    try {
      const data = await apiGet<{ clips: ClipItem[] }>(
        '/api/clips',
        token
      );
      const list = data.clips ?? [];
      setClips(list);
    } catch (err) {
      console.warn('Failed to fetch clips:', err);
      setClips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClips();
  }, [fetchClips]);

  const handleClipPress = useCallback(
    (id: string) => {
      router.push(`/clip/${id}`);
    },
    [router]
  );

  const filteredClips = useMemo(() => {
    let result = clips;
    if (activeFilter !== 'all') {
      result = result.filter((c) => c.skillCategory === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.movieTitle.toLowerCase().includes(q) ||
          c.sceneDescription.toLowerCase().includes(q) ||
          (c.characterName?.toLowerCase().includes(q) ?? false) ||
          c.skillCategory.toLowerCase().includes(q)
      );
    }
    return result;
  }, [clips, activeFilter, search]);

  const renderClip = useCallback(
    ({ item }: { item: ClipItem }) => (
      <ClipCard item={item} onPress={handleClipPress} />
    ),
    [handleClipPress]
  );

  const keyExtractor = useCallback((item: ClipItem) => item.id, []);

  const handleFilterPress = useCallback((cat: string) => {
    setActiveFilter(cat);
  }, []);

  const listHeader = useMemo(
    () => (
      <View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Practice Library</Text>
          <Text style={styles.headerSubtitle}>
            Watch and analyze video clips
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clips..."
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {SKILL_CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={activeFilter === cat}
              onPress={() => handleFilterPress(cat)}
            />
          ))}
        </ScrollView>
      </View>
    ),
    [search, activeFilter, handleFilterPress]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        {listHeader}
        <View style={styles.skeletonContainer}>
          <ClipSkeletonGrid count={6} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filteredClips}
        renderItem={renderClip}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent[400]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Video size={40} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No clips found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.primary,
    marginLeft: 8,
    padding: 0,
  },
  chipRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chipActive: {
    backgroundColor: colors.accent[400],
    borderColor: colors.accent[400],
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.secondary,
  },
  chipTextActive: {
    color: '#1a1a2e',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: CARD_GAP,
  },
  clipCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.bg.elevated,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  clipInfo: {
    padding: 10,
    gap: 4,
  },
  clipBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  clipTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: colors.text.primary,
    marginTop: 2,
  },
  clipCharacter: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: colors.text.secondary,
  },
  clipDuration: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: colors.text.tertiary,
  },
  skeletonContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
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
