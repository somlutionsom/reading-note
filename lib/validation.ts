/**
 * 데이터 검증 로직
 * 보안: 모든 입력값 검증 및 sanitize
 * BE/API: 타입 가드 및 스키마 검증
 */

import { NotionConfig, Result, BookItem } from './types';

// Notion 설정 검증
export function validateNotionConfig(data: unknown): Result<NotionConfig> {
  if (!isObject(data)) {
    return { success: false, error: new Error('Invalid config format') };
  }

  const config = data as Record<string, unknown>;

  if (!isNonEmptyString(config.databaseId)) {
    return { success: false, error: new Error('Database ID is required') };
  }

  if (!isNonEmptyString(config.apiKey)) {
    return { success: false, error: new Error('API key is required') };
  }

  return {
    success: true,
    data: {
      databaseId: sanitizeString(config.databaseId as string),
      apiKey: config.apiKey as string,
      titleProperty: config.titleProperty ? sanitizeString(config.titleProperty as string) : undefined,
      authorProperty: config.authorProperty ? sanitizeString(config.authorProperty as string) : undefined,
      coverProperty: config.coverProperty ? sanitizeString(config.coverProperty as string) : undefined,
      statusProperty: config.statusProperty ? sanitizeString(config.statusProperty as string) : undefined,
    }
  };
}

// 도서 검색어 검증
export function validateSearchQuery(query: string): boolean {
  if (!query || typeof query !== 'string') return false;
  const trimmed = query.trim();
  return trimmed.length >= 1 && trimmed.length <= 100;
}

// ISBN 형식 검증
export function validateISBN(isbn: string): boolean {
  const cleaned = isbn.replace(/-/g, '');
  return /^\d{13}$/.test(cleaned);
}

// Database ID 형식 검증
export function validateDatabaseId(id: string): boolean {
  const cleaned = id.replace(/-/g, '');
  return /^[a-f0-9]{32}$/i.test(cleaned);
}

// 타입 가드 함수들
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// XSS 방지를 위한 문자열 sanitize
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 500);
}

// HTML 이스케이프 (서버 사이드 호환)
export function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

// URL 검증
export function validateUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// 도서 데이터 검증
export function validateBookItem(data: unknown): Result<BookItem> {
  if (!isObject(data)) {
    return { success: false, error: new Error('Invalid book format') };
  }

  const book = data as Record<string, unknown>;

  if (typeof book.id !== 'number') {
    return { success: false, error: new Error('Book ID is required') };
  }

  if (!isNonEmptyString(book.title)) {
    return { success: false, error: new Error('Book title is required') };
  }

  return {
    success: true,
    data: {
      id: book.id as number,
      title: sanitizeString(book.title as string),
      author: book.author ? sanitizeString(book.author as string) : '',
      cover: book.cover ? String(book.cover) : '',
      color: book.color ? String(book.color) : '#CDE4F5',
      publisher: book.publisher ? sanitizeString(book.publisher as string) : undefined,
      pubDate: book.pubDate ? String(book.pubDate) : undefined,
      description: book.description ? sanitizeString(book.description as string) : undefined,
      isbn13: book.isbn13 ? String(book.isbn13) : undefined,
      price: typeof book.price === 'number' ? book.price : undefined,
      link: book.link ? String(book.link) : undefined,
    }
  };
}
