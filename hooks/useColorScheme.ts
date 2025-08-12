import { useColorScheme as _useColorScheme } from 'react-native';

/**
 * Bu hook cihazın tema ayarını okur.
 * Eğer geçerli bir tema yoksa 'light' varsayılanı döner.
 */
export function useColorScheme(): 'light' | 'dark' {
  const theme = _useColorScheme();
  if (theme === 'dark' || theme === 'light') {
    return theme;
  }
  return 'light';
}
