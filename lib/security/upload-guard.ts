export const ALLOWED_UPLOAD_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadInspection {
  allowed: boolean;
  error?: string;
}

export function sniffImageType(buffer: Buffer): string | null {
  const jpeg = [0xff, 0xd8, 0xff];
  if (buffer.length >= 3 && jpeg.every((b, i) => buffer[i] === b)) {
    return 'image/jpeg';
  }

  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= 8 && png.every((b, i) => buffer[i] === b)) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return 'image/gif';
  }

  return null;
}

export function inspectUpload(declaredType: string | undefined, buffer: Buffer): UploadInspection {
  if (!declaredType || !ALLOWED_UPLOAD_TYPES.includes(declaredType)) {
    return { allowed: false, error: 'Unsupported file type' };
  }

  const sniffed = sniffImageType(buffer);
  if (sniffed !== declaredType) {
    return { allowed: false, error: 'File content does not match its declared type' };
  }

  return { allowed: true };
}