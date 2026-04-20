/**
 * 도서 검색 위젯 임베드 페이지
 * 인코딩된 설정을 받아 도서 검색 위젯을 표시
 */

'use client';

import React, { useState, useEffect, use } from 'react';
import BookSearchWidget from '@/app/components/BookSearchWidget';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';

interface PageProps {
  params: Promise<{
    cfg: string;
  }>;
}

export default function BookWidgetPage({ params }: PageProps) {
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resolvedParams = use(params);

  useEffect(() => {
    console.log('🔧 위젯 설정 디코딩 시작');
    try {
      // URL-safe Base64 디코딩
      const base64 = resolvedParams.cfg
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const decodedString = Buffer.from(base64 + padding, 'base64').toString('utf-8');
      const decodedData = JSON.parse(decodedString);
      
      console.log('🔧 디코딩된 원본 데이터:', decodedData);

      const parsedConfig = {
        // 노션 연동 설정
        token: decodedData.token,
        databaseId: decodedData.dbId,
        titleProperty: decodedData.titleProp,
        authorProperty: decodedData.authorProp,
        coverProperty: decodedData.coverProp,
        coverPropertyType: decodedData.coverPropType ?? 'files',
        statusProperty: decodedData.statusProp,
        // 다크모드
        darkMode: Boolean(decodedData.darkMode),
        // 테마 설정
        theme: {
          primaryColor: decodedData.primaryColor ?? '#6C9AC4',
          accentColor: decodedData.accentColor ?? '#B4D4EC',
          backgroundColor: decodedData.backgroundColor ?? '#FFFFFF',
          backgroundOpacity: decodedData.backgroundOpacity ?? 95,
          fontColor: decodedData.fontColor ?? '#555555',
          fontFamily: decodedData.fontFamily ?? 'Corbel',
        },
      };
      
      console.log('🎨 테마 설정:', {
        backgroundOpacity: parsedConfig.theme.backgroundOpacity,
        fontFamily: parsedConfig.theme.fontFamily,
      });
      
      console.log('✅ 파싱된 config:', parsedConfig);

      setConfig(parsedConfig);
    } catch (err) {
      console.error('❌ 설정 디코딩 오류:', err);
      // 설정 없이도 기본 위젯 표시
      setConfig({});
    }
  }, [resolvedParams.cfg]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#fff5f5',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#c53030',
        }}>
          <h2>오류가 발생했습니다</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return <LoadingSpinner message="설정을 불러오는 중..." />;
  }

  return (
    <ErrorBoundary>
      <BookSearchWidget config={config} />
    </ErrorBoundary>
  );
}
