import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ImageBackground } from 'react-native';

const splashImage = require('../assets/splash.png');
const isExpoGo = Constants.appOwnership === 'expo';

export default function SplashScreenCustom({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const startTimer = async () => {
      if (!isExpoGo) {
        await SplashScreen.preventAutoHideAsync().catch(() => {});
      }

      timer = setTimeout(async () => {
        if (!isExpoGo) {
          await SplashScreen.hideAsync().catch(() => {});
        }
        router.replace(redirectTo);
      }, 3000); // 3 saniye bekle
    };

    startTimer();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [router]);

  return (
    <ImageBackground
      source={splashImage}
      style={{ flex: 1 }}
      resizeMode="cover"
    />
  );
}
