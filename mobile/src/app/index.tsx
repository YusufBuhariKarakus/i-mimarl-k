import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { colors, radius, space } from '../lib/theme';
import { useWallet } from '../lib/wallet';

const STEPS = [
  { emoji: '📷', title: 'Odanın fotoğrafını çek', text: 'Ya da galeriden seç.' },
  { emoji: '🎨', title: 'Stilini seç', text: 'Modern, İskandinav, Japandi ve fazlası.' },
  { emoji: '✨', title: '20 saniyede yeni odan', text: 'Beğendiğin tasarımı iç mimarımıza projelendir.' },
];

export default function Home() {
  const wallet = useWallet();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Odanı yapay zekâ ile{'\n'}saniyeler içinde yeniden tasarla</Text>
        <Text style={styles.subtitle}>
          Tadilata para harcamadan önce sonucu gör. Beğenirsen gerçek bir iç mimar projelendirsin.
        </Text>
      </View>

      <View style={styles.balance}>
        <Text style={styles.balanceText}>
          {wallet.isPro ? '⭐ Pro üye · Sınırsız tasarım' : `Kalan tasarım hakkı: ${wallet.credits}`}
        </Text>
        {!wallet.isPro && (
          <Link href="/paywall" style={styles.link}>
            Pro’ya geç
          </Link>
        )}
      </View>

      <Button title="Fotoğraf yükle ve başla" onPress={() => router.push('/create')} disabled={!wallet.ready} />

      <View style={styles.steps}>
        {STEPS.map((s) => (
          <View key={s.title} style={styles.step}>
            <Text style={styles.stepEmoji}>{s.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <Button title="İç mimardan profesyonel destek al" variant="secondary" onPress={() => router.push('/designer')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, gap: space.lg },
  hero: { gap: space.sm, paddingTop: space.md },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, lineHeight: 34 },
  subtitle: { fontSize: 16, color: colors.muted, lineHeight: 22 },
  balance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceText: { color: colors.text, fontWeight: '600' },
  link: { color: colors.primary, fontWeight: '700' },
  steps: { gap: space.md },
  step: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  stepEmoji: { fontSize: 28 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  stepText: { color: colors.muted },
});
