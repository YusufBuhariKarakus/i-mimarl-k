// Dosya tabanlı küçük veri deposu (tek süreçlik MVP için).
// Ölçeklenince Postgres/Redis'e taşıyın; arayüz aynı kalabilir.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';

export const DATA_DIR = new URL('../data/', import.meta.url);
const DB_FILE = new URL('db.json', DATA_DIR);

export interface DeviceRecord {
  // Başarılı (ya da şu an süren) üretim sayısı.
  used: number;
  // Yalnızca geliştirme modunda (RevenueCat anahtarı yokken) sahte satın alımlar.
  devCredits: number;
  devPro: boolean;
}

interface Db {
  devices: Record<string, DeviceRecord>;
}

mkdirSync(DATA_DIR, { recursive: true });
const db: Db = existsSync(DB_FILE) ? JSON.parse(readFileSync(DB_FILE, 'utf8')) : { devices: {} };

let saveTimer: NodeJS.Timeout | undefined;

function flush() {
  clearTimeout(saveTimer);
  saveTimer = undefined;
  const tmp = new URL('db.json.tmp', DATA_DIR);
  writeFileSync(tmp, JSON.stringify(db));
  renameSync(tmp, DB_FILE);
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 200);
}

// Kapanırken bekleyen yazmayı kaybetme.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    if (saveTimer) flush();
    process.exit(0);
  });
}

export function getDevice(deviceId: string): DeviceRecord {
  return db.devices[deviceId] ?? { used: 0, devCredits: 0, devPro: false };
}

export function updateDevice(deviceId: string, fn: (d: DeviceRecord) => void): DeviceRecord {
  const device = getDevice(deviceId);
  fn(device);
  db.devices[deviceId] = device;
  scheduleSave();
  return device;
}
