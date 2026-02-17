/**
 * 이미지 프록시 API (Edge Runtime)
 * 외부 이미지를 프록시하여 Notion에서 미리보기가 표시되도록 함
 *
 * 사용법: /api/image-proxy/cover.jpg?url=https://t1.daumcdn.net/lbook/image/6253040
 *
 * - URL 끝에 .jpg가 있어 Notion 인식률 향상
 * - HEAD/OPTIONS 요청 지원
 * - traceId 로깅 지원
 * - timeout 및 Content-Type(image/*) 검증 강화
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const allowedHostSuffixes = [
  'daumcdn.net',
  'kakaocdn.net',
  'aladin.co.kr',
];

const DEFAULT_UPSTREAM_TIMEOUT_MS = 15000;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function normalizeContentType(contentType: string | null): string | null {
  if (!contentType) return null;
  return contentType.split(';')[0].trim().toLowerCase();
}

function isImageContentType(contentType: string | null): boolean {
  return Boolean(contentType && contentType.startsWith('image/'));
}

function buildErrorHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store, max-age=0',
  };
}

function buildImageHeaders(contentType: string | null, contentLength?: number): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': contentType || 'image/jpeg',
    'Content-Disposition': 'inline; filename="cover.jpg"',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Vary': 'Accept-Encoding',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges',
    'Access-Control-Max-Age': '86400',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };

  if (contentLength !== undefined && contentLength > 0) {
    headers['Content-Length'] = String(contentLength);
  }

  return headers;
}

function errorResponse(message: string, status: number): NextResponse {
  return new NextResponse(message, {
    status,
    headers: buildErrorHeaders(),
  });
}

function getProxyRequestInfo(
  request: NextRequest
): { imageUrl: string; traceId: string } | { error: NextResponse } {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const traceId = searchParams.get('traceId') || 'no-trace';

  if (!imageUrl) {
    console.error('🖼️ IMAGE_PROXY_ERROR: MISSING_URL', {
      traceId,
      requestUrl: request.url,
    });
    return { error: errorResponse('Missing url parameter', 400) };
  }

  try {
    const parsed = new URL(imageUrl);
    const hostname = parsed.hostname.toLowerCase();
    const allowed = allowedHostSuffixes.some(
      (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`)
    );
    if (!allowed) {
      console.error('🖼️ IMAGE_PROXY_ERROR: DOMAIN_NOT_ALLOWED', {
        traceId,
        imageUrl,
        hostname,
      });
      return { error: errorResponse('Domain not allowed', 403) };
    }
  } catch {
    console.error('🖼️ IMAGE_PROXY_ERROR: INVALID_URL', {
      traceId,
      imageUrl,
    });
    return { error: errorResponse('Invalid URL', 400) };
  }

  return { imageUrl, traceId };
}

async function fetchImage(imageUrl: string, method: 'GET' | 'HEAD', traceId: string): Promise<Response> {
  const timeoutMs = parsePositiveInt(process.env.IMAGE_FETCH_TIMEOUT_MS, DEFAULT_UPSTREAM_TIMEOUT_MS);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const targetUrl = new URL(imageUrl);

  try {
    return await fetch(imageUrl, {
      method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': `${targetUrl.protocol}//${targetUrl.host}/`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('🖼️ IMAGE_PROXY_ERROR: UPSTREAM_TIMEOUT', {
        traceId,
        imageUrl,
        timeoutMs,
      });
      throw new Error(`UPSTREAM_TIMEOUT:${timeoutMs}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const info = getProxyRequestInfo(request);
    if ('error' in info) return info.error;

    const response = await fetchImage(info.imageUrl, 'GET', info.traceId);
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('🖼️ IMAGE_PROXY_ERROR: FETCH_FAILED', {
        traceId: info.traceId,
        imageUrl: info.imageUrl,
        status: response.status,
        statusText: response.statusText,
        errorBody: errorBody.slice(0, 300),
      });
      return errorResponse('Failed to fetch image', response.status);
    }

    const contentType = normalizeContentType(response.headers.get('content-type'));
    if (!isImageContentType(contentType)) {
      const body = await response.text();
      console.error('🖼️ IMAGE_PROXY_ERROR: INVALID_CONTENT_TYPE', {
        traceId: info.traceId,
        imageUrl: info.imageUrl,
        contentType,
        bodyPreview: body.slice(0, 300),
      });
      return errorResponse('Upstream response is not an image', 502);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentLength = imageBuffer.byteLength;

    console.log('🖼️ IMAGE_PROXY_FETCH: SUCCESS', {
      traceId: info.traceId,
      imageUrl: info.imageUrl,
      contentType,
      size: contentLength,
    });

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: buildImageHeaders(contentType, contentLength),
    });
  } catch (error) {
    console.error('🖼️ IMAGE_PROXY_ERROR: UNHANDLED', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse('Internal server error', 500);
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const info = getProxyRequestInfo(request);
    if ('error' in info) return info.error;

    let response = await fetchImage(info.imageUrl, 'HEAD', info.traceId);
    let contentType = normalizeContentType(response.headers.get('content-type'));
    let contentLength: number | undefined;

    if (!response.ok || !isImageContentType(contentType)) {
      response = await fetchImage(info.imageUrl, 'GET', info.traceId);
      if (!response.ok) {
        console.error('🖼️ IMAGE_PROXY_HEAD_ERROR: FALLBACK_FAILED', {
          traceId: info.traceId,
          imageUrl: info.imageUrl,
          status: response.status,
        });
        return errorResponse('Failed to fetch image', response.status);
      }

      contentType = normalizeContentType(response.headers.get('content-type'));
      if (!isImageContentType(contentType)) {
        const body = await response.text();
        console.error('🖼️ IMAGE_PROXY_HEAD_ERROR: INVALID_CONTENT_TYPE', {
          traceId: info.traceId,
          imageUrl: info.imageUrl,
          contentType,
          bodyPreview: body.slice(0, 300),
        });
        return errorResponse('Upstream response is not an image', 502);
      }

      const buffer = await response.arrayBuffer();
      contentLength = buffer.byteLength;
    } else {
      const lengthHeader = response.headers.get('content-length');
      if (lengthHeader) {
        contentLength = Number.parseInt(lengthHeader, 10);
      }
    }

    console.log('🖼️ IMAGE_PROXY_HEAD: SUCCESS', {
      traceId: info.traceId,
      imageUrl: info.imageUrl,
      contentType,
      contentLength,
    });

    return new NextResponse(null, {
      status: 200,
      headers: buildImageHeaders(contentType, contentLength),
    });
  } catch (error) {
    console.error('🖼️ IMAGE_PROXY_HEAD_ERROR: UNHANDLED', {
      error: error instanceof Error ? error.message : String(error),
    });
    return errorResponse('Internal server error', 500);
  }
}
