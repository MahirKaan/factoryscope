import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

/* ======= Design Tokens ======= */
const SPACING = 20;
const GAP = 12;
const RADIUS = 20;
const BG = '#0B1120';
const SURFACE = '#141C2B';
const SURFACE_HOVER = '#19243A';
const STROKE = '#253349';
const TEXT_PRIMARY = '#E6F0FF';
const TEXT_SECONDARY = '#8FA3BF';
const ACCENT = '#38BDF8';

/* ======= Types & Data ======= */
type PreviewType = 'spark' | 'grid2x2' | 'field';

type TemplateItem = {
  id: string;
  title: string;
  subtitle: string;
  route: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  preview: PreviewType;
};

const TEMPLATES: TemplateItem[] = [
  {
    id: 't1',
    title: 'Template 1',
    subtitle: 'Serbest grid, çoklu chart',
    route: '/Template1Screen',
    badge: 'Grid',
    icon: 'stats-chart-outline',
    preview: 'spark',
  },
  {
    id: 't2',
    title: 'Template 2',
    subtitle: 'Kare yerleşim, 2×2',
    route: '/Template2Screen',
    badge: '2×2',
    icon: 'stats-chart-outline',
    preview: 'grid2x2',
  },
  {
    id: 't3',
    title: 'Template 3',
    subtitle: 'Serbest drag + reaktif grid ',
    route: '/Template3Screen',
    badge: 'Reactive',
    icon: 'color-wand-outline',
    preview: 'field',
  },
];

/* ======= Small Sparkline Component (SVG) ======= */
const Sparkline = ({
  w = 280,
  h = 34,
  stroke = ACCENT,
  data = [4, 5, 3, 6, 4, 7, 5],
}: {
  w?: number;
  h?: number;
  stroke?: string;
  data?: number[];
}) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const dx = data.length > 1 ? w / (data.length - 1) : 0;

  const points = data.map((v, i) => {
    const x = i * dx;
    const t = max === min ? 0.5 : (v - min) / (max - min);
    const y = h - t * h;
    return { x, y };
  });

  const d = points.reduce(
    (acc, p, i) => (i === 0 ? `M${p.x},${p.y}` : `${acc} L${p.x},${p.y}`),
    ''
  );

  return (
    <View style={styles.sparkWrap}>
      <Svg width={w} height={h}>
        <Path d={d} stroke={stroke} strokeOpacity={0.7} strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
};

/* ======= Tiny “Reactive Field” Preview (animated vignette) ======= */
const FieldPreview = ({ w = 280, h = 84, rows = 3, cols = 6 }: { w?: number; h?: number; rows?: number; cols?: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const cellW = (w - (cols - 1) * 8) / cols;
  const cellH = (h - (rows - 1) * 8) / rows;

  const bubbleSize = 20;
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [8, w - bubbleSize - 8] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [h - bubbleSize - 8, 8] });

  return (
    <View style={[styles.fieldWrap, { width: w, height: h }]}>
      {/* grid cells */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const left = c * (cellW + 8);
          const top = r * (cellH + 8);
          return (
            <View
              key={`${r}-${c}`}
              style={[
                styles.fieldCell,
                {
                  width: cellW,
                  height: cellH,
                  left,
                  top,
                },
              ]}
            />
          );
        })
      )}
      {/* moving bubble (hint: draggable chart) */}
      <Animated.View
        style={[
          styles.fieldBubble,
          {
            width: bubbleSize,
            height: bubbleSize,
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        <Ionicons name="move-outline" size={14} color={TEXT_PRIMARY} />
      </Animated.View>
    </View>
  );
};

/* ======= Screen ======= */
export default function ChooseTemplateScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;

  // coach görünürlüğünü state ile değil animasyonla yöneteceğiz
  const coachAnim = useRef(new Animated.Value(0)).current; // 0..1..0

  // Featured card width; allow peek of next card
  const FEATURED_WIDTH = useMemo(() => Math.min(width * 0.82, 360), []);
  const SNAP = FEATURED_WIDTH + SPACING;

  // Mount sonrası animasyonu başlat (state update yok)
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      Animated.sequence([
        Animated.timing(coachAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(coachAnim, {
          toValue: 0,
          delay: 300,
          duration: 500,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(); // setState yok -> uyarı biter
    });
    return () => task.cancel();
  }, []);

  const renderFeatured = ({ item, index }: { item: TemplateItem; index: number }) => {
    const inputRange = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.95, 1, 0.95],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [6, 0, 6],
      extrapolate: 'clamp',
    });

    // inner content widths for previews
    const innerW = FEATURED_WIDTH - 18 * 2; // padding=18
    const tileW = (innerW - GAP) / 2;

    return (
      <Animated.View
        style={{
          width: FEATURED_WIDTH,
          transform: [{ scale }, { translateY }],
          marginRight: SPACING,
        }}
      >
        <Pressable
          onPress={() => router.push(item.route as any)}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}, ${item.subtitle}, aç`}
          style={({ pressed }) => [
            styles.featuredCard,
            { backgroundColor: pressed ? SURFACE_HOVER : SURFACE },
          ]}
        >
          {/* Soft Aurora */}
          <LinearGradient
            colors={['rgba(60,198,255,0.18)', 'rgba(120,247,207,0.14)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glow}
          />

          {/* Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>

          {/* Header */}
          <View style={styles.featuredHeader}>
            <View style={styles.iconPill}>
              <Ionicons name={item.icon} size={24} color={ACCENT} />
            </View>
            <Text style={styles.featuredTitle}>{item.title}</Text>
          </View>
          <Text style={styles.featuredSubtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>

          {/* === Visual Preview === */}
          <View style={{ marginTop: 14 }}>
            {item.preview === 'spark' ? (
              <>
                <Sparkline w={innerW} h={34} data={[4, 5, 3, 6, 4, 7, 5]} />
                <Sparkline w={innerW} h={34} data={[6, 4, 5, 4, 6, 5, 7]} />
              </>
            ) : item.preview === 'grid2x2' ? (
              <View style={[styles.previewGrid2x2, { width: innerW }]}>
                {[0, 1, 2, 3].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.previewTile,
                      { width: tileW, height: tileW, marginRight: i % 2 === 0 ? GAP : 0 },
                    ]}
                  >
                    <Ionicons
                      name="bar-chart-outline"
                      size={18}
                      color={TEXT_SECONDARY}
                      style={{ opacity: 0.7 }}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <FieldPreview w={innerW} h={84} rows={3} cols={8} />
            )}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Pagination dots
  const Dots = () => (
    <View style={styles.dotsRow}>
      {TEMPLATES.map((_, i) => {
        const inputRange = [(i - 1) * SNAP, i * SNAP, (i + 1) * SNAP];
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        const scale = scrollX.interpolate({
          inputRange,
          outputRange: [1, 1.35, 1],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View key={i} style={[styles.dot, { opacity, transform: [{ scale }] }]} />
        );
      })}
    </View>
  );

  // Coachmark (Kaydır →) — state yok; opacity+translate ile kontrol
  const Coachmark = () => {
    const tx = coachAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 10] });
    const opacity = coachAnim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 0] });
    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.coach, { transform: [{ translateX: tx }], opacity }]}
      >
        <Text style={styles.coachText}>Kaydır</Text>
        <Ionicons name="chevron-forward" size={14} color={TEXT_SECONDARY} />
      </Animated.View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose Template</Text>
      <Text style={styles.subtitle}>Layout seç, sonra tag’ları yerleştir.</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured</Text>
      </View>

      <View style={{ position: 'relative' }}>
        {/* Edge fades for scroll hint */}
        <LinearGradient
          colors={[BG, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.edgeFade, { left: 0 }]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', BG]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.edgeFade, { right: 0 }]}
          pointerEvents="none"
        />

        {/* Coachmark */}
        <Coachmark />

        {/* Featured carousel (shows next card peek) */}
        <Animated.FlatList
          data={TEMPLATES}
          keyExtractor={(it) => it.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: SPACING, paddingRight: SPACING }}
          snapToInterval={SNAP}
          decelerationRate="fast"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          renderItem={renderFeatured}
        />
      </View>

      {/* Dots */}
      <Dots />

      {/* Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Templates</Text>
      </View>

      <View style={styles.grid}>
        {TEMPLATES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => [
              styles.gridCard,
              { backgroundColor: pressed ? SURFACE_HOVER : SURFACE },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, aç`}
          >
            <View style={styles.gridBadge}>
              <Text style={styles.gridBadgeText}>{item.badge}</Text>
            </View>
            <View style={styles.gridIconBox}>
              <Ionicons name={item.icon} size={26} color={ACCENT} />
            </View>
            <Text style={styles.gridTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.gridSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
            <View style={styles.chevron}>
              <Ionicons name="chevron-forward" size={18} color={TEXT_SECONDARY} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

/* ======= Styles ======= */
const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: BG,
  },
  title: { color: ACCENT, fontSize: 30, fontWeight: '700', letterSpacing: 0.2 },
  subtitle: { color: TEXT_SECONDARY, fontSize: 13, marginTop: 8, marginBottom: 18 },
  sectionHeader: { marginTop: 8, marginBottom: 10 },
  sectionTitle: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '600' },

  /* Featured */
  featuredCard: {
    borderRadius: RADIUS,
    padding: 18,
    borderWidth: 1,
    borderColor: STROKE,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -30,
    left: -20,
    right: -20,
    height: 160,
    borderRadius: RADIUS * 1.5,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: '#0F172A',
    marginBottom: 12,
  },
  badgeText: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '600' },
  featuredHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconPill: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: STROKE,
    borderRadius: 999,
    padding: 8,
  },
  featuredTitle: { color: TEXT_PRIMARY, fontSize: 20, fontWeight: '700' },
  featuredSubtitle: { color: TEXT_SECONDARY, fontSize: 13, marginTop: 6 },

  // Sparkline wrapper
  sparkWrap: {
    width: '100%',
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: '#22324A',
    paddingHorizontal: 8,
    justifyContent: 'center',
    marginBottom: 10,
  },

  // 2×2 preview grid
  previewGrid2x2: { flexDirection: 'row', flexWrap: 'wrap' },
  previewTile: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: '#22324A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: GAP,
  },

  // Field preview (reactive grid vibe)
  fieldWrap: {
    position: 'relative',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: '#1a263a',
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  fieldCell: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: '#22324A',
  },
  fieldBubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#28374f',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Edge fade overlays
  edgeFade: { position: 'absolute', top: 0, bottom: 0, width: 24, zIndex: 1 },

  // Coachmark
  coach: {
    position: 'absolute',
    right: 24,
    top: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: STROKE,
    zIndex: 2,
  },
  coachText: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '600' },

  /* Grid list */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: (width - SPACING * 2 - 12) / 2,
    borderRadius: RADIUS,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: STROKE,
  },
  gridBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: STROKE,
  },
  gridBadgeText: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '600' },
  gridIconBox: {
    width: '100%',
    height: 74,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: STROKE,
    backgroundColor: '#22324A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '600' },
  gridSubtitle: { color: TEXT_SECONDARY, fontSize: 12, marginTop: 2 },
  chevron: { position: 'absolute', right: 10, bottom: 10 },

  // Dots
  dotsRow: { flexDirection: 'row', alignSelf: 'center', gap: 8, marginTop: 10, marginBottom: 12 },
  dot: { width: 6, height: 6, borderRadius: 999, backgroundColor: TEXT_SECONDARY },
});
