import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { track } from '../lib/analytics';
import { STYLES } from '../lib/catalog';
import { DEMO } from '../lib/demo';
import { getLastResult } from '../lib/session';
import { colors, radius, space } from '../lib/theme';

export default function Result() {
  const result = getLastResult();
  const [showBefore, setShowBefore] = useState(false);

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Henüz bir tasarım yok.</Text>
        <Button title="Yeni tasarım" onPress={() => router.replace('/create')} />
      </View>
    );
  }

  const styleName = STYLES.find((s) => s.id === result.style)?.name ?? result.style;

  async function share() {
    // Paylaşımlar ücretsiz büyüme kanalı: filigran ve uygulama linki birlikte gider.
    const link = result!.afterUrl.startsWith('http') ? ` ${result!.afterUrl}` : '';
    try {
      await Share.share({ message: `OdaAI ile odamı ${styleName} stilde yeniden tasarladım!${link}` });
      track('result_saved', { method: 'share' });
    } catch {
      // Paylaşım desteklenmiyor (ör. bazı tarayıcılar) ya da kullanıcı vazgeçti.
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPressIn={() => setShowBefore(true)} onPressOut={() => setShowBefore(false)}>
        <Image
          source={{ uri: showBefore ? result.beforeUri : result.afterUrl }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
        <Text style={styles.caption}>{showBefore ? 'Önce' : `Sonra · ${styleName}`} — karşılaştırmak için basılı tut</Text>
      </Pressable>

      {DEMO && (
        <Text style={styles.demo}>
          Demo sürüm: yapay zekâ henüz bağlı değil, bu yüzden fotoğrafın değiştirilmeden gösteriliyor. Gerçek
          uygulamada burada odanın seçtiğin stilde yeniden tasarlanmış hali çıkar.
        </Text>
      )}

      {result.watermarked && (
        <Pressable style={styles.banner} onPress={() => router.push({ pathname: '/paywall', params: { trigger: 'watermark' } })}>
          <Text style={styles.bannerText}>Filigransız HD indirme ve 6 premium stil için Pro’ya geç →</Text>
        </Pressable>
      )}

      <View style={styles.row}>
        <Button title="Paylaş" variant="secondary" onPress={share} style={styles.flex} />
        <Button title="Başka stil dene" variant="secondary" onPress={() => router.replace('/create')} style={styles.flex} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bu tasarımı gerçeğe dönüştür</Text>
        <Text style={styles.text}>
          İç mimarımız bu görseli ölçülü bir projeye ve linkli alışveriş listesine çevirsin.
        </Text>
        <Button title="İç mimardan teklif al" onPress={() => router.push('/designer')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, gap: space.md },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.border },
  demo: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    color: colors.text,
    lineHeight: 20,
  },
  caption: { textAlign: 'center', color: colors.muted, marginTop: space.xs },
  banner: { backgroundColor: colors.accent, borderRadius: radius.md, padding: space.md },
  bannerText: { color: '#FFFFFF', fontWeight: '600' },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  text: { color: colors.muted, lineHeight: 20 },
});
