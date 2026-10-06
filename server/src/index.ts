// OdaAI API: görsel üretimi sağlayıcı anahtarını istemciden saklar, kullanıcı
// haklarını (kredi / Pro) sunucuda doğrular, ücretsiz çıktılara filigran basar,
// maliyeti sınırlar ve iç mimar taleplerini toplar.

import { appendFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { CREDIT_PRODUCTS, getWallet, invalidate, revenueCatEnabled, SUBSCRIPTION_PRODUCTS } from './entitlements.ts';
import { FREE_STYLES, generate, isValidRoom, isValidStyle } from './generate.ts';
import { readImage, saveImage } from './images.ts';
import { DATA_DIR, updateDevice } from './store.ts';

const PORT = Number(process.env.PORT ?? 8787);
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT_PER_DEVICE ?? 30);
const MAX_BODY_BYTES = 15 * 1024 * 1024;
const LEADS_FILE = new URL('leads.jsonl', DATA_DIR);
const DEV_GRANTS = !revenueCatEnabled() && process.env.NODE_ENV !== 'production';

// Cihaz başına günlük sayaç (Pro dahil herkes için maliyet koruması).
const usage = new Map<string, { day: string; count: number }>();

function allow(deviceId: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const entry = usage.get(deviceId);
  if (!entry || entry.day !== day) {
    usage.set(deviceId, { day, count: 1 });
    return true;
  }
  if (entry.count >= DAILY_LIMIT) return false;
  entry.count++;
  return true;
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Fotoğraf çok büyük');
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Geçersiz JSON');
  }
}

function str(body: Record<string, unknown>, key: string, required = true): string {
  const value = body[key];
  if (typeof value === 'string' && (value.length > 0 || !required)) return value;
  if (!required && value === undefined) return '';
  throw new HttpError(400, `Eksik ya da geçersiz alan: ${key}`);
}

function publicUrl(req: IncomingMessage) {
  return process.env.PUBLIC_URL ?? `http://${req.headers.host ?? `localhost:${PORT}`}`;
}

async function wallet(url: URL, res: ServerResponse) {
  const deviceId = url.searchParams.get('deviceId');
  if (!deviceId) throw new HttpError(400, 'Eksik alan: deviceId');
  send(res, 200, await getWallet(deviceId));
}

async function redesign(req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req);
  const imageBase64 = str(body, 'imageBase64');
  const mimeType = str(body, 'mimeType');
  const style = str(body, 'style');
  const room = str(body, 'room');
  const deviceId = str(body, 'deviceId');
  if (!/^image\/(jpeg|png|webp|heic)$/.test(mimeType)) throw new HttpError(400, 'Desteklenmeyen görsel türü');
  if (!isValidStyle(style) || !isValidRoom(room)) throw new HttpError(400, 'Geçersiz stil ya da oda tipi');

  const before = await getWallet(deviceId);
  if (!before.isPro && before.credits <= 0) throw new HttpError(402, 'Tasarım hakkın bitti.');
  if (!before.hasPaid && !FREE_STYLES.has(style)) {
    throw new HttpError(402, 'Bu stil Pro üyelere özel.');
  }
  if (!allow(deviceId)) throw new HttpError(429, 'Bugünlük tasarım sınırına ulaştın, yarın tekrar dene.');

  // Krediyi üretimden önce ayır: eşzamanlı isteklerle aynı kredi iki kez harcanamaz.
  const charge = !before.isPro;
  if (charge) updateDevice(deviceId, (d) => d.used++);
  try {
    const output = await generate({ imageDataUri: `data:${mimeType};base64,${imageBase64}`, style, room });
    const name = await saveImage(output, !before.hasPaid);
    send(res, 200, {
      imageUrl: `${publicUrl(req)}/images/${name}`,
      watermarked: !before.hasPaid,
      wallet: await getWallet(deviceId),
    });
  } catch (e) {
    if (charge) updateDevice(deviceId, (d) => d.used--);
    throw e;
  }
}

async function image(url: URL, res: ServerResponse) {
  const data = await readImage(url.pathname.slice('/images/'.length));
  if (!data) return send(res, 404, { error: 'Bulunamadı' });
  res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' });
  res.end(data);
}

// Satın alma sonrası: önbelleği temizleyip güncel hakları döndürür.
// Geliştirme modunda sahte mağazanın satın alımını da kaydeder.
async function purchaseSync(req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req);
  const deviceId = str(body, 'deviceId');
  const productId = str(body, 'productId', false);
  if (DEV_GRANTS && productId) {
    if (productId in CREDIT_PRODUCTS) updateDevice(deviceId, (d) => (d.devCredits += CREDIT_PRODUCTS[productId]));
    else if (SUBSCRIPTION_PRODUCTS.includes(productId)) updateDevice(deviceId, (d) => (d.devPro = true));
    else throw new HttpError(400, 'Bilinmeyen ürün');
  }
  invalidate(deviceId);
  send(res, 200, await getWallet(deviceId));
}

async function designerLead(req: IncomingMessage, res: ServerResponse) {
  const body = await readJson(req);
  const lead = {
    receivedAt: new Date().toISOString(),
    packageId: str(body, 'packageId'),
    name: str(body, 'name'),
    phone: str(body, 'phone'),
    note: str(body, 'note', false),
    resultImageUrl: typeof body.resultImageUrl === 'string' && !body.resultImageUrl.startsWith('data:')
      ? body.resultImageUrl
      : undefined,
  };
  await appendFile(LEADS_FILE, JSON.stringify(lead) + '\n');

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    const text = `Yeni iç mimar talebi (${lead.packageId}): ${lead.name} · ${lead.phone}\n${lead.note}`;
    fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, content: text, lead }),
    }).catch((e) => console.error('Lead webhook hatası:', e));
  }
  send(res, 201, { ok: true });
}

const server = createServer(async (req, res) => {
  // Mobil uygulama CORS'a takılmaz; web sürümü (expo start --web) için gerekli.
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const route = `${req.method} ${url.pathname}`;
    if (route === 'GET /health') return send(res, 200, { ok: true });
    if (route === 'GET /v1/wallet') return await wallet(url, res);
    if (route === 'POST /v1/redesign') return await redesign(req, res);
    if (route === 'POST /v1/purchases/sync') return await purchaseSync(req, res);
    if (route === 'POST /v1/designer-leads') return await designerLead(req, res);
    if (req.method === 'GET' && url.pathname.startsWith('/images/')) return await image(url, res);
    send(res, 404, { error: 'Bulunamadı' });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 502, { error: e instanceof Error ? e.message : 'Beklenmeyen hata' });
  }
});

server.listen(PORT, () => {
  const gen = process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_MODEL ? 'replicate' : 'mock';
  const ent = revenueCatEnabled() ? 'revenuecat' : DEV_GRANTS ? 'dev (sahte satın alma)' : 'kapalı';
  console.log(`OdaAI API http://localhost:${PORT} · üretim: ${gen} · haklar: ${ent}`);
});
