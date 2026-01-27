/**
 * 투두리스트 위젯 설정 API
 * BE 리드: 투두리스트 위젯 설정 저장 및 URL 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, databaseId, dateProperty, titleProperty, theme, recurringTodos = [] } = body;

    if (!token || !databaseId || !dateProperty || !titleProperty) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: '필수 파라미터가 누락되었습니다.',
        },
      });
    }

    // 설정을 Base64로 인코딩
    const simpleConfig = {
      token,
      dbId: databaseId,
      dateProp: dateProperty,
      titleProp: titleProperty,
      primaryColor: theme.primaryColor,
      accentColor: theme.accentColor,
      backgroundColor: theme.backgroundColor,
      backgroundOpacity: theme.backgroundOpacity,
      fontColor: theme.fontColor,
      fontFamily: theme.fontFamily || 'Galmuri11', // 폰트 설정 추가
      checkboxStyle: theme.checkboxStyle || 'circle',
      recurring: recurringTodos,
    };

    const configJson = JSON.stringify(simpleConfig);
    const encodedConfig = Buffer.from(configJson, 'utf-8').toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const embedUrl = `${baseUrl}/todo-widget/${encodedConfig}`;

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        embedUrl,
        config: simpleConfig,
      },
    });
  } catch (error) {
    console.error('투두리스트 위젯 설정 오류:', error);
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: {
        code: 'SETUP_ERROR',
        message: '위젯 설정 중 오류가 발생했습니다.',
      },
    });
  }
}
