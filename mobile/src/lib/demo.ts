// Demo modu (EXPO_PUBLIC_DEMO=1): sunucu olmadan, tarayıcıda tıklanabilir
// tanıtım sürümü için sunucunun hak/kredi mantığını bellekte taklit eder.
// Görsel üretilmez: yüklenen fotoğraf (ücretsizse filigranlı) geri döner.

import type { RedesignRequest, RedesignResponse, ServerWallet } from './api';
import { PRODUCTS, STYLES } from './catalog';

export const DEMO = process.env.EXPO_PUBLIC_DEMO === '1';

const FREE_CREDITS = 1;
const state = { used: 0, purchasedCredits: 0, isPro: false };

function wallet(): ServerWallet {
  return {
    isPro: state.isPro,
    hasPaid: state.isPro || state.purchasedCredits > 0,
    credits: Math.max(0, FREE_CREDITS + state.purchasedCredits - state.used),
  };
}

// api.ts bunu ApiError(402)'ye çevirir (döngüsel import olmasın diye ayrı sınıf).
export class DemoPaymentError extends Error {}

export async function demoWallet(): Promise<ServerWallet> {
  return wallet();
}

export async function demoSync(productId?: string): Promise<ServerWallet> {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (product?.kind === 'subscription') state.isPro = true;
  if (product?.kind === 'credits') state.purchasedCredits += product.credits ?? 0;
  return wallet();
}

async function watermark(dataUri: string): Promise<string> {
  if (typeof document === 'undefined') return dataUri;
  const img = new Image();
  img.src = dataUri;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUri;
  ctx.drawImage(img, 0, 0);
  const size = Math.round(canvas.width / 18);
  ctx.font = `700 ${size}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const x = canvas.width - size * 0.6;
  const y = canvas.height - size * 0.6;
  ctx.strokeText('OdaAI ile tasarlandı', x, y);
  ctx.fillText('OdaAI ile tasarlandı', x, y);
  return canvas.toDataURL('image/jpeg', 0.85);
}

export async function demoRedesign(req: RedesignRequest): Promise<RedesignResponse> {
  const before = wallet();
  if (!before.isPro && before.credits <= 0) throw new DemoPaymentError('Tasarım hakkın bitti.');
  const premium = STYLES.find((s) => s.id === req.style)?.premium;
  if (premium && !before.hasPaid) throw new DemoPaymentError('Bu stil Pro üyelere özel.');
  if (!before.isPro) state.used++;
  await new Promise((r) => setTimeout(r, 1500));
  const source = `data:${req.mimeType};base64,${req.imageBase64}`;
  // Filigran basılamazsa (eski tarayıcı vb.) tasarımı yine de göster.
  const imageUrl = before.hasPaid ? source : await watermark(source).catch(() => source);
  return { imageUrl, watermarked: !before.hasPaid, wallet: wallet() };
}
