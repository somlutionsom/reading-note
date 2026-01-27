/**
 * 도서 검색 위젯 설정 API
 * BE 리드: 위젯 설정 저장 및 URL 생성
 */

import { NextRequest, NextResponse } from 'next/server';
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
      coverPropertyType,
      statusProperty,
      theme 
    } = body;

    if (!token || !databaseId) {
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
      titleProp: titleProperty,
      authorProp: authorProperty,
      coverProp: coverProperty,
      coverPropType: coverPropertyType ?? 'files',
      statusProp: statusProperty,
      primaryColor: theme?.primaryColor ?? '#6C9AC4',
      accentColor: theme?.accentColor ?? '#B4D4EC',
      backgroundColor: theme?.backgroundColor ?? '#FFFFFF',
      backgroundOpacity: theme?.backgroundOpacity ?? 95,
      fontColor: theme?.fontColor ?? '#555555',
      fontFamily: theme?.fontFamily ?? 'Corbel',
    };

    console.log('📝 위젯 설정 생성:', {
      backgroundOpacity: simpleConfig.backgroundOpacity,
      fontFamily: simpleConfig.fontFamily,
    });

    const configJson = JSON.stringify(simpleConfig);
    const encodedConfig = Buffer.from(configJson, 'utf-8').toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Vercel 배포 시 VERCEL_URL 사용, 없으면 요청 호스트 사용
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const embedUrl = `${baseUrl}/todo-widget/${encodedConfig}`;
    
    console.log('🔗 생성된 위젯 URL baseUrl:', baseUrl);

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        embedUrl,
        config: simpleConfig,
      },
    });
  } catch (error) {
    console.error('도서 위젯 설정 오류:', error);
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: {
        code: 'SETUP_ERROR',
        message: '위젯 설정 중 오류가 발생했습니다.',
      },
    });
  }
}
