import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'AggieFeed',
  slug: 'aggiefeed',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    ...config.ios,
    supportsTablet: true,
    bundleIdentifier: 'com.imjustchew.aggiefeed',
  },
  android: {
    ...config.android,
    adaptiveIcon: {
      backgroundColor: '#022851',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.imjustchew.aggiefeed',
  },
  web: {
    ...config.web,
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    [
      'expo-build-properties',
      {
        ios: {
          enableSceneSupport: true,
        },
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        backgroundColor: '#022851',
        dark: {
          backgroundColor: '#022851',
        },
        imageWidth: 200,
        resizeMode: 'contain',
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
      },
    ],
  ],
  scheme: 'aggiefeed',
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      projectId: 'b57e9949-f475-4cfb-b299-5637d9ff046a',
    },
  },
  experiments: {
    ...config.experiments,
    typedRoutes: true,
  },
});
