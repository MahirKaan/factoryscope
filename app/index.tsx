// app/index.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // 3 saniye boyunca splash.png göster
    const timer = setTimeout(() => {
      setShowSplash(false);
      router.replace('/main');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  if (showSplash) {
    return (
      <ImageBackground
        source={require('../assets/splash.png')}
        style={styles.splash}
        resizeMode="cover"  // "contain" yapabilirsin resmi bozmamak için
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
