/**
 * Notion 서비스 통합
 * BE/API: Notion API 연동 및 데이터 처리
 * 성능: 캐싱 및 최적화
 */

import { Client } from '@notionhq/client';
import { NotionConfig, Result } from './types';
import { validateDateFormat } from './validation';

export class NotionService {
  private client: Client;
  private config: NotionConfig;

  constructor(config: NotionConfig) {
    this.client = new Client({
      auth: config.apiKey,
    });
    this.config = config;
  }

  // 투두리스트용 데이터베이스 스키마 자동 분석
  static async autoDetectTodoProperties(apiKey: string, databaseId: string): Promise<{
    success: true;
    data: {
      dateProperty: string;
      titleProperty: string;
    };
  } | {
    success: false;
    error: Error;
  }> {
    try {
      const client = new Client({ auth: apiKey });

      // 데이터베이스 정보 가져오기
      const database = await client.databases.retrieve({ database_id: databaseId });

      const properties = database.properties;
      const propertyNames = Object.keys(properties);

      // 날짜 속성 찾기 (Date 타입)
      let dateProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'date') {
          dateProperty = name;
          break;
        }
      }

      // 제목 속성 찾기 (Title 타입)
      let titleProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'title') {
          titleProperty = name;
          break;
        }
      }

      // 필수 속성이 없으면 에러
      if (!dateProperty) {
        return {
          success: false,
          error: new Error('날짜 속성을 찾을 수 없습니다. 데이터베이스에 Date 타입의 속성을 추가해주세요.'),
        };
      }

      if (!titleProperty) {
        return {
          success: false,
          error: new Error('제목 속성을 찾을 수 없습니다. 데이터베이스에 Title 타입의 속성을 추가해주세요.'),
        };
      }

      return {
        success: true,
        data: {
          dateProperty,
          titleProperty,
        },
      };
    } catch (error) {
      console.error('Failed to analyze todo database:', error);
      return {
        success: false,
        error: new Error(`Failed to analyze database: ${error}`),
      };
    }
  }

  // 데이터베이스 목록 가져오기
  static async getDatabases(apiKey: string): Promise<{
    success: true;
    data: Array<{ id: string; title: string }>;
  } | {
    success: false;
    error: Error;
  }> {
    try {
      const client = new Client({ auth: apiKey });

      const response = await client.search({
        filter: {
          property: 'object',
          value: 'database',
        },
      });

      const databases = response.results.map((result: any) => ({
        id: result.id,
        title: result.title?.[0]?.plain_text || '제목 없음',
      }));

      return { success: true, data: databases };
    } catch (error) {
      console.error('Failed to fetch databases:', error);
      return {
        success: false,
        error: new Error(`Failed to fetch databases: ${error}`),
      };
    }
  }

  // 데이터베이스 스키마 분석
  static async analyzeDatabase(apiKey: string, databaseId: string): Promise<{
    success: true;
    data: {
      dateProperty: string;
      titleProperty: string;
      scheduleProperties: string[];
      importantProperty: string;
    };
  } | {
    success: false;
    error: Error;
  }> {
    try {
      const client = new Client({ auth: apiKey });

      // 데이터베이스 정보 가져오기
      const database = await client.databases.retrieve({ database_id: databaseId });

      const properties = database.properties;
      const propertyNames = Object.keys(properties);

      // 날짜 속성 찾기 (Date 타입)
      let dateProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'date') {
          dateProperty = name;
          break;
        }
      }

      // 제목 속성 찾기 (Title 타입)
      let titleProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'title') {
          titleProperty = name;
          break;
        }
      }

      // 일정 속성들 찾기 (Rich Text 타입)
      const scheduleProperties: string[] = [];
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'rich_text' && name.toLowerCase().includes('일정')) {
          scheduleProperties.push(name);
        }
      }

      // 중요 속성 찾기 (Select 타입)
      let importantProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'select' && name.toLowerCase().includes('중요')) {
          importantProperty = name;
          break;
        }
      }

      // 필수 속성이 없으면 에러
      if (!dateProperty) {
        return {
          success: false,
          error: new Error('날짜 속성을 찾을 수 없습니다. 데이터베이스에 Date 타입의 속성을 추가해주세요.'),
        };
      }

      if (!titleProperty) {
        return {
          success: false,
          error: new Error('제목 속성을 찾을 수 없습니다. 데이터베이스에 Title 타입의 속성을 추가해주세요.'),
        };
      }

      return {
        success: true,
        data: {
          dateProperty,
          titleProperty,
          scheduleProperties,
          importantProperty,
        },
      };
    } catch (error) {
      console.error('Failed to analyze database:', error);
      return {
        success: false,
        error: new Error(`Failed to analyze database: ${error}`),
      };
    }
  }
}