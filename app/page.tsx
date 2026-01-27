/**
 * 홈페이지 - 도서 검색 위젯 데모
 */

'use client';

import BookSearchWidget from '@/app/components/BookSearchWidget';

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <h1 style={{
        fontSize: '24px',
        color: '#6C9AC4',
        marginBottom: '20px',
        fontFamily: 'Corbel, sans-serif',
        fontWeight: 300,
      }}>
        📚 Reading Note Widget
      </h1>
      <BookSearchWidget />
      <p style={{
        marginTop: '20px',
        fontSize: '12px',
        color: '#A0BBD0',
        textAlign: 'center',
      }}>
        알라딘 API를 사용한 도서 검색 위젯
      </p>
    </div>
  );
}
