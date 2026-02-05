/**
 * 이미지 프록시 API (Edge Runtime)
 * 외부 이미지를 프록시하여 Notion에서 미리보기가 표시되도록 함
 * 
 * 사용법: /api/image-proxy/cover.jpg?url=https://t1.daumcdn.net/lbook/image/6253040
 * 
 * - URL 끝에 .jpg가 있어서 Notion이 이미지로 인식
 * - Edge Runtime으로 빠른 응답
 * - HEAD/OPTIONS 요청 지원으로 Notion 웹 호환성 확보
 */

import { NextRequest, NextResponse } from 'next/server';

// Edge Runtime 사용 (더 빠른 응답)
export const runtime = 'edge';

// 카카오/다음/알라딘 이미지 CDN의 서브도메인을 포괄적으로 허용
const allowedHostSuffixes = [
  'daumcdn.net',
  'kakaocdn.net',
  'aladin.co.kr',
];

/**
 * 이미지 응답 헤더 생성
 * Notion 웹/앱, 모든 브라우저에서 호환되도록 필요한 모든 헤더 포함
 */
function buildImageHeaders(contentType: string | null, contentLength?: number): Record<string, string> {
  const headers: Record<string, string> = {
    // 기본 콘텐츠 헤더
    'Content-Type': contentType || 'image/jpeg',
    'Content-Disposition': 'inline; filename="cover.jpg"',
    
    // 캐싱 헤더 (1년 캐시)
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Vary': 'Accept-Encoding',
    
    // CORS 헤더 (모든 출처 허용)
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range, Accept-Ranges',
    'Access-Control-Max-Age': '86400',
    
    // 보안 헤더
    'X-Content-Type-Options': 'nosniff',
    
    // 범위 요청 지원 (이미지 스트리밍용)
    'Accept-Ranges': 'bytes',
  };
  
  // Content-Length가 있으면 추가 (Notion이 요구할 수 있음)
  if (contentLength !== undefined && contentLength > 0) {
    headers['Content-Length'] = String(contentLength);
  }
  
  return headers;
}

/**
 * URL 파라미터에서 이미지 URL 추출 및 검증
 */
function getImageUrl(request: NextRequest): { imageUrl: string } | { error: NextResponse } {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    console.error('🖼️ IMAGE_PROXY_ERROR: MISSING_URL', {
      url: request.url,
    });
    return { error: new NextResponse('Missing url parameter', { status: 400 }) };
  }

  try {
    const urlObj = new URL(imageUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const isAllowed = allowedHostSuffixes.some(
      suffix => hostname === suffix || hostname.endsWith(`.${suffix}`)
    );
    
    if (!isAllowed) {
      console.error('🖼️ IMAGE_PROXY_ERROR: DOMAIN_NOT_ALLOWED', {
        imageUrl,
        hostname,
        allowedHostSuffixes,
      });
      return { error: new NextResponse('Domain not allowed', { status: 403 }) };
    }
  } catch {
    console.error('🖼️ IMAGE_PROXY_ERROR: INVALID_URL', { imageUrl });
    return { error: new NextResponse('Invalid URL', { status: 400 }) };
  }

  return { imageUrl };
}

/**
 * 외부 이미지 서버에 요청
 */
async function fetchImage(imageUrl: string, method: 'GET' | 'HEAD') {
  const urlObj = new URL(imageUrl);
  
  return fetch(imageUrl, {
    method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      // 일부 CDN은 Referer가 없으면 403을 반환
      'Referer': `${urlObj.protocol}//${urlObj.host}/`,
    },
  });
}

/**
 * CORS preflight 요청 처리
 */
export async function OPTIONS(request: NextRequest) {
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

/**
 * GET 요청: 이미지 데이터 반환
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const result = getImageUrl(request);
    if ('error' in result) {
      return result.error;
    }

    console.log('🖼️ IMAGE_PROXY_FETCH: START', {
      imageUrl: result.imageUrl,
      requestUrl: request.url,
    });

    const response = await fetchImage(result.imageUrl, 'GET');
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('🖼️ IMAGE_PROXY_ERROR: FETCH_FAILED', {
        imageUrl: result.imageUrl,
        status: response.status,
        statusText: response.statusText,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        errorBody: errorBody.slice(0, 500),
      });
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type');
    const contentLength = imageBuffer.byteLength;

    console.log('🖼️ IMAGE_PROXY_FETCH: SUCCESS', {
      imageUrl: result.imageUrl,
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
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new NextResponse('Internal server error', { status: 500 });
  }
}

/**
 * HEAD 요청: 헤더만 반환 (Notion 웹에서 이미지 유효성 검증용)
 */
export async function HEAD(request: NextRequest) {
  try {
    const result = getImageUrl(request);
    if ('error' in result) {
      return result.error;
    }

    console.log('🖼️ IMAGE_PROXY_HEAD: START', {
      imageUrl: result.imageUrl,
    });

    // HEAD 요청 시도, 실패하면 GET으로 폴백
    let response = await fetchImage(result.imageUrl, 'HEAD');
    let contentLength: number | undefined;
    
    if (!response.ok) {
      // HEAD가 지원되지 않으면 GET으로 시도
      console.log('🖼️ IMAGE_PROXY_HEAD: HEAD failed, trying GET', {
        imageUrl: result.imageUrl,
        status: response.status,
      });
      response = await fetchImage(result.imageUrl, 'GET');
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        contentLength = buffer.byteLength;
      }
    } else {
      // HEAD 응답에서 Content-Length 추출
      const lengthHeader = response.headers.get('content-length');
      if (lengthHeader) {
        contentLength = parseInt(lengthHeader, 10);
      }
    }

    const contentType = response.headers.get('content-type');
    
    console.log('🖼️ IMAGE_PROXY_HEAD: SUCCESS', {
      imageUrl: result.imageUrl,
      contentType,
      contentLength,
    });

    return new NextResponse(null, {
      status: response.ok ? 200 : response.status,
      headers: buildImageHeaders(contentType, contentLength),
    });
  } catch (error) {
    console.error('🖼️ IMAGE_PROXY_HEAD_ERROR: UNHANDLED', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new NextResponse('Internal server error', { status: 500 });
  }
}
