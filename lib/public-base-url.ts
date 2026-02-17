/**
 * Public base URL helpers
 * Notion에서 접근 가능한 고정 공개 도메인을 사용하기 위한 유틸
 */

const DEFAULT_PUBLIC_BASE_URL = 'https://somy2kreadingnote.vercel.app';

function normalizeBaseUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

/**
 * 외부 서비스(예: Notion)에서 접근 가능한 공개 베이스 URL을 반환
 */
export function resolvePublicBaseUrl(requestUrl?: string): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (configuredBaseUrl) {
    const normalizedConfigured = normalizeBaseUrl(configuredBaseUrl);
    if (normalizedConfigured) {
      return normalizedConfigured;
    }
    console.warn('⚠️ NEXT_PUBLIC_BASE_URL 형식이 올바르지 않아 기본 URL을 사용합니다.', {
      configuredBaseUrl,
    });
  }

  // 개발 환경에서는 로컬 origin을 우선 사용 (프로덕션 안정성에는 영향 없음)
  if (process.env.NODE_ENV !== 'production' && requestUrl) {
    const normalizedRequestOrigin = normalizeBaseUrl(new URL(requestUrl).origin);
    if (normalizedRequestOrigin) {
      return normalizedRequestOrigin;
    }
  }

  return DEFAULT_PUBLIC_BASE_URL;
}

export { DEFAULT_PUBLIC_BASE_URL };
