// Satın alma katmanı. Uygulamanın geri kalanı yalnızca bu arayüzü bilir;
// böylece RevenueCat (önerilen) ya da doğrudan StoreKit/Play Billing
// entegrasyonu ekranlara dokunmadan takılabilir.
//
// Üretimde: `npx expo install react-native-purchases` ile RevenueCat ekleyin,
// `createRevenueCatPurchases()` yazıp `purchases` export'unu ona çevirin.
// Expo Go yerel satın alma modüllerini içermez; development build gerekir.

import { PRODUCTS, type Product } from './catalog';

export interface PurchaseResult {
  product: Product;
  // Mağazanın verdiği işlem kimliği; sunucu tarafında doğrulama için saklanır.
  transactionId: string;
}

export interface Purchases {
  getProducts(): Promise<Product[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  restore(): Promise<{ isPro: boolean }>;
}

// Geliştirme için sahte mağaza: her satın almayı başarılı sayar.
function createMockPurchases(): Purchases {
  return {
    async getProducts() {
      return PRODUCTS;
    },
    async purchase(productId) {
      const product = PRODUCTS.find((p) => p.id === productId);
      if (!product) throw new Error(`Bilinmeyen ürün: ${productId}`);
      await new Promise((r) => setTimeout(r, 600));
      return { product, transactionId: `mock_${Date.now()}` };
    },
    async restore() {
      return { isPro: false };
    },
  };
}

export const purchases: Purchases = createMockPurchases();
