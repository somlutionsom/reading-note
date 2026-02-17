/**
 * 이미지 재호스팅 서비스
 * 원본 CDN 이미지를 영구 URL로 저장하여 Notion 엑박 재발을 줄임
 */

import { createHash } from 'crypto';

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

interface ArchiveCoverInput {
  sourceUrl: string;
  traceId: string;
  isbn13?: string;
}

export interface ArchiveCoverResult {
  success: boolean;
  archivedUrl?: string;
  sourceUrl: string;
  provider: 'vercel-blob' | 'none';
  reason?: string;
  contentType?: string;
  size?: number;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeImageUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    // 혼합 콘텐츠 이슈/리디렉션 이슈를 줄이기 위해 https 우선
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }
    return url.toString();
  } catch {
    return null;
  }
}

function normalizeContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  return contentType.split(';')[0].trim().toLowerCase();
}

function isSupportedImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  // SVG는 스크립트 가능성이 있어 제외
  if (contentType === 'image/svg+xml') return false;
  return contentType.startsWith('image/');
}

function extensionFromContentType(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/avif':
      return '.avif';
    case 'image/bmp':
      return '.bmp';
    default:
      return '.img';
  }
}

function buildBlobPath(hash: string, extension: string, isbn13?: string): string {
  const safeIsbn = (isbn13 || '').replace(/[^0-9]/g, '').slice(0, 13);
  const prefix = safeIsbn ? `${safeIsbn}/` : '';
  return `book-covers/${prefix}${hash}${extension}`;
}

async function uploadToVercelBlob(params: {
  pathname: string;
  body: ArrayBuffer;
  contentType: string;
  token: string;
}): Promise<string> {
  const uploadUrl = `https://blob.vercel-storage.com/${params.pathname}`;
  const payload = new Blob([params.body], { type: params.contentType });
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${params.token}`,
      'x-access': 'public',
      'x-content-type': params.contentType,
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
      'x-cache-control-max-age': String(31536000),
      'content-type': params.contentType,
    },
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`BLOB_UPLOAD_FAILED:${response.status}:${errorText.slice(0, 300)}`);
  }

  const data = await response.json() as { url?: string };
  if (!data.url) {
    throw new Error('BLOB_UPLOAD_INVALID_RESPONSE');
  }
  return data.url;
}

async function fetchImageForArchive(sourceUrl: string, traceId: string): Promise<{
  data: ArrayBuffer;
  contentType: string;
}> {
  const timeoutMs = parsePositiveInt(process.env.IMAGE_FETCH_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const maxBytes = parsePositiveInt(process.env.IMAGE_STORAGE_MAX_BYTES, DEFAULT_MAX_IMAGE_BYTES);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
        'User-Agent': 'reading-flow-widget/1.0 image-archiver',
      },
    });

    if (!response.ok) {
      throw new Error(`IMAGE_FETCH_FAILED:${response.status}`);
    }

    const contentType = normalizeContentType(response.headers.get('content-type'));
    if (!isSupportedImageContentType(contentType)) {
      throw new Error(`UNSUPPORTED_CONTENT_TYPE:${contentType || 'unknown'}`);
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error('EMPTY_IMAGE_RESPONSE');
    }
    if (buffer.byteLength > maxBytes) {
      throw new Error(`IMAGE_TOO_LARGE:${buffer.byteLength}`);
    }

    return {
      data: buffer,
      contentType: contentType as string,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`IMAGE_FETCH_TIMEOUT:${timeoutMs}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    console.info('🗂️ IMAGE_ARCHIVE_FETCH_DONE', {
      traceId,
      sourceUrl,
    });
  }
}

export async function archiveCoverImage({
  sourceUrl,
  traceId,
  isbn13,
}: ArchiveCoverInput): Promise<ArchiveCoverResult> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    return {
      success: false,
      sourceUrl,
      provider: 'none',
      reason: 'BLOB_TOKEN_MISSING',
    };
  }

  const normalizedSourceUrl = normalizeImageUrl(sourceUrl);
  if (!normalizedSourceUrl) {
    return {
      success: false,
      sourceUrl,
      provider: 'none',
      reason: 'INVALID_SOURCE_URL',
    };
  }

  try {
    const fetched = await fetchImageForArchive(normalizedSourceUrl, traceId);
    const hash = createHash('sha256').update(Buffer.from(fetched.data)).digest('hex').slice(0, 40);
    const extension = extensionFromContentType(fetched.contentType);
    const pathname = buildBlobPath(hash, extension, isbn13);
    const uploadedUrl = await uploadToVercelBlob({
      pathname,
      body: fetched.data,
      contentType: fetched.contentType,
      token: blobToken,
    });

    return {
      success: true,
      sourceUrl: normalizedSourceUrl,
      archivedUrl: uploadedUrl,
      provider: 'vercel-blob',
      contentType: fetched.contentType,
      size: fetched.data.byteLength,
    };
  } catch (error) {
    return {
      success: false,
      sourceUrl: normalizedSourceUrl,
      provider: 'vercel-blob',
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
