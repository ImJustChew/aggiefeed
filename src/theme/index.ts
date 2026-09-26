import { useColorScheme } from 'react-native';

const light = {
  background: '#FFFFFF',
  text: '#111111',
  textSecondary: '#5F5F5F',
  textTertiary: '#8E8E8E',
  hairline: '#E8E8E6',
  accent: '#022851',
  accentText: '#FFFFFF',
  highlight: '#B08300',
};

type Palette = typeof light;

const dark: Palette = {
  background: '#0E0E0E',
  text: '#F2F2F2',
  textSecondary: '#A8A8A8',
  textTertiary: '#767676',
  hairline: '#262626',
  accent: '#DDE7F3',
  accentText: '#0E0E0E',
  highlight: '#FFBF00',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
};

export type AppTheme = {
  colors: Palette;
  fonts: typeof fonts;
  spacing: typeof spacing;
};

export function useTheme(): AppTheme {
  const colorScheme = useColorScheme();

  return {
    colors: colorScheme === 'dark' ? dark : light,
    fonts,
    spacing,
  };
}
