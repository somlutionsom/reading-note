/**
 * 전역 타입 정의
 * PM/UX: 사용자 경험을 위한 명확한 데이터 구조
 * FE 리드: TypeScript 엄격 모드 준수
 */

// Notion 관련 타입
export interface NotionConfig {
  databaseId: string;
  apiKey: string;
  dateProperty: string;
  titleProperty: string;
}


// 투두리스트 아이템 타입
export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  isImportant?: boolean;
  createdAt: string;
  updatedAt: string;
}

// 투두리스트 페이지 타입
export interface TodoPage {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  todos: TodoItem[];
  pageUrl: string;
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
}

// 위젯 설정 타입
export interface WidgetConfig {
  id: string;
  notionConfig: NotionConfig;
  theme?: ThemeConfig;
  createdAt: string;
  updatedAt: string;
}

// 테마 설정
export interface ThemeConfig {
  primaryColor?: string;
  accentColor?: string;
  importantColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  fontColor?: string;
  fontFamily?: string;
  checkboxStyle?: 'circle' | 'heart'; // 체크박스 스타일 선택
}


// Result 타입 (에러 핸들링용)
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// 환경 설정 타입
export interface EnvConfig {
  NOTION_API_VERSION: string;
  ENCRYPTION_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  VERCEL_URL?: string;
}

