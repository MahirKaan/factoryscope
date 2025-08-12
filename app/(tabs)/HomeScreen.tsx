// app/(tabs)/HomeScreen.tsx
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

type Status = 'loading' | 'success' | 'error';

interface FactoryStatus {
  id: string;
  name: string;
  status: Status;
  responseMs?: number;
  company: 'Petkim' | 'Star';
}

// ŞİRKET BAŞLIK SIRASI: Her zaman önce Star, sonra Petkim
const COMPANY_ORDER: readonly FactoryStatus['company'][] = ['Star', 'Petkim'] as const;

const INITIAL_FACTORIES: FactoryStatus[] = [
  { id: 'ca', name: 'CA', status: 'loading', company: 'Petkim' },
  { id: 'acn', name: 'ACN', status: 'loading', company: 'Petkim' },
  { id: 'vcm', name: 'VCM', status: 'loading', company: 'Petkim' },
  { id: 'eoeg', name: 'EOEG', status: 'loading', company: 'Petkim' },
  { id: 'pta', name: 'PTA', status: 'loading', company: 'Petkim' },
  { id: 'aype-t', name: 'AYPE-T', status: 'loading', company: 'Petkim' },
  { id: 'pa', name: 'PA', status: 'loading', company: 'Petkim' },
  { id: 'pp', name: 'PP', status: 'loading', company: 'Petkim' },
  { id: 'yype', name: 'YYPE', status: 'loading', company: 'Petkim' },
  { id: 'bu-eu', name: 'BÜ-EÜ', status: 'loading', company: 'Petkim' },
  { id: 'agu', name: 'AGÜ', status: 'loading', company: 'Petkim' },
  { id: 'aype', name: 'AYPE', status: 'loading', company: 'Petkim' },
  { id: 'etilen', name: 'ETİLEN', status: 'loading', company: 'Petkim' },
  { id: 'arom', name: 'AROM', status: 'loading', company: 'Petkim' },
  { id: 'pvc', name: 'PVC', status: 'loading', company: 'Petkim' },
  { id: 'yn-su-art', name: 'YN-SU-ART', status: 'loading', company: 'Petkim' },
  { id: 'e-su-art', name: 'E-SU-ART', status: 'loading', company: 'Petkim' },
  { id: 'u100', name: '100 ÜNİTESİ', status: 'loading', company: 'Star' },
  { id: 'u110', name: '110 ÜNİTESİ', status: 'loading', company: 'Star' },
  { id: 'u150', name: '150 ÜNİTESİ', status: 'loading', company: 'Star' },
  { id: 'u190', name: '190 ÜNİTESİ', status: 'loading', company: 'Star' },
];

type FilterKey = 'all' | 'error' | 'success';

export default function HomeScreen() {
  const router = useRouter();
  const [factories, setFactories] = useState<FactoryStatus[]>(INITIAL_FACTORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [updateTime, setUpdateTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');
  const { theme, toggleTheme } = useTheme();

  const COLORS = useMemo(() => {
    const dark = theme === 'dark';
    return {
      bg: dark ? '#0B1420' : '#F3F6F9',
      heroFrom: dark ? '#0B1420' : '#F3F6F9',
      heroTo: dark ? '#122133' : '#EAF2F7',
      card: dark ? '#111A25' : '#FFFFFF',
      cardBorder: dark ? 'rgba(255,255,255,0.06)' : '#E6EAF0',
      textPrimary: dark ? '#FFFFFF' : '#0F172A',
      textSecondary: dark ? 'rgba(255,255,255,0.72)' : '#5D6B7A',
      primary: '#00E5FF',
      success: '#22C55E',
      error: '#EF4444',
      info: '#3B82F6',
      inputBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(6,24,44,0.04)',
      glassBorder: dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
      glassBg: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
      shadow: dark ? '#000' : '#2B3A4A',
    };
  }, [theme]);

  // Simülasyon
  const updateFactories = () => {
    setFactories(INITIAL_FACTORIES);
    INITIAL_FACTORIES.forEach((factory) => {
      const delay = 800 + Math.random() * 3000;
      setTimeout(() => {
        const success = Math.random() > 0.25;
        setFactories((prev) =>
          prev.map((f) =>
            f.id === factory.id
              ? { ...f, status: success ? 'success' : 'error', responseMs: Math.round(delay) }
              : f
          )
        );
      }, delay);
    });

    const now = new Date();
    setUpdateTime(`${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`);
  };

  useEffect(() => {
    updateFactories();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    updateFactories();
    setTimeout(() => setRefreshing(false), 1200);
  };

  // Metrikler (sadece filtre sayıları için)
  const total = factories.length;
  const successCount = factories.filter((f) => f.status === 'success').length;
  const errorCount = factories.filter((f) => f.status === 'error').length;

  // Filtre
  const filtered = useMemo(() => {
    let list = factories;
    if (filter !== 'all') list = list.filter((f) => f.status === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  }, [factories, filter, searchQuery]);

  // Sıralama (duruma göre, sonra ada göre)
  const sorted = useMemo(() => {
    const order: Record<Status, number> = { error: 0, loading: 1, success: 2 };
    const data = [...filtered];
    data.sort((a, b) => {
      const diff = order[a.status] - order[b.status];
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'tr');
    });
    return data;
  }, [filtered]);

  // Şirket bazlı bölümleme — SABİT SIRA: Star → Petkim
  const sections = useMemo(() => {
    const groups: Record<'Star' | 'Petkim', FactoryStatus[]> = { Star: [], Petkim: [] };
    for (const f of sorted) {
      groups[f.company].push(f);
    }
    return COMPANY_ORDER
      .filter((c) => groups[c].length > 0)
      .map((c) => ({ title: c, data: groups[c] }));
  }, [sorted]);

  const isAllLoading = factories.every((f) => f.status === 'loading');

  /* -------- UI -------- */

  const StatusPill = ({ status }: { status: Status }) => {
    if (status === 'loading') return <ActivityIndicator size="small" color={COLORS.info} />;
    const ok = status === 'success';
    const color = ok ? COLORS.success : COLORS.error;
    const text = ok ? 'Başarılı' : 'Hata';
    const icon = ok ? 'checkmark-circle' : 'close-circle';
    return (
      <BlurView intensity={60} tint={theme === 'dark' ? 'dark' : 'light'} style={styles.blurPill}>
        <Ionicons name={icon as any} size={16} color={color} style={styles.iconShadow} />
        <Text style={[styles.pillText, { color }]}>{` ${text}`}</Text>
      </BlurView>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={[styles.sectionHeader, { backgroundColor: COLORS.bg }]}>
      <Text style={[styles.sectionTitle, { color: COLORS.textSecondary }]}>{title}</Text>
    </View>
  );

  const Row = ({ item }: { item: FactoryStatus }) => {
    const barColor =
      item.status === 'success' ? COLORS.success : item.status === 'error' ? COLORS.error : COLORS.info;

    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        layout={Layout.springify()}
        style={[
          styles.card,
          { backgroundColor: COLORS.card, shadowColor: COLORS.shadow, borderColor: COLORS.cardBorder },
        ]}
      >
        <View style={[styles.statusBar, { backgroundColor: barColor }]} />
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardContent}
          onPress={() =>
            router.push({
              pathname: '/FactoryDetail',
              params: {
                name: item.name,
                status: item.status,
                responseMs: item.responseMs?.toString(),
              },
            })
          }
        >
          <View style={{ flex: 1 }}>
            <View style={styles.cardHeader}>
              <Ionicons name="business" size={16} color={COLORS.textPrimary} style={styles.iconShadow} />
              <Text style={[styles.cardName, { color: COLORS.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.cardCompany, { color: COLORS.textSecondary }]} numberOfLines={1}>
                • {item.company}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
              <Text style={[styles.cardTime, { color: COLORS.textSecondary }]}>
                {' '}
                {item.responseMs != null ? `${(item.responseMs / 1000).toFixed(2)} sn` : '—'}
              </Text>
            </View>
          </View>

          <StatusPill status={item.status} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const HeaderHero = () => (
    <View style={styles.heroWrap}>
      <LinearGradient
        colors={[COLORS.heroFrom, COLORS.heroTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* Başlık + tema anahtarı */}
        <View style={styles.headerTopRow}>
          <Text style={[styles.title, { color: COLORS.textPrimary }]}>Fabrika Durumları</Text>
          <TouchableOpacity onPress={toggleTheme} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Güncelleme satırı */}
        <View style={styles.updatedRow}>
          <View style={[styles.dotWrap, { borderColor: COLORS.glassBorder }]}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
          </View>
          <Text style={[styles.updateTime, { color: COLORS.textSecondary }]}>
            Güncellendi: {updateTime}
          </Text>
        </View>

        {/* Cam efektli panel: arama + segmented filtreler */}
        <BlurView
          intensity={theme === 'dark' ? 50 : 30}
          tint={theme === 'dark' ? 'dark' : 'light'}
          style={[
            styles.glassPanel,
            {
              backgroundColor: COLORS.glassBg,
              borderColor: COLORS.glassBorder,
              shadowColor: COLORS.shadow,
            },
          ]}
        >
          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: COLORS.inputBg }]}>
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: COLORS.textPrimary }]}
              placeholder="Fabrika ara..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Segmented filter */}
          <View style={styles.segmentWrap}>
            <SegmentButton
              label={`Tümü (${total})`}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <SegmentButton
              label={`Hatalı (${errorCount})`}
              active={filter === 'error'}
              onPress={() => setFilter('error')}
            />
            <SegmentButton
              label={`Başarılı (${successCount})`}
              active={filter === 'success'}
              onPress={() => setFilter('success')}
            />
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );

  const renderSectionHeader = ({ section }: any) => <SectionHeader title={section.title} />;
  const renderItem = ({ item }: { item: FactoryStatus }) => <Row item={item} />;

  return (
    <View style={[styles.screen, { backgroundColor: COLORS.bg }]}>
      <SectionList
        sections={
          isAllLoading
            ? [{ title: '', data: Array.from({ length: 6 }).map((_, i) => ({ id: String(i) } as any)) }]
            : sections
        }
        keyExtractor={(item: any) => item.id}
        renderItem={isAllLoading ? () => <SkeletonRow /> : renderItem}
        renderSectionHeader={isAllLoading ? undefined : renderSectionHeader}
        stickySectionHeadersEnabled
        ListHeaderComponent={HeaderHero}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

/* ---- küçük bileşenler ---- */

function SegmentButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.segmentBtn,
        {
          borderColor: active ? 'rgba(0,229,255,0.9)' : 'transparent',
          backgroundColor: active ? 'rgba(0,229,255,0.14)' : 'transparent',
        },
      ]}
    >
      <Text style={{ color: active ? '#00E5FF' : '#8AA0B2', fontWeight: active ? '800' : '700', fontSize: 13 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SkeletonRow() {
  return (
    <View
      style={{
        height: 84,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: 6,
          backgroundColor: 'rgba(255,255,255,0.15)',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0.06)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: -100, top: 0, bottom: 0, width: 200 }}
      />
    </View>
  );
}

/* ---- stiller ---- */

const styles = StyleSheet.create({
  screen: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  heroWrap: { paddingTop: 40, marginBottom: 8 },
  hero: { paddingBottom: 18 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: 0.2 },

  updatedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 12 },
  dotWrap: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  updateTime: { fontSize: 14, fontWeight: '600' },

  // Cam panel
  glassPanel: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Segmented
  segmentWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    padding: 4,
    gap: 6,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  // Liste başlıkları
  sectionHeader: { paddingTop: 14, paddingBottom: 6, paddingHorizontal: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Kartlar (dokunulmadı)
  card: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
  },
  statusBar: { width: 8, height: '100%' },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardName: { fontSize: 18, fontWeight: '800' },
  cardCompany: { fontSize: 13, fontWeight: '600' },
  cardTime: { fontSize: 12, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  blurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  pillText: { fontSize: 14, fontWeight: '700' },
  iconShadow: {
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
