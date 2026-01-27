/**
 * 투두리스트 위젯 임베드 페이지
 * 인코딩된 설정을 받아 투두리스트를 표시
 */

'use client';

import React, { useState, useEffect, use } from 'react';
import { TodoList } from '@/app/components/TodoList';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { LoadingSpinner } from '@/app/components/LoadingSpinner';

interface PageProps {
  params: Promise<{
    cfg: string;
  }>;
}

export default function TodoWidgetPage({ params }: PageProps) {
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
      console.log('🔧 반복 할 일 (decodedData.recurring):', decodedData.recurring);

      const parsedConfig = {
        token: decodedData.token,
        databaseId: decodedData.dbId,
        dateProperty: decodedData.dateProp,
        titleProperty: decodedData.titleProp,
        recurringTodos: decodedData.recurring || [],
        theme: {
          primaryColor: decodedData.primaryColor,
          accentColor: decodedData.accentColor,
          backgroundColor: decodedData.backgroundColor,
          backgroundOpacity: decodedData.backgroundOpacity,
          fontColor: decodedData.fontColor,
          checkboxStyle: decodedData.checkboxStyle || 'circle',
          fontFamily: decodedData.fontFamily || 'Galmuri11', // 디코딩된 폰트 사용
        },
      };
      
      console.log('🔧 선택된 폰트:', decodedData.fontFamily);
      
      console.log('✅ 파싱된 config:', parsedConfig);
      console.log('✅ 파싱된 config.recurringTodos:', parsedConfig.recurringTodos);

      setConfig(parsedConfig);
    } catch (err) {
      console.error('❌ 설정 디코딩 오류:', err);
      setError('잘못된 설정입니다.');
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
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '0.5rem',
      paddingLeft: 'calc(0.5rem + 28px)', // Increased left padding by 10px (18px -> 28px)
      background: 'transparent',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
      }}>
        <ErrorBoundary>
          <TodoList
            configId="embedded"
            config={config}
            theme={config.theme}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
