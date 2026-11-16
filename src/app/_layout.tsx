import { useEffect, useMemo, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { useDatabaseMigrations } from '@/db/useDatabaseMigrations';
import { markCacheReady, pruneApiCache } from '@/db/apiCacheStorage';
import { DrizzleStudio } from '@/components/DrizzleStudio';
import { fonts, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const queryClient = createQueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const { success: migrationsSucceeded, error: migrationError } = useDatabaseMigrations();
  const cachePruneStarted = useRef(false);
  const [fontsLoaded, fontError] = useFonts({
    [fonts.regular]: Inter_400Regular,
    [fonts.medium]: Inter_500Medium,
    [fonts.semibold]: Inter_600SemiBold,
    [fonts.bold]: Inter_700Bold,
    [fonts.serifSemibold]: Newsreader_600SemiBold,
    [fonts.serifBold]: Newsreader_700Bold,
  });

  const fontsReady = fontsLoaded || fontError !== null;
  const migrationsSettled = migrationsSucceeded || migrationError !== undefined;
  // Mark synchronously: child screens' query effects run before this component's effects.
  if (migrationsSucceeded) markCacheReady();

  useEffect(() => {
    if (migrationError) {
      if (__DEV__) {
        // eslint-disable-next-line no-console -- offline storage is best-effort; report failures in development.
        console.warn('Database migrations failed; offline cache is disabled.', migrationError);
      }
      return;
    }

    if (!migrationsSucceeded) return;

    if (cachePruneStarted.current) return;
    cachePruneStarted.current = true;
    void pruneApiCache().catch((error: unknown) => {
      if (__DEV__) {
        // eslint-disable-next-line no-console -- cache maintenance is diagnostic-only in development.
        console.warn('API cache pruning failed.', error);
      }
    });
  }, [migrationError, migrationsSucceeded]);

  useEffect(() => {
    if (fontsReady && migrationsSettled) void SplashScreen.hideAsync();
  }, [fontsReady, migrationsSettled]);

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

  if (!fontsReady || !migrationsSettled) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <DrizzleStudio>
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: theme.colors.background },
                  headerStyle: { backgroundColor: theme.colors.background },
                  headerTintColor: theme.colors.accent,
                  headerTitleStyle: { color: theme.colors.text, fontFamily: fonts.semibold },
                  headerShadowVisible: false,
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false, title: 'Feed' }} />
                <Stack.Screen
                  name="activity/[id]"
                  options={{
                    headerBackButtonDisplayMode: 'default',
                    headerBackTitle: 'Feed',
                    title: '',
                  }}
                />
                <Stack.Screen
                  name="locations/index"
                  options={{ headerBackTitle: 'Feed', headerShown: false, title: 'Locations' }}
                />
              </Stack>
            </DrizzleStudio>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
