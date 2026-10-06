// Satın alma katmanı. Uygulamanın geri kalanı yalnızca bu arayüzü bilir.
//
// EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
// tanımlıysa RevenueCat kullanılır (development build ya da mağaza sürümü
// gerekir); tanımlı değilse her satın almayı başarılı sayan sahte mağaza
// devreye girer. Her iki durumda da hakları sunucu doğrular.

import { Platform } from 'react-native';
import Purchases, { type PurchasesStoreProduct } from 'react-native-purchases';

import { PRODUCTS, type Product } from './catalog';

export interface PurchasesClient {
  readonly mode: 'revenuecat' | 'mock';
  configure(appUserId: string): void;
  // Mağazadan gelen yerel fiyatlarla birlikte ürünler.
  getProducts(): Promise<Product[]>;
  purchase(productId: string): Promise<void>;
  restore(): Promise<void>;
}

class PurchaseCancelledError extends Error {}

export function isPurchaseCancelled(e: unknown) {
  return e instanceof PurchaseCancelledError;
}

function createRevenueCat(apiKey: string): PurchasesClient {
  const storeProducts = new Map<string, PurchasesStoreProduct>();

  async function loadStoreProducts() {
    if (storeProducts.size > 0) return;
    const subs = PRODUCTS.filter((p) => p.kind === 'subscription').map((p) => p.id);
    const credits = PRODUCTS.filter((p) => p.kind === 'credits').map((p) => p.id);
    const [a, b] = await Promise.all([
      Purchases.getProducts(subs, Purchases.PRODUCT_CATEGORY.SUBSCRIPTION),
      Purchases.getProducts(credits, Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    ]);
    for (const p of [...a, ...b]) storeProducts.set(p.identifier, p);
  }

  return {
    mode: 'revenuecat',
    configure(appUserId) {
      Purchases.configure({ apiKey, appUserID: appUserId });
    },
    async getProducts() {
      await loadStoreProducts();
      return PRODUCTS.map((p) => {
        const store = storeProducts.get(p.id);
        return store ? { ...p, priceLabel: store.priceString } : p;
      });
    },
    async purchase(productId) {
      await loadStoreProducts();
      const product = storeProducts.get(productId);
      if (!product) throw new Error('Ürün mağazada bulunamadı.');
      try {
        await Purchases.purchaseStoreProduct(product);
      } catch (e) {
        if ((e as { userCancelled?: boolean }).userCancelled) throw new PurchaseCancelledError();
        throw e;
      }
    },
    async restore() {
      await Purchases.restorePurchases();
    },
  };
}

function createMock(): PurchasesClient {
  return {
    mode: 'mock',
    configure() {},
    async getProducts() {
      return PRODUCTS;
    },
    async purchase(productId) {
      if (!PRODUCTS.some((p) => p.id === productId)) throw new Error(`Bilinmeyen ürün: ${productId}`);
      await new Promise((r) => setTimeout(r, 600));
    },
    async restore() {},
  };
}

const apiKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

export const purchases: PurchasesClient = apiKey ? createRevenueCat(apiKey) : createMock();
