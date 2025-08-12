// app/index.tsx
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ImageBackground } from 'react-native';

const isExpoGo = Constants.appOwnership === 'expo';
if (!isExpoGo) SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/MainScreen'), 3000);
    return () => clearTimeout(t);
  }, [router]);

  if (isExpoGo) {
    return (
      <ImageBackground
         source={require('../../assets/splash.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      />
    );
  }

  return null; // dev/prod build'de native splash açık kalır
}
