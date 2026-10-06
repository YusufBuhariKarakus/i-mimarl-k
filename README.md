# OdaAI — Yapay Zekâ ile İç Mimarlık Uygulaması

Odanın fotoğrafını çek, stil seç, saniyeler içinde yeniden tasarlanmış halini
gör. Beğenirsen gerçek bir iç mimar projelendirsin.

Kısa vadeli gelir için tasarlandı: 1 ücretsiz (filigranlı) tasarım → haftalık
abonelik / kredi paketi → yüksek sepetli iç mimar hizmeti.
Ayrıntılı iş planı, fiyatlar ve 30 günlük yol haritası:
**[docs/is-plani.md](docs/is-plani.md)**

## Yapı

```
mobile/   Expo (React Native, TypeScript, Expo Router) mobil uygulama
server/   Bağımlılıksız Node API: görsel üretimi, maliyet limiti, iç mimar talepleri
docs/     İş ve gelir planı
```

### Mobil ekranlar (`mobile/src/app`)

| Ekran | Görev |
|---|---|
| `index` | Değer önerisi, kalan hak, başlat |
| `create` | Fotoğraf (kamera/galeri), oda tipi, stil (premium stiller kilitli) |
| `result` | Önce/sonra (basılı tut), paylaş, filigran → paywall, iç mimar CTA |
| `paywall` | Haftalık/yıllık abonelik ve kredi paketleri |
| `designer` | İç mimar paketi seçimi ve talep formu |

Ürün/fiyat tanımları `mobile/src/lib/catalog.ts`, satın alma katmanı
`mobile/src/lib/purchases.ts` (şu an sahte mağaza), huni olayları
`mobile/src/lib/analytics.ts` içindedir.

## Çalıştırma

```bash
# 1) API (mock modda yüklenen fotoğrafı geri döndürür)
cd server
npm install
npm start                 # http://localhost:8787  (Node >= 22.18)

# 2) Mobil uygulama
cd mobile
npm install
npx expo start
```

Gerçek telefonda denerken `mobile/app.json` → `expo.extra.apiUrl` değerini
bilgisayarınızın yerel IP adresiyle değiştirin (ör. `http://192.168.1.20:8787`).

Gerçek yapay zekâ üretimi için `server/.env.example` dosyasındaki
`REPLICATE_API_TOKEN` ve `REPLICATE_MODEL` değişkenlerini ortamda tanımlayın.

## Yayından önce yapılacaklar

- [ ] Görsel modelini seçip kalite testi yapmak (`server/src/generate.ts`)
- [ ] RevenueCat entegrasyonu (`mobile/src/lib/purchases.ts`) ve mağaza ürünleri
- [ ] Sunucu tarafında hak doğrulama + filigran basma (`server/src/index.ts` içindeki TODO)
- [ ] Analitik sağlayıcısı bağlama (PostHog / Amplitude / Firebase)
- [ ] KVKK aydınlatma metni, gizlilik politikası, kullanım koşulları
- [ ] Uygulama ikonu ve mağaza görselleri (önce/sonra)

## Kontroller

```bash
cd mobile && npx tsc --noEmit
cd server && npm run typecheck
```
