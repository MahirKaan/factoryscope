// app/FactoryDetail.tsx
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FactoryDetail() {
  const router = useRouter();
  const { name, status, responseMs, company } = useLocalSearchParams();
  const { theme, toggleTheme, colors: COLORS } = useTheme();
  const insets = useSafeAreaInsets();

  const nameStr = String(name ?? '');
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isLoading = status === 'loading';

  // Firma: parametre öncelikli, yoksa isimden çıkar
  const companyName =
    (typeof company === 'string' && company.length > 0 ? company : undefined) ??
    (/ÜNİTESİ/i.test(nameStr) ? 'Star' : 'Petkim');

  // Haptics (hata)
  useEffect(() => {
    if (isError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  }, [isError]);

  // Durum yapılandırması
  const statusCfg = isSuccess
    ? { color: COLORS.success, label: 'Başarılı', icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap, sweep: 'rgba(34,197,94,0.16)' }
    : isError
    ? { color: COLORS.error, label: 'Hata', icon: 'alert-circle' as keyof typeof Ionicons.glyphMap, sweep: 'rgba(239,68,68,0.16)' }
    : { color: COLORS.info, label: 'Yükleniyor', icon: 'time' as keyof typeof Ionicons.glyphMap, sweep: 'rgba(59,130,246,0.16)' };

  const heroFrom = theme === 'dark' ? '#0B1420' : '#F3F6F9';
  const heroTo = theme === 'dark' ? '#132337' : '#EAF2F7';

  const now = new Date().toLocaleString();

  // Scroll animasyonları
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const heroAnim = useAnimatedStyle(() => {
    const h = interpolate(scrollY.value, [0, 120], [140, 90], Extrapolate.CLAMP);
    const scale = interpolate(scrollY.value, [0, 120], [1, 0.98], Extrapolate.CLAMP);
    return { height: h, transform: [{ scale }] };
  });

  const titleAnim = useAnimatedStyle(() => {
    const fs = interpolate(scrollY.value, [0, 120], [24, 20], Extrapolate.CLAMP);
    return { fontSize: fs as any };
  });

  const headerAnim = useAnimatedStyle(() => {
    const bgAlpha = interpolate(scrollY.value, [0, 10, 80], [0, 0.5, 0.85], Extrapolate.CLAMP);
    return {
      backgroundColor:
        theme === 'dark'
          ? `rgba(11,20,32,${bgAlpha})`
          : `rgba(243,246,249,${bgAlpha})`,
      borderBottomWidth: bgAlpha > 0.4 ? 1 : 0,
      borderBottomColor:
        theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    };
  });

  // İnce ışık süpürmesi
  const sweepX = useSharedValue(-220);
  useEffect(() => {
    if (!isLoading) {
      sweepX.value = -220;
      sweepX.value = withRepeat(
        withTiming(420, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      );
    }
    return () => {
      sweepX.value = -220;
    };
  }, [isLoading, theme]);

  const sweepAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: sweepX.value }],
  }));

  return (
    <Animated.ScrollView
      style={[styles.screen, { backgroundColor: COLORS.background }]}
      onScroll={onScroll}
      scrollEventThrottle={16}
      stickyHeaderIndices={[0]}
    >
      {/* Sticky Header */}
      <Animated.View
        style={[
          styles.stickyHeader,
          headerAnim,
          {
            paddingTop: insets.top + 4,
            height: insets.top + 56,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            <Text style={[styles.backText, { color: COLORS.text }]}>Geri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleTheme}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* HERO */}
      <Animated.View style={[styles.hero, heroAnim]}>
        <LinearGradient colors={[heroFrom, heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {!isLoading && (
          <Animated.View pointerEvents="none" style={[styles.sweep, sweepAnim]}>
            <LinearGradient
              colors={['transparent', statusCfg.sweep, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}

        <View style={styles.heroContent}>
          <Animated.Text style={[styles.title, { color: COLORS.text }, titleAnim]} numberOfLines={1}>
            {nameStr} Detayları
          </Animated.Text>

          <View style={styles.heroStatusRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: theme === 'dark' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Ionicons name={statusCfg.icon} size={18} color={statusCfg.color} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>

            <View style={styles.heroMeta}>
              <Ionicons name="briefcase-outline" size={14} color={COLORS.textSecondary} />
              <Text style={[styles.heroMetaText, { color: COLORS.textSecondary }]}>{companyName}</Text>
              <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} style={{ marginLeft: 10 }} />
              <Text style={[styles.heroMetaText, { color: COLORS.textSecondary }]}>{now}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* INFO CARDS */}
      <InfoCard COLORS={COLORS} label="Tag" icon="pricetag" value={`${nameStr}_TAG`} />
      <InfoCard COLORS={COLORS} label="Başlama Zamanı" icon="time" value={now} />
      <InfoCard COLORS={COLORS} label="Firma" icon="business" value={companyName} />
      <InfoCard
        COLORS={COLORS}
        label="Yanıt Süresi"
        icon="speedometer"
        value={responseMs ? `${(Number(responseMs) / 1000).toFixed(2)} sn` : '—'}
      />

      {isError && (
        <View
          style={[
            styles.alert,
            {
              borderColor: COLORS.error,
              backgroundColor: theme === 'dark' ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
            },
          ]}
        >
          <Text style={[styles.alertTitle, { color: COLORS.error }]}>Hata Sebebi</Text>
          <View style={styles.row}>
            <Ionicons name="bug" size={18} color={COLORS.error} style={{ marginRight: 8 }} />
            <Text style={[styles.alertText, { color: COLORS.error }]}>Hatanın sebebi: Bilinmiyor</Text>
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />
    </Animated.ScrollView>
  );
}

/* ---- küçük bileşen ---- */
function InfoCard({
  COLORS,
  label,
  icon,
  value,
}: {
  COLORS: any;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View style={[styles.card, { backgroundColor: COLORS.card }]}>
      <Text style={[styles.label, { color: COLORS.textSecondary }]}>{label}</Text>
      <View style={styles.row}>
        <Ionicons name={icon} size={18} color={COLORS.info} style={{ marginRight: 8 }} />
        <Text style={[styles.value, { color: COLORS.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* ---- stiller ---- */
const styles = StyleSheet.create({
  screen: { flex: 1 },

  stickyHeader: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center', // ikonlar dikey ortalı
    justifyContent: 'space-between',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, marginLeft: 6 },

  hero: {
    borderRadius: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
  },
  heroContent: { flex: 1, paddingHorizontal: 16, paddingVertical: 16, justifyContent: 'center' },
  title: { fontWeight: '800', letterSpacing: 0.2 },
  heroStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontSize: 14, fontWeight: '800' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { fontSize: 12, fontWeight: '600' },

  sweep: { position: 'absolute', top: 0, bottom: 0, width: 160, opacity: 0.8 },

  card: { padding: 16, borderRadius: 12, marginHorizontal: 16, marginBottom: 12 },
  label: { fontSize: 13, marginBottom: 6 },
  value: { fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },

  alert: { borderWidth: 1, borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 8, marginBottom: 16 },
  alertTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  alertText: { fontSize: 16, fontWeight: '700' },
});
