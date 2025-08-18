// app/MainScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

const { width, height } = Dimensions.get('window');

const tokens = {
  primary: '#0D47A1',
  accent: '#1565C0',
  surface: 'rgba(255,255,255,0.08)',
  text: '#EAF6F8',
  textDim: '#9AB3BA',
  radius: 22,
};

/* 🌌 Aurora Background */
function AuroraBackground() {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim1, { toValue: 1, duration: 15000, useNativeDriver: true }),
        Animated.timing(anim1, { toValue: 0, duration: 15000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(anim2, { toValue: 1, duration: 18000, useNativeDriver: true }),
        Animated.timing(anim2, { toValue: 0, duration: 18000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateX1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [-120, 120] });
  const translateY1 = anim1.interpolate({ inputRange: [0, 1], outputRange: [80, -100] });

  const translateX2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [100, -150] });
  const translateY2 = anim2.interpolate({ inputRange: [0, 1], outputRange: [-60, 90] });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: '#2196F3',
          opacity: 0.18,
          transform: [{ translateX: translateX1 }, { translateY: translateY1 }],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: '#1976D2',
          opacity: 0.15,
          transform: [{ translateX: translateX2 }, { translateY: translateY2 }],
        }}
      />
    </View>
  );
}

/* ✨ Particle Effect */
function ParticleBackground() {
  const particles = Array.from({ length: 15 }, (_, i) => i);
  const anims = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach((anim) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 8000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {particles.map((_, i) => {
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [height + 50, -50],
        });

        const translateX = Math.random() * width;

        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              borderRadius: 2,
              backgroundColor: '#80D8FF',
              opacity: 0.7,
              transform: [{ translateX }, { translateY }],
            }}
          />
        );
      })}
    </View>
  );
}

export default function MainScreen() {
  const router = useRouter();

  const onLayoutRootView = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <LinearGradient
        colors={['#08111F', '#0B1527', '#0E2140']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* 🌌 Aurora + ✨ Particles */}
        <AuroraBackground />
        <ParticleBackground />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Trend Interface</Text>
          <Text style={styles.subtitle}>Enterprise Monitoring Platform</Text>
        </View>

        {/* Action cards */}
        <View style={styles.cards}>
          <ActionCard
            icon="business-outline"
            title="Factory Status"
            delay={200}
            showPreview
            onNavigate={() => router.push('/(tabs)/HomeScreen')}
          />
          <ActionCard
            icon="analytics-outline"
            title="Tag Selection"
            delay={400}
            onNavigate={() => router.push('/(tabs)/LineChartScreen')}
          />
          <ActionCard
            icon="albums-outline"
            title="Saved Reports"
            delay={600}
            onNavigate={() => router.push('/saved-templates')}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

/* 🎴 Action Card */
function ActionCard({
  icon,
  title,
  onNavigate,
  delay,
  showPreview,
}: {
  icon: any;
  title: string;
  onNavigate: () => void;
  delay: number;
  showPreview?: boolean;
}) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, delay, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(gradientAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const handlePress = () => {
    Animated.spring(pressScale, {
      toValue: 1.1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start(() => {
      // 👉 animasyon bittikten sonra navigation
      onNavigate();
    });
  };

  const translateX = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-250, 250],
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { scale: pressScale }], opacity, width: '100%' }}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={{ width: '100%' }}
      >
        {/* Gradient Border */}
        <View style={styles.cardBorder}>
          <Animated.View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: tokens.radius,
              overflow: 'hidden',
              transform: [{ translateX }],
            }}
          >
            <LinearGradient
              colors={['#42a5f5', '#00e5ff', '#7c4dff', '#42a5f5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/* Kart içi */}
          <BlurView intensity={40} tint="dark" style={styles.cardInner}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Hologram Icon */}
              <View style={styles.iconChipBorder}>
                <LinearGradient
                  colors={['#42a5f5', '#00e5ff', '#7c4dff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconChip}
                >
                  <Ionicons name={icon} size={26} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={styles.cardTitle}>{title}</Text>
            </View>

            {showPreview && (
              <View style={styles.previewChart}>
                <View style={{ opacity: 0.25 }}>
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
                    color1={tokens.accent}
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
          </BlurView>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 26, paddingTop: 100 },
  header: { marginBottom: 50, alignItems: 'center' },
  appName: {
    fontSize: 36,
    color: tokens.accent,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: '#1E88E588',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  subtitle: {
    fontSize: 17,
    color: tokens.textDim,
    marginTop: 10,
    fontWeight: '500',
  },
  cards: { width: '100%', gap: 22 },
  cardBorder: {
    borderRadius: tokens.radius,
    overflow: 'hidden',
    position: 'relative',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 22,
    borderRadius: tokens.radius - 1,
    backgroundColor: 'rgba(20,25,40,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconChipBorder: {
    borderRadius: 25,
    padding: 2,
    marginRight: 16,
    shadowColor: '#00e5ff',
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  iconChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.4 },
  previewChart: { position: 'absolute', right: 10, bottom: 5 },
});
