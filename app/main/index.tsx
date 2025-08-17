// app/MainScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const tokens = {
  primary: '#00E5FF',
  accent: '#4FACFE',
  highlight: '#FFB347',
  surface: 'rgba(255,255,255,0.07)',
  text: '#EAF6F8',
  textDim: '#9AB3BA',
  radius: 22,
};

export default function MainScreen() {
  const router = useRouter();

  const onLayoutRootView = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 8000, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 8000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bgColors = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#0B1220', '#101B30'],
  });

  return (
    <Animated.View style={{ flex: 1, backgroundColor: bgColors }} onLayout={onLayoutRootView}>
      <LinearGradient
        colors={['#0B1220', '#101B30', '#15233E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <Animated.Text style={[styles.appName, { opacity: anim }]}>
            FactoryPulse
          </Animated.Text>
          <Text style={styles.subtitle}>Enterprise Monitoring Platform</Text>
        </View>

        {/* Action cards */}
        <View style={styles.cards}>
          <ActionCard
            icon="business-outline"
            title="Factory Status"
            delay={200}
            showPreview
            onPress={() => router.push('/(tabs)/HomeScreen')}
          />
          <ActionCard
            icon="analytics-outline"
            title="Tag Selection"
            delay={400}
            onPress={() => router.push('/(tabs)/LineChartScreen')}
          />
          <ActionCard
            icon="albums-outline"
            title="Saved Reports"
            delay={600}
            onPress={() => router.push('/saved-templates')}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/* ---------- Components ---------- */

function ActionCard({
  icon,
  title,
  onPress,
  delay,
  showPreview,
}: {
  icon: any;
  title: string;
  onPress: () => void;
  delay: number;
  showPreview?: boolean;
}) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity, width: '100%' }}>
      <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={{ width: '100%' }}>
        <LinearGradient
          colors={[tokens.primary, tokens.accent, tokens.highlight]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.cardBorder}
        >
          <View style={styles.cardInner}>
            {/* Sol taraf: ikon + yazı */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconChip}>
                <Ionicons name={icon} size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.cardTitle}>{title}</Text>
            </View>

            {/* Sağ taraf: watermark grafik */}
            {showPreview && (
              <View style={styles.previewChart}>
                <View style={{ opacity: 0.15 }}>
                  <LineChart
                    data={[
                      { value: 40 },
                      { value: 65 },
                      { value: 55 },
                      { value: 75 },
                      { value: 60 },
                      { value: 90 },
                    ]}
                    thickness={2}
                    color1={tokens.primary}
                    hideDataPoints
                    curved
                    height={40}
                    width={100}
                    xAxisThickness={0}
                    yAxisThickness={0}
                    backgroundColor="transparent"
                  />
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 100,
  },
  header: {
    marginBottom: 50,
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    color: tokens.primary,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#00E5FF99',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  subtitle: {
    fontSize: 17,
    color: tokens.textDim,
    marginTop: 10,
    fontWeight: '500',
  },
  cards: {
    width: '100%',
    gap: 22,
  },
  cardBorder: {
    width: '100%',
    borderRadius: tokens.radius,
    padding: 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: tokens.radius - 1,
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', // 🔹 grafik kart dışına taşmaz
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  previewChart: {
    position: 'absolute',
    right: 10,
    bottom: 5,
  },
});
