import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Native application identity. Treat `appId` as permanent once the first Play
 * Store build is published: changing it creates a different Android app.
 */
const config: CapacitorConfig = {
  appId: 'app.pitchnest',
  appName: 'PitchNest',
  webDir: 'dist',
  backgroundColor: '#FAFBFC',
  loggingBehavior: 'debug',
  android: {
    allowMixedContent: false,
    backgroundColor: '#FAFBFC',
    minWebViewVersion: 119,
  },
  server: {
    hostname: 'localhost',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchFadeOutDuration: 220,
      backgroundColor: '#FAFBFC',
      showSpinner: false,
    },
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'LIGHT',
      hidden: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
