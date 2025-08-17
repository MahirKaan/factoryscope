// app/MainScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const tokens = {
  primary: '#00E5FF',
  surface: 'rgba(255,255,255,0.06)',
  text: '#EAF6F8',
  textDim: '#9AB3BA',
  // gradient katmanları: en açık -> en koyu
  bgTop: '#0f2027',
  bgMid: '#203a43',
  bgBot: '#2c5364', // en açık
  radius: 18,
};

export default function MainScreen() {
  const router = useRouter();

  const onLayoutRootView = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <LinearGradient
  // Sağda parlak, solda koyu (sağdan sola akış)
  colors={[tokens.bgBot, tokens.bgMid, tokens.bgTop]}
  start={{ x: 1, y: 0.5 }}
  end={{ x: 0, y: 0.5 }}
  style={styles.container}
  onLayout={onLayoutRootView}
>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>FactoryPulse</Text>
        <Text style={styles.subtitle}>Choose an action</Text>
      </View>

      {/* Action cards only */}
      <View style={styles.cards}>
        <ActionCard
          icon="speedometer-outline"
          title="Factory Status"
          onPress={() => router.push('/(tabs)/HomeScreen')}
        />
        <ActionCard
          icon="list-outline"
          title="Tag Selection"
          onPress={() => router.push('/(tabs)/LineChartScreen')}
        />
        <ActionCard
          icon="bookmark-outline"
          title="Saved"
          onPress={() => router.push('/saved-templates')}
        />
      </View>
    </LinearGradient>
  );
}

/* ---------- Components ---------- */

function ActionCard({
  icon,
  title,
  onPress,
}: {
  icon: any; // Ionicons name
  title: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.timing(scale, { toValue: 0.98, duration: 100, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={{ width: '100%' }}
      >
        {/* Yatay border gradient (soldan sağa) */}
        <LinearGradient
          colors={[tokens.primary, 'rgba(0,229,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.cardBorder}
        >
          <View style={styles.cardInner}>
            {/* İkon çipi: her zeminde net */}
            <View style={styles.iconChip}>
              <Ionicons name={icon} size={18} color="#FFFFFF" />
            </View>

            <Text style={styles.cardTitle}>{title}</Text>
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
    paddingHorizontal: 22,
    paddingTop: 80,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    color: tokens.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: tokens.textDim,
    marginTop: 6,
  },
  cards: {
    width: '100%',
    gap: 14,
  },
  cardBorder: {
    width: '100%',
    borderRadius: tokens.radius,
    padding: 1.5,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: tokens.radius - 1,
    backgroundColor: tokens.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  // ikon çipi
  iconChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

