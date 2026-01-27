/**
 * 데이터 검증 로직
 * 보안: 모든 입력값 검증 및 sanitize
 * BE/API: 타입 가드 및 스키마 검증
 */

import { NotionConfig, Result } from './types';

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

  if (!isNonEmptyString(config.dateProperty)) {
    return { success: false, error: new Error('Date property is required') };
  }

  if (!isNonEmptyString(config.titleProperty)) {
    return { success: false, error: new Error('Title property is required') };
  }


  return {
    success: true,
    data: {
      databaseId: sanitizeString(config.databaseId as string),
      apiKey: config.apiKey as string, // API key는 sanitize하지 않음
      dateProperty: sanitizeString(config.dateProperty as string),
      titleProperty: sanitizeString(config.titleProperty as string),
    }
  };
}

// 날짜 형식 검증 (YYYY-MM-DD)
export function validateDateFormat(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

// Database ID 형식 검증
export function validateDatabaseId(id: string): boolean {
  // Notion database ID는 32자 hex string (하이픈 제거 시)
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
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .trim()
    .slice(0, 500); // 최대 길이 제한
}

// HTML 이스케이프
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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


