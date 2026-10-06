// Kullanıcının hakları: kredi bakiyesi ve Pro abonelik durumu.
//
// Doğru kaynak sunucudur (RevenueCat + kullanım kaydı). Cihazda yalnızca
// kalıcı cihaz kimliği ve çevrimdışı açılış için son bilinen bakiye tutulur.

import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchWallet, syncPurchase, type ServerWallet } from './api';
import { purchases } from './purchases';

const STORAGE_KEY = 'odaai.wallet.v2';

interface Stored extends ServerWallet {
  deviceId: string;
}

interface Wallet extends Stored {
  ready: boolean;
  canGenerate: boolean;
  // Sunucudan gelen güncel bakiyeyi uygular (ör. üretim yanıtından).
  apply(wallet: ServerWallet): void;
  refresh(): Promise<void>;
  buy(productId: string): Promise<void>;
  restore(): Promise<void>;
}

const WalletContext = createContext<Wallet | null>(null);

const EMPTY: Stored = { deviceId: '', credits: 0, isPro: false, hasPaid: false };

function newDeviceId() {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function load(): Promise<Stored | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

async function save(state: Stored) {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Web gibi SecureStore olmayan ortamlarda yalnızca bellek içi çalışır.
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>(EMPTY);
  const [ready, setReady] = useState(false);

  const apply = useCallback((w: ServerWallet) => {
    setState((s) => ({ ...s, isPro: w.isPro, hasPaid: w.hasPaid, credits: w.credits }));
  }, []);

  useEffect(() => {
    (async () => {
      const stored = (await load()) ?? { ...EMPTY, deviceId: newDeviceId() };
      purchases.configure(stored.deviceId);
      setState(stored);
      setReady(true);
      try {
        apply(await fetchWallet(stored.deviceId));
      } catch {
        // Çevrimdışı: son bilinen bakiyeyle devam; sunucu üretimde yine doğrular.
      }
    })();
  }, [apply]);

  useEffect(() => {
    if (ready) save(state);
  }, [ready, state]);

  const refresh = useCallback(async () => {
    apply(await fetchWallet(state.deviceId));
  }, [apply, state.deviceId]);

  const buy = useCallback(
    async (productId: string) => {
      await purchases.purchase(productId);
      apply(await syncPurchase(state.deviceId, productId));
    },
    [apply, state.deviceId],
  );

  const restore = useCallback(async () => {
    await purchases.restore();
    apply(await syncPurchase(state.deviceId));
  }, [apply, state.deviceId]);

  const value = useMemo<Wallet>(
    () => ({
      ...state,
      ready,
      canGenerate: state.isPro || state.credits > 0,
      apply,
      refresh,
      buy,
      restore,
    }),
    [state, ready, apply, refresh, buy, restore],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): Wallet {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error('useWallet, WalletProvider içinde kullanılmalı');
  return wallet;
}
