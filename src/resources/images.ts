import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { HttpClient } from '../http.js';
import type {
  ImageMetadata,
  ImagePurpose,
  ImageStatus,
} from '../types/image.js';

/**
 * Acceptable inputs for `images.upload(...)`. The SDK will:
 *   - read the file from disk if you pass a string path,
 *   - wrap a Buffer / Uint8Array / ArrayBuffer / Blob in FormData,
 *   - or use a Blob you constructed yourself.
 */
export type ImageInput =
  | string
  | Buffer
  | Uint8Array
  | ArrayBuffer
  | Blob;

export interface UploadImageOptions {
  /** What this image will be used for. The API rejects unknown purposes. */
  purpose: ImagePurpose;
  /** Optional alt text. */
  alt?: string;
  /** Optional ID of the entity this image belongs to (e.g. a server ID for an icon). */
  entityId?: string;
  /** File name reported in the multipart part. Auto-derived for paths. */
  filename?: string;
  /** Content-Type. Auto-detected for paths from the extension; defaults to `application/octet-stream`. */
  contentType?: string;
}

/**
 * Images resource. Uploads use multipart/form-data; the SDK builds the
 * FormData itself so callers don't have to know the field names.
 *
 * Large GIFs are processed asynchronously into MP4 by the API. Use
 * `status(id)` to poll until `processingStatus === "ready"`.
 */
export class ImagesResource {
  constructor(private readonly http: HttpClient) {}

  /** POST /images - upload an image as multipart form data. */
  async upload(input: ImageInput, opts: UploadImageOptions): Promise<ImageMetadata> {
    const { blob, filename, contentType } = await coerceToBlob(input, opts);
    const form = new FormData();
    form.set('file', blob, filename);
    form.set('purpose', opts.purpose);
    if (opts.alt !== undefined) form.set('alt', opts.alt);
    if (opts.entityId !== undefined) form.set('entityId', opts.entityId);

    return this.http.request<ImageMetadata>({
      method: 'POST',
      path: '/images',
      rawBody: form,
      // Important: do NOT set Content-Type ourselves. The runtime will set
      // multipart/form-data with the correct boundary when given a FormData.
      headers: contentType ? {} : {},
    });
  }

  /** GET /images/:id - fetch image metadata by ID. */
  get(id: string): Promise<ImageMetadata> {
    return this.http.request<ImageMetadata>({
      method: 'GET',
      path: `/images/${encodeURIComponent(id)}`,
    });
  }

  /** GET /images/:id/status - lightweight status check (for polling GIF -> MP4). */
  status(id: string): Promise<ImageStatus> {
    return this.http.request<ImageStatus>({
      method: 'GET',
      path: `/images/${encodeURIComponent(id)}/status`,
    });
  }

  /** DELETE /images/:id - delete an image you uploaded. */
  delete(id: string): Promise<void> {
    return this.http.request<void>({
      method: 'DELETE',
      path: `/images/${encodeURIComponent(id)}`,
    });
  }
}

interface BlobAndMeta {
  blob: Blob;
  filename: string;
  contentType: string;
}

async function coerceToBlob(
  input: ImageInput,
  opts: UploadImageOptions,
): Promise<BlobAndMeta> {
  // 1. String path - read from disk and infer name + type from the extension.
  if (typeof input === 'string') {
    const bytes = await readFile(input);
    const filename = opts.filename ?? basename(input);
    const contentType = opts.contentType ?? guessContentTypeFromName(filename);
    // Buffer extends Uint8Array; cast through Uint8Array for Blob compatibility.
    return {
      blob: new Blob([new Uint8Array(bytes)], { type: contentType }),
      filename,
      contentType,
    };
  }

  // 2. Already a Blob - reuse it (only override the filename if explicitly given).
  if (input instanceof Blob) {
    const filename = opts.filename ?? 'upload.bin';
    const contentType = opts.contentType ?? input.type ?? 'application/octet-stream';
    return { blob: input, filename, contentType };
  }

  // 3. Raw bytes - wrap in a Blob with whatever metadata the caller provided.
  const filename = opts.filename ?? 'upload.bin';
  const contentType = opts.contentType ?? 'application/octet-stream';
  // Copy into a fresh ArrayBuffer-backed Uint8Array. This sidesteps the
  // SharedArrayBuffer / ArrayBuffer variance issue with BlobPart and ensures
  // a stable, owned buffer for the lifetime of the upload.
  const source = input instanceof Uint8Array ? input : new Uint8Array(input);
  const owned = new Uint8Array(source.byteLength);
  owned.set(source);
  return {
    blob: new Blob([owned], { type: contentType }),
    filename,
    contentType,
  };
}

function guessContentTypeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return 'application/octet-stream';
}
