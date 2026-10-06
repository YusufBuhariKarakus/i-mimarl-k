// Yerel platformlarda fotoğraf seçici zaten sıkıştırılmış JPEG döndürür.

export interface Photo {
  uri: string;
  base64: string;
  mimeType: string;
}

export async function normalizePhoto(photo: Photo): Promise<Photo> {
  return photo;
}
