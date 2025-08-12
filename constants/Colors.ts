// theme/Colors.ts

export const lightColors = {
  primary: '#007bff',
  secondary: '#4e8ef7',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#000000',
  textSecondary: '#6e6e6e',
  textDim: '#888888',
  border: '#cccccc',
  shadow: '#00000020',
  icon: '#555555',
  disabled: '#cccccc',
  searchBackground: '#f0f0f0',
  selectionCard: '#e0f0ff',
  success: '#4CAF50',
  error: '#F44336',
  info: '#2196F3',
  warning: '#FFC107',
};

export const darkColors = {
  primary: '#0a84ff',
  secondary: '#4e8ef7',
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  textDim: '#aaaaaa',
  border: '#333333',
  shadow: '#00000050',
  icon: '#4ad8ff',
  disabled: '#444444',
  searchBackground: '#152e40',
  selectionCard: '#1a2a3a',
  success: '#81C784',
  error: '#EF9A9A',
  info: '#64B5F6',
  warning: '#FFD54F',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export type ThemeColors = typeof lightColors;
