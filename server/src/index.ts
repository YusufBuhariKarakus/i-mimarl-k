// OdaAI API: görsel üretimi sağlayıcı anahtarını istemciden saklar,
// maliyeti sınırlar ve iç mimar taleplerini toplar. Bağımlılıksız Node sunucusu.

import { appendFile, mkdir } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import { generate, isValidRoom, isValidStyle } from './generate.ts';

const PORT = Number(process.env.PORT ?? 8787);
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT_PER_DEVICE ?? 30);
const MAX_BODY_BYTES = 15 * 1024 * 1024;
const LEADS_FILE = new URL('../data/leads.jsonl', import.meta.url);

// Cihaz başına günlük sayaç. Tek süreçlik MVP için yeterli; ölçeklenince Redis'e taşıyın.
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

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function str(body: Record<string, unknown>, key: string, required = true): string {
  const value = body[key];
  if (typeof value === 'string' && (value.length > 0 || !required)) return value;
  if (!required && value === undefined) return '';
  throw new HttpError(400, `Eksik ya da geçersiz alan: ${key}`);
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
  if (!allow(deviceId)) throw new HttpError(429, 'Bugünlük tasarım sınırına ulaştın, yarın tekrar dene.');

  // TODO(üretim): `watermark` true ise çıktıya filigran bas (ör. sharp ile) ve
  // kredi/Pro hakkını RevenueCat REST API üzerinden sunucuda doğrula.
  const imageUrl = await generate({ imageDataUri: `data:${mimeType};base64,${imageBase64}`, style, room });
  send(res, 200, { imageUrl });
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
  await mkdir(new URL('.', LEADS_FILE), { recursive: true });
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
  try {
    if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });
    if (req.method === 'POST' && req.url === '/v1/redesign') return await redesign(req, res);
    if (req.method === 'POST' && req.url === '/v1/designer-leads') return await designerLead(req, res);
    send(res, 404, { error: 'Bulunamadı' });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message });
    console.error(e);
    send(res, 502, { error: e instanceof Error ? e.message : 'Beklenmeyen hata' });
  }
});

server.listen(PORT, () => {
  const mode = process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_MODEL ? 'replicate' : 'mock';
  console.log(`OdaAI API http://localhost:${PORT} (${mode} mod)`);
});
