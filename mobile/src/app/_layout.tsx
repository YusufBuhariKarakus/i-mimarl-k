import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { track } from '../lib/analytics';
import { colors } from '../lib/theme';
import { WalletProvider } from '../lib/wallet';

export default function RootLayout() {
  useEffect(() => {
    track('app_open');
  }, []);

  return (
    <WalletProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: colors.text,
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'OdaAI' }} />
        <Stack.Screen name="create" options={{ title: 'Yeni Tasarım' }} />
        <Stack.Screen name="result" options={{ title: 'Sonuç' }} />
        <Stack.Screen name="paywall" options={{ title: 'Pro’ya Geç', presentation: 'modal' }} />
        <Stack.Screen name="designer" options={{ title: 'İç Mimardan Destek' }} />
      </Stack>
    </WalletProvider>
  );
}
