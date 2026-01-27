/**
 * 도서를 노션 데이터베이스에 저장하는 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      token, 
      databaseId, 
      titleProperty, 
      authorProperty, 
      coverProperty,
      coverPropertyType, // 'files' | 'url'
      statusProperty,
      book 
    } = body;

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

    // 속성 구성
    const properties: any = {};

    // 제목 설정 (Title 타입)
    if (titleProperty) {
      properties[titleProperty] = {
        title: [{ text: { content: book.title || '' } }],
      };
    }

    // 저자 설정 (Rich Text 타입)
    if (authorProperty && book.author) {
      properties[authorProperty] = {
        rich_text: [{ text: { content: book.author } }],
      };
    }

    // 표지 설정 - 파일과 미디어(files) 타입 또는 URL 타입
    if (coverProperty && book.cover) {
      if (coverPropertyType === 'files') {
        // 파일과 미디어 속성 (Files 타입)
        properties[coverProperty] = {
          files: [
            {
              type: 'external',
              name: 'cover.jpg',
              external: {
                url: book.cover,
              },
            },
          ],
        };
      } else {
        // URL 속성
        properties[coverProperty] = {
          url: book.cover,
        };
      }
    }

    // 상태 설정 (Select 타입) - 기본값: 읽고 싶은 책
    if (statusProperty) {
      properties[statusProperty] = {
        select: { name: '읽고 싶은 책' },
      };
    }

    console.log('📚 노션에 도서 저장 중:', book.title);
    console.log('📋 속성:', JSON.stringify(properties, null, 2));

    // 페이지 생성
    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
      // 표지 이미지를 페이지 커버로도 설정
      ...(book.cover && {
        cover: {
          type: 'external',
          external: { url: book.cover },
        },
      }),
    });

    console.log('✅ 도서 저장 완료:', page.id);

    return NextResponse.json<ApiResponse<{ pageId: string }>>({
      success: true,
      data: { pageId: page.id },
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
