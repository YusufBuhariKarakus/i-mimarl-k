// Ekranlar arası geçici veri (büyük görsel URI'lerini route parametresine koymamak için).

import type { RoomId, StyleId } from './catalog';

export interface DesignResult {
  beforeUri: string;
  afterUrl: string;
  style: StyleId;
  room: RoomId;
  watermarked: boolean;
}

let lastResult: DesignResult | null = null;

export function setLastResult(result: DesignResult) {
  lastResult = result;
}

export function getLastResult(): DesignResult | null {
  return lastResult;
}
