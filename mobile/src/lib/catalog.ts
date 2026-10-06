// Ürün kataloğu: stiller, oda tipleri ve satış paketleri.
// Fiyatlar mağaza tarafında (App Store / Google Play) tanımlanır; buradaki
// `priceLabel` yalnızca mağaza yanıtı gelmeden önce gösterilen yedek metindir.

export type StyleId =
  | 'modern'
  | 'scandinavian'
  | 'japandi'
  | 'industrial'
  | 'bohemian'
  | 'minimal'
  | 'classic'
  | 'mediterranean';

export type RoomId = 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'office' | 'kids';

export interface Style {
  id: StyleId;
  name: string;
  prompt: string;
  premium: boolean;
}

export interface Room {
  id: RoomId;
  name: string;
  prompt: string;
}

export const STYLES: Style[] = [
  { id: 'modern', name: 'Modern', prompt: 'modern interior, clean lines, neutral palette', premium: false },
  { id: 'scandinavian', name: 'İskandinav', prompt: 'scandinavian interior, light wood, white walls, cozy textiles', premium: false },
  { id: 'japandi', name: 'Japandi', prompt: 'japandi interior, natural materials, low furniture, calm earthy tones', premium: true },
  { id: 'industrial', name: 'Endüstriyel', prompt: 'industrial loft interior, exposed brick, black metal, leather', premium: true },
  { id: 'bohemian', name: 'Bohem', prompt: 'bohemian interior, rattan, plants, layered rugs, warm colors', premium: true },
  { id: 'minimal', name: 'Minimalist', prompt: 'minimalist interior, very few objects, monochrome, hidden storage', premium: true },
  { id: 'classic', name: 'Klasik', prompt: 'classic elegant interior, moldings, marble, brass details', premium: true },
  { id: 'mediterranean', name: 'Akdeniz', prompt: 'mediterranean interior, white plaster, terracotta, blue accents', premium: true },
];

export const ROOMS: Room[] = [
  { id: 'living', name: 'Salon', prompt: 'living room' },
  { id: 'bedroom', name: 'Yatak Odası', prompt: 'bedroom' },
  { id: 'kitchen', name: 'Mutfak', prompt: 'kitchen' },
  { id: 'bathroom', name: 'Banyo', prompt: 'bathroom' },
  { id: 'office', name: 'Çalışma Odası', prompt: 'home office' },
  { id: 'kids', name: 'Çocuk Odası', prompt: 'kids room' },
];

export type ProductKind = 'subscription' | 'credits';

export interface Product {
  // Mağazadaki ürün kimliği (RevenueCat / App Store Connect / Play Console ile aynı olmalı).
  id: string;
  kind: ProductKind;
  title: string;
  subtitle: string;
  priceLabel: string;
  credits?: number;
  badge?: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'odaai_pro_weekly',
    kind: 'subscription',
    title: 'Pro Haftalık',
    subtitle: 'Sınırsız tasarım, tüm stiller, filigransız HD indirme',
    priceLabel: '₺149,99 / hafta',
    badge: 'En popüler',
  },
  {
    id: 'odaai_pro_yearly',
    kind: 'subscription',
    title: 'Pro Yıllık',
    subtitle: 'Haftalığa göre %80 tasarruf',
    priceLabel: '₺1.499,99 / yıl',
    badge: 'En avantajlı',
  },
  {
    id: 'odaai_credits_10',
    kind: 'credits',
    title: '10 Tasarım Kredisi',
    subtitle: 'Abonelik yok, tek seferlik',
    priceLabel: '₺99,99',
    credits: 10,
  },
  {
    id: 'odaai_credits_50',
    kind: 'credits',
    title: '50 Tasarım Kredisi',
    subtitle: 'Kredi başına en düşük fiyat',
    priceLabel: '₺349,99',
    credits: 50,
  },
];

// Ücretsiz kullanıcıya verilen başlangıç kredisi. Bilerek düşük tutuldu:
// "aha anı"nı yaşatıp hemen ödeme ekranına yönlendirmek hedefleniyor.
export const FREE_CREDITS = 1;

// İnsan iç mimar hizmeti (uygulama dışında tüketilen hizmet).
export const DESIGNER_PACKAGES = [
  {
    id: 'consult_30',
    title: '30 dk Görüntülü Danışmanlık',
    description: 'Bir iç mimarla odanızı canlı görüşmede değerlendirin.',
    priceLabel: '₺750',
  },
  {
    id: 'room_project',
    title: 'Oda Projesi',
    description: 'Ölçülü yerleşim planı, 3 görsel ve linkli alışveriş listesi. 5 iş günü.',
    priceLabel: '₺2.500',
  },
] as const;
