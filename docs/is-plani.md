# OdaAI — İş ve Gelir Planı

## 1. Fikir (tek cümle)

Kullanıcı odasının fotoğrafını yükler, yapay zekâ odayı seçtiği stilde
**20–30 saniyede** yeniden tasarlar. Beğenen kullanıcıya gerçek bir iç mimar
hizmeti satılır.

## 2. Neden bu fikir kısa vadede para kazandırır?

| Neden | Açıklama |
|---|---|
| Kanıtlanmış kategori | "AI room redesign" uygulamaları (Interior AI, RoomGPT, Reimagine Home, Homestyler AI vb.) haftalık abonelikle ilk günden gelir üretiyor. |
| Anında "aha" anı | Kullanıcı 30 saniyede kendi odasının yeni halini görür; ödeme isteği bu duygunun zirvesinde gelir. |
| Düşük birim maliyet | Bir görsel üretiminin sağlayıcı maliyeti yaklaşık $0,01–0,05; bir kredi ₺7–10'a satılıyor. Brüt marj mağaza payından sonra bile yüksek. |
| Organik yayılma | Önce/sonra görselleri Instagram/TikTok'ta doğal olarak paylaşılır; filigran = ücretsiz reklam. |
| Türkiye'de boşluk | Türkçe, TL fiyatlı ve yerel iç mimar hizmetiyle birleşen güçlü bir oyuncu yok. |

## 3. Gelir modelleri (öncelik sırasıyla)

### A) Haftalık / yıllık abonelik — ana gelir (1. haftadan itibaren)
- **Pro Haftalık ₺149,99** (deneme süresi yok → gelir ilk gün gelir)
- **Pro Yıllık ₺1.499,99** (haftalığa göre ~%80 avantajlı görünür; nakit akışını öne çeker)
- Pro: sınırsız tasarım, 8 stilin tamamı, filigransız HD indirme.

### B) Kredi paketleri — abonelik istemeyenler için
- 10 kredi ₺99,99 · 50 kredi ₺349,99
- Türkiye'de abonelikten çekinen kullanıcı oranı yüksek; tek seferlik paket dönüşümü artırır.

### C) İç mimar hizmeti — yüksek sepet (2.–4. haftadan itibaren)
- 30 dk görüntülü danışmanlık **₺750**
- Oda projesi (ölçülü plan + 3 görsel + linkli alışveriş listesi) **₺2.500**
- Serbest çalışan iç mimarlarla çalışılır, platform **%30–40 komisyon** alır.
- Uygulama yalnızca talep (lead) toplar; tahsilat iyzico/PayTR ödeme linkiyle
  yapılır. Hizmet uygulama dışında tüketildiği için mağaza komisyonu
  ödenmez — **yayından önce App Store / Google Play kurallarının güncel
  halini mutlaka kontrol edin.**

### D) Orta vade (ilk gelirden sonra)
- "Bu görünümü satın al": Trendyol / Hepsiburada / IKEA affiliate linkleri.
- Mobilya markaları ve tadilat firmalarına sponsorlu stil / lead satışı.
- Emlakçılar için "boş daireyi döşe" (virtual staging) B2B paketi.

## 4. Kullanıcı akışı ve ödeme noktaları

```
Açılış → Fotoğraf yükle → Oda + stil seç → [1 ücretsiz tasarım, filigranlı]
   → Sonuç (önce/sonra) ──→ Paylaş (büyüme)
        │                └→ "İç mimardan teklif al" (C)
        └→ Filigran bandı → PAYWALL (A/B)
2. tasarım denemesi ──────→ PAYWALL
Premium stil (🔒) seçimi ─→ PAYWALL
```

Paywall üç noktadan tetiklenir (`no_credits`, `premium_style`, `watermark`)
ve her biri analitikte ayrı ölçülür.

## 5. Birim ekonomi (varsayımsal, ilk 30 gün)

| Varsayım | Değer |
|---|---|
| Günlük yeni kurulum (Meta/TikTok reklam + organik) | 300 |
| Kurulum → ilk tasarım | %60 |
| İlk tasarım → ödeme | %4 |
| Ortalama ilk ödeme (net, mağaza payı sonrası) | ~₺125 |
| İç mimar talebi → satış | Ödeyen kullanıcıların %5'i × ₺2.500 × %35 komisyon |

≈ 300 × 0,60 × 0,04 = **7 ödeyen kullanıcı/gün** → ~₺875/gün abonelik + kredi
geliri, ilk ay ~₺26.000 + yenilemeler + iç mimar komisyonu. Reklam CPI'ı
(₺15–30) ile karşılaştırıp ölçekleme kararı **ilk 14 günün verisiyle**
verilir. Bu rakamlar tahmindir; asıl amaç huniyi ölçüp iyileştirmektir.

## 6. 30 günlük yol haritası

| Hafta | Hedef |
|---|---|
| 1 | Görsel modelini seç ve kalite testi yap (20 gerçek oda fotoğrafı). RevenueCat + mağaza ürünlerini tanımla. Filigranı sunucuda uygula. |
| 2 | TestFlight / Play iç test. Paywall metinleri, App Store ekran görüntüleri (önce/sonra). KVKK aydınlatma metni, gizlilik politikası. |
| 3 | Yayın. Günlük ₺1.000–2.000 Meta/TikTok reklam testi; 3 farklı önce/sonra kreatifi. 2–3 serbest iç mimarla anlaşma. |
| 4 | Huni analizi: paywall dönüşümü < %3 ise fiyat/plan sırası A/B testi. Kazanan kreatifi ölçekle. |

## 7. Ölçülecek metrikler

- Kurulum → ilk tasarım oranı (hedef > %55)
- Paywall görüntüleme → satın alma (hedef > %4)
- Haftalık abonelik 2. hafta yenileme oranı (hedef > %35)
- Tasarım başına sağlayıcı maliyeti
- İç mimar talebi → kapanan satış oranı

## 8. Riskler

| Risk | Önlem |
|---|---|
| Görsel kalitesi düşük → iade/kötü yorum | Yayından önce model karşılaştırması; odanın yapısını koruyan (ControlNet/depth tabanlı) model seçimi. |
| Maliyet suistimali | Sunucuda cihaz başı günlük limit (var); üretimde RevenueCat ile sunucu tarafı hak doğrulaması. |
| Mağaza reddi | Abonelik metinleri, geri yükleme butonu ve gizlilik politikası mevcut; hizmet satışının kurallarını kontrol et. |
| Kopyalanabilir ürün | Fark: Türkçe + yerel iç mimar ağı + yerel mağaza ürünleri. |
