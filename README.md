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
server/   Node API: görsel üretimi, kredi/Pro doğrulama, filigran, maliyet limiti, iç mimar talepleri
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
`mobile/src/lib/purchases.ts` (RevenueCat; anahtar yoksa sahte mağaza), huni
olayları `mobile/src/lib/analytics.ts` içindedir.

### Haklar ve ödeme nasıl işliyor?

Kredi bakiyesi ve Pro durumunun **tek doğru kaynağı sunucudur**; uygulama
yalnızca sunucunun döndürdüğü bakiyeyi gösterir.

1. Uygulama her cihaz için kalıcı bir `deviceId` üretir ve RevenueCat'e bu
   kimlikle (`appUserID`) giriş yapar.
2. Satın alma RevenueCat üzerinden mağazada yapılır, ardından uygulama
   `POST /v1/purchases/sync` çağırır.
3. Sunucu RevenueCat REST API'sinden `pro` entitlement'ını ve satın alınan
   kredi paketlerini okur, kendi kullanım kaydıyla birleştirir:
   `kredi = ücretsiz hak + satın alınan − kullanılan`.
4. `POST /v1/redesign` krediyi üretimden önce ayırır (hata olursa iade eder),
   ödeme yapmamış kullanıcıya premium stili reddeder (402) ve çıktıya
   **filigranı sunucuda basar**. Görseller sunucuda saklanır
   (`GET /images/:id`), çünkü sağlayıcı URL'leri kısa sürede geçersizleşir.

`REVENUECAT_SECRET_KEY` tanımlı değilken sunucu geliştirme modundadır: sahte
mağazadan gelen satın alımları kaydeder. `NODE_ENV=production` iken bu mod
kapalıdır.

## Çalıştırma

```bash
# 1) API (anahtar yoksa: üretim mock, satın almalar sahte)
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

Gerçek üretim ve ödeme için ortam değişkenleri:

- Sunucu (`server/.env.example`): `REPLICATE_API_TOKEN`, `REPLICATE_MODEL`,
  `REVENUECAT_SECRET_KEY`, `PUBLIC_URL`
- Mobil (`mobile/.env.example`): `EXPO_PUBLIC_REVENUECAT_IOS_KEY`,
  `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

RevenueCat yerel modül içerdiği için gerçek satın alma Expo Go'da değil,
development build'de (`npx eas-cli@latest build --profile development`) denenir.

### RevenueCat kurulumu

1. App Store Connect / Play Console'da ürünleri oluşturun:
   `odaai_pro_weekly`, `odaai_pro_yearly` (abonelik),
   `odaai_credits_10`, `odaai_credits_50` (tüketilebilir).
2. RevenueCat'te bu ürünleri ekleyin ve iki aboneliği `pro` entitlement'ına bağlayın.
3. Public SDK anahtarlarını mobil, secret anahtarı sunucu ortamına yazın.

## Tıklanabilir web demosu

Sunucu olmadan tarayıcıda açılan tek dosyalık tanıtım sürümü (ödeme sahte,
görsel üretilmez; yüklenen fotoğraf filigranlı olarak geri döner):

```bash
cd mobile
EXPO_PUBLIC_DEMO=1 npx expo export --platform web --output-dir dist-demo
node scripts/build-demo.mjs dist-demo odaai-demo.html
```

## Yayından önce yapılacaklar

- [ ] Görsel modelini seçip kalite testi yapmak (`server/src/generate.ts`)
- [x] RevenueCat entegrasyonu ve sunucu tarafında hak doğrulama
- [x] Ücretsiz çıktılara sunucuda filigran basma
- [ ] Mağaza ürünlerini ve RevenueCat projesini oluşturmak (yukarıdaki adımlar)
- [ ] Veri deposunu dosyadan Postgres/Redis'e taşımak, görselleri S3/R2'ye koymak (çok sunuculu kurulum için)
- [ ] Analitik sağlayıcısı bağlama (PostHog / Amplitude / Firebase)
- [ ] KVKK aydınlatma metni, gizlilik politikası, kullanım koşulları
- [ ] Uygulama ikonu ve mağaza görselleri (önce/sonra)

## Kontroller

```bash
cd mobile && npx tsc --noEmit
cd server && npm run typecheck
```
