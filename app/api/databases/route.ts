/**
 * 데이터베이스 목록 API
 * BE/API: Notion 데이터베이스 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key is required',
        },
      }, { status: 400 });
    }

    // Notion 데이터베이스 목록 가져오기
    const result = await NotionService.getDatabases(apiKey);

    if (!result.success) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'DATABASE_FETCH_FAILED',
          message: 'Failed to fetch databases',
          details: result.error.message,
        },
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse<Array<{ id: string; title: string }>>>({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('데이터베이스 목록 조회 오류:', error);
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
      },
    }, { status: 500 });
  }
}
