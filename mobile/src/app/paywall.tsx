import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { track } from '../lib/analytics';
import { PRODUCTS, type Product } from '../lib/catalog';
import { isPurchaseCancelled, purchases } from '../lib/purchases';
import { colors, radius, space } from '../lib/theme';
import { useWallet } from '../lib/wallet';

const BENEFITS = [
  'Sınırsız oda tasarımı',
  '8 stilin tamamı (Japandi, Endüstriyel, Bohem…)',
  'Filigransız, yüksek çözünürlüklü indirme',
  'Abonelikleri istediğin zaman iptal edebilirsin',
];

export default function Paywall() {
  const wallet = useWallet();
  const { trigger = 'direct' } = useLocalSearchParams<{ trigger?: string }>();
  const [selected, setSelected] = useState(PRODUCTS[0].id);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    track('paywall_viewed', { trigger });
  }, [trigger]);

  useEffect(() => {
    // Mağazadan yerel fiyatları al; başarısız olursa katalogdaki yedek fiyatlar kalır.
    purchases.getProducts().then(setProducts).catch(() => {});
  }, []);

  async function purchase() {
    setLoading(true);
    track('purchase_started', { productId: selected, trigger });
    try {
      await wallet.buy(selected);
      track('purchase_succeeded', { productId: selected, trigger });
      router.back();
    } catch (e) {
      if (isPurchaseCancelled(e)) return;
      track('purchase_failed', { productId: selected });
      Alert.alert('Satın alma tamamlanamadı', e instanceof Error ? e.message : 'Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  async function restore() {
    try {
      await wallet.restore();
      Alert.alert('Geri yükleme tamamlandı', 'Satın alımların hesabına işlendi.');
    } catch (e) {
      Alert.alert('Geri yüklenemedi', e instanceof Error ? e.message : 'Lütfen tekrar deneyin.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hayalindeki odayı sınırsız tasarla</Text>
      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <Text key={b} style={styles.benefit}>
            ✓ {b}
          </Text>
        ))}
      </View>

      {products.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => setSelected(p.id)}
          style={[styles.plan, selected === p.id && styles.planSelected]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>
              {p.title}
              {p.badge ? <Text style={styles.badge}>  {p.badge}</Text> : null}
            </Text>
            <Text style={styles.planSubtitle}>{p.subtitle}</Text>
          </View>
          <Text style={styles.price}>{p.priceLabel}</Text>
        </Pressable>
      ))}

      <Button title="Devam et" onPress={purchase} loading={loading} />
      <Pressable onPress={restore}>
        <Text style={styles.restore}>Satın alımları geri yükle</Text>
      </Pressable>
      <Text style={styles.legal}>
        Abonelikler, dönem bitiminden en az 24 saat önce iptal edilmezse otomatik yenilenir. Hesap ayarlarınızdan
        istediğiniz zaman iptal edebilirsiniz.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, gap: space.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  benefits: { gap: space.xs },
  benefit: { fontSize: 15, color: colors.text },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  planSelected: { borderColor: colors.primary },
  planTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  badge: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  planSubtitle: { color: colors.muted, marginTop: 2 },
  price: { fontWeight: '700', color: colors.text },
  restore: { textAlign: 'center', color: colors.primary, fontWeight: '600' },
  legal: { fontSize: 11, color: colors.muted, textAlign: 'center' },
});
