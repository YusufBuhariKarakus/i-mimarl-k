import Constants from 'expo-constants';

import type { RoomId, StyleId } from './catalog';

const API_URL: string = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8787';

// Sunucunun hesapladığı haklar; uygulamadaki tek doğru kaynak budur.
export interface ServerWallet {
  isPro: boolean;
  hasPaid: boolean;
  credits: number;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }

  // 402: kredi bitti ya da premium stil → ödeme ekranına yönlendir.
  get needsPayment() {
    return this.status === 402;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Sunucu hatası (${res.status})`);
  }
  return res.json();
}

export function fetchWallet(deviceId: string) {
  return request<ServerWallet>(`/v1/wallet?deviceId=${encodeURIComponent(deviceId)}`);
}

// Satın alma ya da geri yükleme sonrası sunucunun hakları yeniden okumasını sağlar.
export function syncPurchase(deviceId: string, productId?: string) {
  return request<ServerWallet>('/v1/purchases/sync', {
    method: 'POST',
    body: JSON.stringify({ deviceId, productId }),
  });
}

export interface RedesignRequest {
  imageBase64: string;
  mimeType: string;
  style: StyleId;
  room: RoomId;
  deviceId: string;
}

export interface RedesignResponse {
  imageUrl: string;
  watermarked: boolean;
  wallet: ServerWallet;
}

export function redesignRoom(req: RedesignRequest) {
  return request<RedesignResponse>('/v1/redesign', { method: 'POST', body: JSON.stringify(req) });
}

export interface DesignerLead {
  packageId: string;
  name: string;
  phone: string;
  note: string;
  resultImageUrl?: string;
}

export async function submitDesignerLead(lead: DesignerLead): Promise<void> {
  await request('/v1/designer-leads', { method: 'POST', body: JSON.stringify(lead) });
}
