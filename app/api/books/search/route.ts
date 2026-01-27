/**
 * 알라딘 도서 검색 API
 * 알라딘 Open API를 사용하여 도서를 검색합니다.
 */

import { NextRequest, NextResponse } from 'next/server';

interface AladinBook {
  itemId: number;
  title: string;
  author: string;
  cover: string;
  publisher: string;
  pubDate: string;
  description: string;
  isbn13: string;
  priceStandard: number;
  link: string;
}

interface BookResult {
  id: number;
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

    const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;

    if (!ALADIN_TTB_KEY) {
      console.error('알라딘 API 키가 설정되지 않았습니다.');
      return NextResponse.json({
        success: false,
        error: {
          code: 'API_KEY_MISSING',
          message: '알라딘 API 키가 설정되지 않았습니다.',
        },
      }, { status: 500 });
    }

    // 알라딘 API 호출
    const aladinUrl = new URL('http://www.aladin.co.kr/ttb/api/ItemSearch.aspx');
    aladinUrl.searchParams.set('ttbkey', ALADIN_TTB_KEY);
    aladinUrl.searchParams.set('Query', query);
    aladinUrl.searchParams.set('QueryType', 'Keyword');
    aladinUrl.searchParams.set('MaxResults', maxResults);
    aladinUrl.searchParams.set('start', '1');
    aladinUrl.searchParams.set('SearchTarget', 'Book');
    aladinUrl.searchParams.set('output', 'js');
    aladinUrl.searchParams.set('Version', '20131101');
    aladinUrl.searchParams.set('Cover', 'Big'); // 큰 표지 이미지

    console.log('📚 알라딘 API 호출:', aladinUrl.toString().replace(ALADIN_TTB_KEY, '***'));

    const response = await fetch(aladinUrl.toString());
    
    if (!response.ok) {
      throw new Error(`알라딘 API 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    if (data.errorCode) {
      console.error('알라딘 API 오류:', data.errorMessage);
      return NextResponse.json({
        success: false,
        error: {
          code: 'ALADIN_API_ERROR',
          message: data.errorMessage || '알라딘 API 오류가 발생했습니다.',
        },
      }, { status: 400 });
    }

    // 결과 변환
    const books: BookResult[] = (data.item || []).map((item: AladinBook, index: number) => ({
      id: item.itemId,
      title: item.title,
      author: item.author,
      cover: item.cover,
      color: PASTEL_COLORS[index % PASTEL_COLORS.length],
      publisher: item.publisher,
      pubDate: item.pubDate,
      description: item.description,
      isbn13: item.isbn13,
      price: item.priceStandard,
      link: item.link,
    }));

    console.log(`✅ 검색 결과: ${books.length}권 발견`);

    return NextResponse.json({
      success: true,
      data: books,
      totalResults: data.totalResults || 0,
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
