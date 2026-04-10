export type ImagePurpose = 'avatar' | 'server_icon' | 'event_cover' | 'chat' | 'general';
export type ImageProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
  size: number;
}

export interface ImageMetadata {
  id: string;
  uploaderId: string | null;
  url: string;
  originalUrl: string | null;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  purpose: ImagePurpose;
  processingStatus: ImageProcessingStatus;
  variants: Record<string, ImageVariant> | null;
  blurhash: string | null;
  alt: string | null;
  createdAt: string;
}

export interface ImageStatus {
  id: string;
  processingStatus: ImageProcessingStatus;
  variants: Record<string, ImageVariant> | null;
  url: string;
}

/** Maximum upload size enforced server-side (25 MiB). */
export const IMAGE_MAX_SIZE_BYTES = 25 * 1024 * 1024;
