import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { track } from '../lib/analytics';
import { redesignRoom } from '../lib/api';
import { ROOMS, STYLES, type RoomId, type StyleId } from '../lib/catalog';
import { setLastResult } from '../lib/session';
import { colors, radius, space } from '../lib/theme';
import { useWallet } from '../lib/wallet';

interface Photo {
  uri: string;
  base64: string;
  mimeType: string;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
  base64: true,
};

export default function Create() {
  const wallet = useWallet();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [room, setRoom] = useState<RoomId>('living');
  const [style, setStyle] = useState<StyleId>('modern');
  const [loading, setLoading] = useState(false);

  async function pick(source: 'camera' | 'library') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('İzin gerekli', 'Devam etmek için ayarlardan izin verin.');
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;
    setPhoto({ uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType ?? 'image/jpeg' });
    track('photo_selected', { source });
  }

  function selectStyle(id: StyleId) {
    const s = STYLES.find((x) => x.id === id);
    if (s?.premium && !wallet.hasPaid) {
      router.push({ pathname: '/paywall', params: { trigger: 'premium_style' } });
      return;
    }
    setStyle(id);
  }

  async function generate() {
    if (!photo) return;
    if (!wallet.canGenerate) {
      router.push({ pathname: '/paywall', params: { trigger: 'no_credits' } });
      return;
    }
    setLoading(true);
    track('generate_started', { room, style });
    try {
      const watermark = !wallet.hasPaid;
      const { imageUrl } = await redesignRoom({
        imageBase64: photo.base64,
        mimeType: photo.mimeType,
        room,
        style,
        deviceId: wallet.deviceId,
        watermark,
      });
      wallet.consumeCredit();
      setLastResult({ beforeUri: photo.uri, afterUrl: imageUrl, room, style, watermarked: watermark });
      track('generate_succeeded', { room, style });
      router.push('/result');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      track('generate_failed', { message });
      Alert.alert('Tasarım oluşturulamadı', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.preview} contentFit="cover" />
      ) : (
        <View style={[styles.preview, styles.placeholder]}>
          <Text style={styles.placeholderText}>Odanın fotoğrafını ekle</Text>
        </View>
      )}
      <View style={styles.row}>
        <Button title="Fotoğraf çek" variant="secondary" onPress={() => pick('camera')} style={styles.flex} />
        <Button title="Galeriden seç" variant="secondary" onPress={() => pick('library')} style={styles.flex} />
      </View>

      <Text style={styles.label}>Oda tipi</Text>
      <View style={styles.chips}>
        {ROOMS.map((r) => (
          <Chip key={r.id} label={r.name} selected={room === r.id} onPress={() => setRoom(r.id)} />
        ))}
      </View>

      <Text style={styles.label}>Stil</Text>
      <View style={styles.chips}>
        {STYLES.map((s) => (
          <Chip
            key={s.id}
            label={s.name}
            selected={style === s.id}
            locked={s.premium && !wallet.hasPaid}
            onPress={() => selectStyle(s.id)}
          />
        ))}
      </View>

      <Button
        title={wallet.canGenerate ? 'Tasarla ✨' : 'Tasarım hakkın bitti — Pro’ya geç'}
        onPress={generate}
        loading={loading}
        disabled={!photo}
      />
      {loading && <Text style={styles.hint}>Yeni odan hazırlanıyor, bu 20–30 saniye sürebilir…</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.md, gap: space.md },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: colors.border },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.muted, fontSize: 16 },
  row: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  hint: { textAlign: 'center', color: colors.muted },
});
