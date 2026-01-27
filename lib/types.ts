/**
 * 전역 타입 정의
 * PM/UX: 사용자 경험을 위한 명확한 데이터 구조
 * FE 리드: TypeScript 엄격 모드 준수
 */

// Notion 관련 타입
export interface NotionConfig {
  databaseId: string;
  apiKey: string;
  titleProperty?: string;
  authorProperty?: string;
  coverProperty?: string;
  statusProperty?: string;
}

// 도서 아이템 타입
export interface BookItem {
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

// 독서 기록 타입
export interface ReadingRecord {
  id: string;
  book: BookItem;
  status: 'reading' | 'completed' | 'want-to-read';
  startDate?: string;
  endDate?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  totalResults?: number;
}

// 위젯 설정 타입
export interface WidgetConfig {
  id: string;
  notionConfig?: NotionConfig;
  theme?: ThemeConfig;
  createdAt: string;
  updatedAt: string;
}

// 테마 설정
export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  fontColor?: string;
  fontFamily?: string;
}

// Result 타입 (에러 핸들링용)
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// 환경 설정 타입
export interface EnvConfig {
  ALADIN_TTB_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  VERCEL_URL?: string;
}
