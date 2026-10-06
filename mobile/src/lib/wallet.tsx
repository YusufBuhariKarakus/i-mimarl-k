// Kullanıcının hakları: kredi bakiyesi ve Pro abonelik durumu.
//
// MVP'de cihazda tutulur. Üretimde gerçek kaynak RevenueCat entitlement'ları
// ve sunucudaki kredi bakiyesi olmalı; aksi halde bakiye istemciden
// manipüle edilebilir (sunucu tarafı ücretsiz kotayı zaten ayrıca uygular).

import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { FREE_CREDITS } from './catalog';
import { purchases } from './purchases';

const STORAGE_KEY = 'odaai.wallet.v1';

interface WalletState {
  deviceId: string;
  credits: number;
  isPro: boolean;
  // Herhangi bir satın alma yapıldıysa: filigran kalkar, premium stiller açılır.
  hasPaid: boolean;
}

interface Wallet extends WalletState {
  ready: boolean;
  canGenerate: boolean;
  consumeCredit(): void;
  buy(productId: string): Promise<void>;
  restore(): Promise<void>;
}

const WalletContext = createContext<Wallet | null>(null);

function newDeviceId() {
  return `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function load(): Promise<WalletState | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WalletState) : null;
  } catch {
    return null;
  }
}

async function save(state: WalletState) {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Web gibi SecureStore olmayan ortamlarda yalnızca bellek içi çalışır.
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ deviceId: '', credits: 0, isPro: false, hasPaid: false });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    load().then((stored) => {
      setState(stored ?? { deviceId: newDeviceId(), credits: FREE_CREDITS, isPro: false, hasPaid: false });
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) save(state);
  }, [ready, state]);

  const consumeCredit = useCallback(() => {
    setState((s) => (s.isPro ? s : { ...s, credits: Math.max(0, s.credits - 1) }));
  }, []);

  const buy = useCallback(async (productId: string) => {
    const { product } = await purchases.purchase(productId);
    setState((s) =>
      product.kind === 'subscription'
        ? { ...s, isPro: true, hasPaid: true }
        : { ...s, credits: s.credits + (product.credits ?? 0), hasPaid: true },
    );
  }, []);

  const restore = useCallback(async () => {
    const { isPro } = await purchases.restore();
    setState((s) => (isPro ? { ...s, isPro: true, hasPaid: true } : s));
  }, []);

  const value = useMemo<Wallet>(
    () => ({
      ...state,
      ready,
      canGenerate: state.isPro || state.credits > 0,
      consumeCredit,
      buy,
      restore,
    }),
    [state, ready, consumeCredit, buy, restore],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): Wallet {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error('useWallet, WalletProvider içinde kullanılmalı');
  return wallet;
}
