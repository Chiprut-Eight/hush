import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hush.social',
  appName: 'HUSH',
  webDir: 'dist',
  server: {
    // Allows loading from the local web assets bundled in the APK
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0A0E17',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0E17',
    },
  },
};

export default config;
