// Görsel üretim sağlayıcısı. Varsayılan: Replicate. Token yoksa mock mod.

const STYLE_PROMPTS: Record<string, string> = {
  modern: 'modern interior, clean lines, neutral palette',
  scandinavian: 'scandinavian interior, light wood, white walls, cozy textiles',
  japandi: 'japandi interior, natural materials, low furniture, calm earthy tones',
  industrial: 'industrial loft interior, exposed brick, black metal, leather',
  bohemian: 'bohemian interior, rattan, plants, layered rugs, warm colors',
  minimal: 'minimalist interior, very few objects, monochrome, hidden storage',
  classic: 'classic elegant interior, moldings, marble, brass details',
  mediterranean: 'mediterranean interior, white plaster, terracotta, blue accents',
};

const ROOM_PROMPTS: Record<string, string> = {
  living: 'living room',
  bedroom: 'bedroom',
  kitchen: 'kitchen',
  bathroom: 'bathroom',
  office: 'home office',
  kids: 'kids room',
};

export function isValidStyle(style: string) {
  return style in STYLE_PROMPTS;
}

export function isValidRoom(room: string) {
  return room in ROOM_PROMPTS;
}

export function buildPrompt(style: string, room: string) {
  return (
    `A photorealistic ${ROOM_PROMPTS[room]} redesigned in ${STYLE_PROMPTS[style]}, ` +
    'keep the original room layout, walls, windows and camera angle, ' +
    'professional interior photography, natural light, high detail'
  );
}

export interface GenerateInput {
  imageDataUri: string;
  style: string;
  room: string;
}

export async function generate(input: GenerateInput): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  const model = process.env.REPLICATE_MODEL;
  if (!token || !model) {
    // Mock mod: uygulama akışını uçtan uca denemek için girdiyi geri döndürür.
    return input.imageDataUri;
  }

  const res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        image: input.imageDataUri,
        prompt: buildPrompt(input.style, input.room),
      },
    }),
  });
  const prediction = (await res.json()) as { status?: string; output?: unknown; error?: string; detail?: string };
  if (!res.ok || prediction.status === 'failed') {
    throw new Error(prediction.error ?? prediction.detail ?? `Replicate hatası (${res.status})`);
  }
  const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (typeof output !== 'string') {
    throw new Error('Üretim zaman aşımına uğradı, lütfen tekrar deneyin.');
  }
  return output;
}
