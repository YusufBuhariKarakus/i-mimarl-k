// Web: telefon fotoğrafları çok büyük (10+ MB) ya da tarayıcının çizemediği
// biçimde (HEIC) olabilir. Fotoğrafı tuvalde (canvas) küçültüp JPEG'e çeviririz;
// tarayıcı açamıyorsa anlaşılır bir hata veririz.

import type { Photo } from './normalizePhoto';

export type { Photo } from './normalizePhoto';

const MAX_SIDE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bu fotoğraf açılamadı. Lütfen JPEG ya da PNG bir fotoğraf seçin.'));
    img.src = src;
  });
}

export async function normalizePhoto(photo: Photo): Promise<Photo> {
  const img = await loadImage(photo.uri);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Fotoğraf işlenemedi.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUri = canvas.toDataURL('image/jpeg', 0.85);
  return { uri: dataUri, base64: dataUri.slice(dataUri.indexOf(',') + 1), mimeType: 'image/jpeg' };
}
