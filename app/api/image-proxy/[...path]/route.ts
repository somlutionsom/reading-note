/**
 * 이미지 프록시 API (Edge Runtime)
 * 외부 이미지를 프록시하여 Notion에서 미리보기가 표시되도록 함
 * 
 * 사용법: /api/image-proxy/cover.jpg?url=https://t1.daumcdn.net/lbook/image/6253040
 * 
 * - URL 끝에 .jpg가 있어서 Notion이 이미지로 인식
 * - Edge Runtime으로 빠른 응답
 */

import { NextRequest, NextResponse } from 'next/server';

// Edge Runtime 사용 (더 빠른 응답)
export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    // 허용된 도메인 체크 (보안)
    const allowedDomains = [
      't1.daumcdn.net',
      'search1.kakaocdn.net',
      'image.aladin.co.kr',
    ];

    const urlObj = new URL(imageUrl);
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // 이미지 가져오기
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // 이미지 반환 (Notion 호환 헤더 설정)
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline; filename="cover.jpg"',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
