// Kullanıcının haklarının tek doğru kaynağı.
//
// Üretim: RevenueCat REST API (REVENUECAT_SECRET_KEY). Uygulama RevenueCat'e
// appUserID = deviceId ile giriş yapar; abonelik "pro" entitlement'ından,
// satın alınan krediler ise tüketilebilir (non-subscription) alımlardan okunur.
// Geliştirme: anahtar yoksa sahte mağazanın /v1/dev/grant ile yazdığı kayıtlar.

import { getDevice } from './store.ts';

export const FREE_CREDITS = Number(process.env.FREE_CREDITS ?? 1);
export const PRO_ENTITLEMENT = process.env.REVENUECAT_ENTITLEMENT ?? 'pro';

// Mağaza ürün kimliği → verdiği kredi. Mobil `catalog.ts` ile aynı olmalı.
export const CREDIT_PRODUCTS: Record<string, number> = {
  odaai_credits_10: 10,
  odaai_credits_50: 50,
};
export const SUBSCRIPTION_PRODUCTS = ['odaai_pro_weekly', 'odaai_pro_yearly'];

export interface Entitlement {
  isPro: boolean;
  purchasedCredits: number;
}

export interface Wallet {
  isPro: boolean;
  hasPaid: boolean;
  credits: number;
}

export function revenueCatEnabled() {
  return Boolean(process.env.REVENUECAT_SECRET_KEY);
}

interface RevenueCatSubscriber {
  subscriber: {
    entitlements: Record<string, { expires_date: string | null }>;
    non_subscriptions: Record<string, unknown[]>;
  };
}

const cache = new Map<string, { at: number; value: Entitlement }>();
const CACHE_MS = 30_000;

async function fromRevenueCat(deviceId: string): Promise<Entitlement> {
  const hit = cache.get(deviceId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(deviceId)}`, {
    headers: { Authorization: `Bearer ${process.env.REVENUECAT_SECRET_KEY}` },
  });
  if (!res.ok) throw new Error(`RevenueCat hatası (${res.status})`);
  const { subscriber } = (await res.json()) as RevenueCatSubscriber;

  const pro = subscriber.entitlements[PRO_ENTITLEMENT];
  const isPro = Boolean(pro && (pro.expires_date === null || Date.parse(pro.expires_date) > Date.now()));
  let purchasedCredits = 0;
  for (const [productId, purchases] of Object.entries(subscriber.non_subscriptions)) {
    purchasedCredits += (CREDIT_PRODUCTS[productId] ?? 0) * purchases.length;
  }
  const value = { isPro, purchasedCredits };
  cache.set(deviceId, { at: Date.now(), value });
  return value;
}

export function invalidate(deviceId: string) {
  cache.delete(deviceId);
}

export async function getWallet(deviceId: string): Promise<Wallet> {
  const device = getDevice(deviceId);
  const ent = revenueCatEnabled()
    ? await fromRevenueCat(deviceId)
    : { isPro: device.devPro, purchasedCredits: device.devCredits };
  return {
    isPro: ent.isPro,
    hasPaid: ent.isPro || ent.purchasedCredits > 0,
    credits: Math.max(0, FREE_CREDITS + ent.purchasedCredits - device.used),
  };
}
