// Huni (funnel) olayları. Kısa vadeli gelir hedefinde en kritik metrikler:
// ilk tasarım oranı → paywall görüntüleme → satın alma dönüşümü.
// Üretimde PostHog / Amplitude / Firebase gibi bir sağlayıcıya bağlayın.

export type EventName =
  | 'app_open'
  | 'photo_selected'
  | 'generate_started'
  | 'generate_succeeded'
  | 'generate_failed'
  | 'paywall_viewed'
  | 'purchase_started'
  | 'purchase_succeeded'
  | 'purchase_failed'
  | 'result_saved'
  | 'designer_lead_submitted';

export function track(event: EventName, props: Record<string, unknown> = {}) {
  if (__DEV__) console.log(`[analytics] ${event}`, props);
}
