import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Newsreader_600SemiBold, Newsreader_700Bold } from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  DarkTheme,
  DefaultTheme,
  SplashScreen,
  Stack,
  ThemeProvider,
  type Theme,
} from 'expo-router';

import { createQueryClient } from '@/lib/queryClient';
import { fonts, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: Inter_400Regular,
    [fonts.medium]: Inter_500Medium,
    [fonts.semibold]: Inter_600SemiBold,
    [fonts.bold]: Inter_700Bold,
    [fonts.serifSemibold]: Newsreader_600SemiBold,
    [fonts.serifBold]: Newsreader_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  const navigationTheme = useMemo<Theme>(() => {
    const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: colorScheme === 'dark',
      colors: {
        ...base.colors,
        primary: theme.colors.accent,
        background: theme.colors.background,
        card: theme.colors.background,
        text: theme.colors.text,
        border: theme.colors.hairline,
      },
      fonts: {
        ...base.fonts,
        regular: { ...base.fonts.regular, fontFamily: fonts.regular },
        medium: { ...base.fonts.medium, fontFamily: fonts.medium },
        bold: { ...base.fonts.bold, fontFamily: fonts.bold },
        heavy: { ...base.fonts.heavy, fontFamily: fonts.bold },
      },
    };
  }, [colorScheme, theme.colors]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: theme.colors.background },
              headerStyle: { backgroundColor: theme.colors.background },
              headerTintColor: theme.colors.accent,
              headerTitleStyle: { color: theme.colors.text, fontFamily: fonts.semibold },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="activity/[id]" options={{ title: '' }} />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
