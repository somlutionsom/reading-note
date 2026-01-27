/**
 * 도서 데이터베이스 스키마 분석 API
 * BE/API: 독서 기록용 데이터베이스 속성을 자동으로 분석하여 매칭
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotionService } from '@/lib/notion';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, databaseId } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key is required',
        },
      }, { status: 400 });
    }

    if (!databaseId || typeof databaseId !== 'string') {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'INVALID_DATABASE_ID',
          message: 'Database ID is required',
        },
      }, { status: 400 });
    }

    // 도서용 데이터베이스 스키마 자동 분석
    const result = await NotionService.analyzeBookDatabase(apiKey, databaseId);

    if (!result.success) {
      return NextResponse.json<ApiResponse<never>>({
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: 'Failed to analyze database schema',
          details: result.error.message,
        },
      }, { status: 400 });
    }

    return NextResponse.json<ApiResponse<{
      titleProperty: string;
      authorProperty: string;
      coverProperty: string;
      statusProperty: string;
    }>>({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error('도서 데이터베이스 분석 오류:', error);
    return NextResponse.json<ApiResponse<never>>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    }, { status: 500 });
  }
}
