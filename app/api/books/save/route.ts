/**
 * 도서를 노션 데이터베이스에 저장하는 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { ApiResponse } from '@/lib/types';
import { resolvePublicBaseUrl } from '@/lib/public-base-url';
import { archiveCoverImage } from '@/lib/image-storage';

interface SaveBookPayload {
  id?: string;
  title?: string;
  author?: string;
  cover?: string;
  coverOriginal?: string;
  isbn13?: string;
  traceId?: string;
}

interface SaveRequestBody {
  token?: string;
  databaseId?: string;
  titleProperty?: string;
  authorProperty?: string;
  coverProperty?: string;
  coverPropertyType?: 'files' | 'url' | '';
  statusProperty?: string;
  traceId?: string;
  book?: SaveBookPayload;
}

function createTraceId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `book-${Date.now()}-${random}`;
}

function normalizeHttpUrl(rawUrl?: string, baseUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }
    return url.toString();
  } catch {
    if (!baseUrl) return null;
    try {
      const relativeUrl = new URL(rawUrl, baseUrl);
      if (relativeUrl.protocol !== 'http:' && relativeUrl.protocol !== 'https:') {
        return null;
      }
      if (relativeUrl.protocol === 'http:') {
        relativeUrl.protocol = 'https:';
      }
      return relativeUrl.toString();
    } catch {
      return null;
    }
  }
}

function isProxyPath(rawUrl: string): boolean {
  try {
    return new URL(rawUrl).pathname.startsWith('/api/image-proxy/');
  } catch {
    return false;
  }
}

function normalizeProxyCoverHost(rawUrl: string, publicBaseUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.pathname.startsWith('/api/image-proxy/')) {
      return parsed.toString();
    }
    const publicBase = new URL(publicBaseUrl);
    parsed.protocol = publicBase.protocol;
    parsed.host = publicBase.host;
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function appendTraceId(rawUrl: string, traceId: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.set('traceId', traceId);
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function extractOriginalUrlFromProxy(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.pathname.startsWith('/api/image-proxy/')) {
      return null;
    }
    return normalizeHttpUrl(parsed.searchParams.get('url') || undefined);
  } catch {
    return null;
  }
}

function uniqueNonEmptyUrls(urls: Array<string | null>): string[] {
  const out: string[] = [];
  for (const url of urls) {
    if (!url) continue;
    if (!out.includes(url)) {
      out.push(url);
    }
  }
  return out;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveRequestBody;
    const {
      token,
      databaseId,
      titleProperty,
      authorProperty,
      coverProperty,
      coverPropertyType, // 'files' | 'url'
      statusProperty,
      book,
    } = body;
    const traceId = body.traceId || book?.traceId || createTraceId();
    const publicBaseUrl = resolvePublicBaseUrl(request.url);

    if (!token || !databaseId || !book) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: '필수 파라미터가 누락되었습니다.',
        },
      }, { status: 400 });
    }

    const notion = new Client({ auth: token });

    const normalizedCover = normalizeHttpUrl(book.cover, publicBaseUrl);
    const normalizedCoverOriginal = normalizeHttpUrl(book.coverOriginal, publicBaseUrl);
    const normalizedProxyCover = normalizedCover
      ? normalizeProxyCoverHost(normalizedCover, publicBaseUrl)
      : null;
    const originalFromProxy = extractOriginalUrlFromProxy(normalizedProxyCover || undefined);

    const archiveSourceUrl = normalizedCoverOriginal
      || originalFromProxy
      || (normalizedCover && !isProxyPath(normalizedCover) ? normalizedCover : null);

    const fallbackCandidates = uniqueNonEmptyUrls([
      normalizedProxyCover ? appendTraceId(normalizedProxyCover, traceId) : null,
      normalizedCoverOriginal,
      originalFromProxy,
      normalizedCover,
    ]);

    const archiveResult = archiveSourceUrl
      ? await archiveCoverImage({
        sourceUrl: archiveSourceUrl,
        traceId,
        isbn13: book.isbn13,
      })
      : null;

    const archivedCoverUrl = archiveResult?.success ? archiveResult.archivedUrl : null;
    const finalCoverUrl = archivedCoverUrl || fallbackCandidates[0] || '';
    const fallbackUsed = !archivedCoverUrl;
    const resolvedCoverPropertyType: 'files' | 'url' = coverPropertyType === 'url' ? 'url' : 'files';

    // 속성 구성
    const properties: any = {};

    // 제목 설정 (Title 타입)
    if (titleProperty) {
      properties[titleProperty] = {
        title: [{ text: { content: book.title || '' } }],
      };
    }

    // 저자 설정 (Rich Text 타입)
    // "(지은이)", "(옮긴이)", "(글)" 등 역할 표기 제거
    if (authorProperty && book.author) {
      const cleanAuthor = book.author
        .replace(/\s*\([^)]*이\)/g, '') // (지은이), (옮긴이), (글쓴이) 등 제거
        .replace(/\s*\(글\)/g, '')       // (글) 제거
        .replace(/\s*\(그림\)/g, '')     // (그림) 제거
        .trim();
      
      properties[authorProperty] = {
        rich_text: [{ text: { content: cleanAuthor } }],
      };
    }

    // 표지 설정 - 파일과 미디어(files) 타입 또는 URL 타입
    if (coverProperty && finalCoverUrl) {
      if (resolvedCoverPropertyType === 'files') {
        // 파일과 미디어 속성 (Files 타입)
        properties[coverProperty] = {
          files: [
            {
              type: 'external',
              name: 'cover.jpg',
              external: {
                url: finalCoverUrl,
              },
            },
          ],
        };
      } else {
        // URL 속성
        properties[coverProperty] = {
          url: finalCoverUrl,
        };
      }
    }

    // 상태 설정 (Select 타입) - 기본값: 읽고 싶은 책
    if (statusProperty) {
      properties[statusProperty] = {
        select: { name: '읽고 싶은 책' },
      };
    }

    console.info('📚 BOOK_SAVE: COVER_RESOLUTION', {
      traceId,
      title: book.title,
      archiveSourceUrl,
      archiveResult,
      fallbackCandidates,
      finalCoverUrl,
      fallbackUsed,
    });
    console.info('📚 노션에 도서 저장 중:', {
      traceId,
      title: book.title,
      finalCoverUrl,
    });
    console.info('📋 속성:', JSON.stringify(properties, null, 2));

    // 페이지 생성 (cover 속성에만 이미지 저장, 페이지 커버에는 저장 안 함)
    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    console.info('✅ 도서 저장 완료:', {
      traceId,
      pageId: page.id,
      coverUrlUsed: finalCoverUrl,
      imageArchived: Boolean(archivedCoverUrl),
    });

    return NextResponse.json<ApiResponse<{
      pageId: string;
      coverUrlUsed: string;
      imageArchived: boolean;
      archiveProvider: string;
      archiveReason?: string;
      traceId: string;
    }>>({
      success: true,
      data: {
        pageId: page.id,
        coverUrlUsed: finalCoverUrl,
        imageArchived: Boolean(archivedCoverUrl),
        archiveProvider: archivedCoverUrl ? 'vercel-blob' : 'fallback',
        archiveReason: archiveResult?.success ? undefined : archiveResult?.reason,
        traceId,
      },
    });

  } catch (error) {
    console.error('도서 저장 오류:', error);
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: {
        code: 'SAVE_ERROR',
        message: `도서 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      },
    }, { status: 500 });
  }
}
