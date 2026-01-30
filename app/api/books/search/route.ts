/**
 * 카카오 도서 검색 API
 * 카카오 책 검색 API를 사용하여 도서를 검색합니다.
 * https://developers.kakao.com/docs/latest/ko/daum-search/dev-guide#search-book
 */

import { NextRequest, NextResponse } from 'next/server';

interface KakaoBook {
  title: string;
  contents: string;
  url: string;
  isbn: string;
  datetime: string;
  authors: string[];
  publisher: string;
  translators: string[];
  price: number;
  sale_price: number;
  thumbnail: string;
  status: string;
}

interface KakaoBookResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoBook[];
}

interface BookResult {
  id: string;
  title: string;
  author: string;
  cover: string;
  color: string;
  publisher?: string;
  pubDate?: string;
  description?: string;
  isbn13?: string;
  price?: number;
  link?: string;
}

// 파스텔 색상 배열 (표지가 없을 때 사용)
const PASTEL_COLORS = [
  "#CDE4F5", "#D8EBF7", "#E0F0FA", "#D1E6F3", "#DBEEF9",
  "#E8F4FC", "#C5DFF8", "#D4E6F1", "#E1F0F5", "#CCE5FF"
];

/**
 * ISBN 문자열에서 ISBN13 추출
 * 카카오 API는 "ISBN10 ISBN13" 형식으로 반환할 수 있음
 */
function extractIsbn13(isbn: string): string {
  if (!isbn) return '';
  const parts = isbn.split(' ');
  // ISBN13은 13자리
  const isbn13 = parts.find(part => part.length === 13);
  return isbn13 || parts[0] || '';
}

/**
 * ISO 8601 날짜를 YYYY-MM-DD 형식으로 변환
 */
function formatDate(datetime: string): string {
  if (!datetime) return '';
  try {
    const date = new Date(datetime);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const maxResults = searchParams.get('maxResults') || '10';

    if (!query) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: '검색어를 입력해주세요.',
        },
      }, { status: 400 });
    }

    const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;

    if (!KAKAO_REST_API_KEY) {
      console.error('카카오 REST API 키가 설정되지 않았습니다.');
      return NextResponse.json({
        success: false,
        error: {
          code: 'API_KEY_MISSING',
          message: '카카오 REST API 키가 설정되지 않았습니다.',
        },
      }, { status: 500 });
    }

    // 카카오 책 검색 API 호출
    const kakaoUrl = new URL('https://dapi.kakao.com/v3/search/book');
    kakaoUrl.searchParams.set('query', query);
    kakaoUrl.searchParams.set('size', maxResults);
    kakaoUrl.searchParams.set('sort', 'accuracy');

    console.log('📚 카카오 책 검색 API 호출:', kakaoUrl.toString());

    const response = await fetch(kakaoUrl.toString(), {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('카카오 API 응답 오류:', response.status, errorText);
      throw new Error(`카카오 API 응답 오류: ${response.status}`);
    }

    const data: KakaoBookResponse = await response.json();

    // 결과 변환 (기존 알라딘 API 응답 형식과 동일하게 유지)
    const books: BookResult[] = (data.documents || []).map((item: KakaoBook, index: number) => ({
      id: extractIsbn13(item.isbn) || `kakao-${index}`,
      title: item.title,
      author: item.authors.join(', '),
      cover: item.thumbnail,
      color: PASTEL_COLORS[index % PASTEL_COLORS.length],
      publisher: item.publisher,
      pubDate: formatDate(item.datetime),
      description: item.contents,
      isbn13: extractIsbn13(item.isbn),
      price: item.price,
      link: item.url,
    }));

    console.log(`✅ 검색 결과: ${books.length}권 발견`);

    return NextResponse.json({
      success: true,
      data: books,
      totalResults: data.meta?.total_count || 0,
    });

  } catch (error) {
    console.error('도서 검색 오류:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: '도서 검색 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
    }, { status: 500 });
  }
}
