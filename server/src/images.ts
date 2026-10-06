// Üretilen görselleri kalıcı hale getirir (sağlayıcı URL'leri kısa sürede
// geçersizleşir) ve ücretsiz kullanıcı çıktılarına filigran basar.

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

import { DATA_DIR } from './store.ts';

const IMAGES_DIR = new URL('images/', DATA_DIR);
const MAX_WIDTH = 1536;

async function load(source: string): Promise<Buffer> {
  const dataUri = /^data:image\/[a-z]+;base64,(.+)$/.exec(source);
  if (dataUri) return Buffer.from(dataUri[1], 'base64');
  const res = await fetch(source);
  if (!res.ok) throw new Error(`Üretilen görsel indirilemedi (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

function watermarkSvg(width: number, height: number) {
  const fontSize = Math.round(width / 18);
  const pad = Math.round(fontSize * 0.6);
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width - pad}" y="${height - pad}" text-anchor="end"
        font-family="sans-serif" font-weight="700" font-size="${fontSize}"
        fill="white" fill-opacity="0.85" stroke="black" stroke-opacity="0.35" stroke-width="2">
        OdaAI ile tasarlandı
      </text>
    </svg>`,
  );
}

// Görseli işler, diske yazar ve dosya adını döndürür.
export async function saveImage(source: string, watermark: boolean): Promise<string> {
  const pipeline = sharp(await load(source)).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
  let output: Buffer;
  if (watermark) {
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    output = await sharp(data)
      .composite([{ input: watermarkSvg(info.width, info.height) }])
      .jpeg({ quality: 82 })
      .toBuffer();
  } else {
    output = await pipeline.jpeg({ quality: 90 }).toBuffer();
  }
  await mkdir(IMAGES_DIR, { recursive: true });
  const name = `${randomUUID()}.jpg`;
  await writeFile(new URL(name, IMAGES_DIR), output);
  return name;
}

export async function readImage(name: string): Promise<Buffer | null> {
  if (!/^[0-9a-f-]{36}\.jpg$/.test(name)) return null;
  try {
    return await readFile(new URL(name, IMAGES_DIR));
  } catch {
    return null;
  }
}
