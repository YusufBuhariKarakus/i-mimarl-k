import Constants from 'expo-constants';

import type { RoomId, StyleId } from './catalog';

const API_URL: string = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8787';

export interface RedesignRequest {
  imageBase64: string;
  mimeType: string;
  style: StyleId;
  room: RoomId;
  deviceId: string;
  watermark: boolean;
}

export interface RedesignResponse {
  imageUrl: string;
}

export async function redesignRoom(req: RedesignRequest): Promise<RedesignResponse> {
  const res = await fetch(`${API_URL}/v1/redesign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Sunucu hatası (${res.status})`);
  }
  return res.json();
}

export interface DesignerLead {
  packageId: string;
  name: string;
  phone: string;
  note: string;
  resultImageUrl?: string;
}

export async function submitDesignerLead(lead: DesignerLead): Promise<void> {
  const res = await fetch(`${API_URL}/v1/designer-leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error(`Talep gönderilemedi (${res.status})`);
}
