// İnsan iç mimar hizmeti için talep (lead) formu.
// Ödeme uygulama içinde alınmaz: hizmet uygulama dışında tüketildiği için
// iyzico/PayTR ödeme linki ile WhatsApp/telefon üzerinden tahsil edilir.
// (Uygulama mağazası kurallarını yayından önce güncel haliyle kontrol edin.)

import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { track } from '../lib/analytics';
import { submitDesignerLead } from '../lib/api';
import { DESIGNER_PACKAGES } from '../lib/catalog';
import { getLastResult } from '../lib/session';
import { colors, radius, space } from '../lib/theme';

export default function Designer() {
  const [packageId, setPackageId] = useState<string>(DESIGNER_PACKAGES[1].id);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 10;

  async function submit() {
    setLoading(true);
    try {
      await submitDesignerLead({ packageId, name, phone, note, resultImageUrl: getLastResult()?.afterUrl });
      track('designer_lead_submitted', { packageId });
      Alert.alert('Talebin alındı', 'İç mimarımız 24 saat içinde seninle iletişime geçecek.');
      router.back();
    } catch (e) {
      Alert.alert('Gönderilemedi', e instanceof Error ? e.message : 'Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Tasarımını bir iç mimar hayata geçirsin</Text>

      {DESIGNER_PACKAGES.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => setPackageId(p.id)}
          style={[styles.pkg, packageId === p.id && styles.pkgSelected]}
        >
          <View style={styles.pkgHeader}>
            <Text style={styles.pkgTitle}>{p.title}</Text>
            <Text style={styles.pkgPrice}>{p.priceLabel}</Text>
          </View>
          <Text style={styles.pkgText}>{p.description}</Text>
        </Pressable>
      ))}

      <TextInput style={styles.input} placeholder="Ad Soyad" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Telefon (05xx xxx xx xx)"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Oda ölçüleri, bütçe, beklentiler (isteğe bağlı)"
        multiline
        value={note}
        onChangeText={setNote}
      />
      <Button title="Teklif iste" onPress={submit} loading={loading} disabled={!valid} />
      <Text style={styles.legal}>
        Bilgilerin yalnızca seninle iletişim kurmak için kullanılır (KVKK aydınlatma metni).
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, gap: space.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  pkg: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: space.xs,
  },
  pkgSelected: { borderColor: colors.primary },
  pkgHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  pkgTitle: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 },
  pkgPrice: { fontWeight: '700', color: colors.primary },
  pkgText: { color: colors.muted },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    fontSize: 16,
    color: colors.text,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  legal: { fontSize: 11, color: colors.muted, textAlign: 'center' },
});
