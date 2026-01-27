/**
 * Notion 서비스 통합
 * BE/API: Notion API 연동 및 데이터 처리
 * 독서 기록 저장을 위한 Notion 연동
 */

import { Client } from '@notionhq/client';
import { NotionConfig, BookItem, Result } from './types';

export class NotionService {
  private client: Client;
  private config: NotionConfig;

  constructor(config: NotionConfig) {
    this.client = new Client({
      auth: config.apiKey,
    });
    this.config = config;
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

  // 독서 기록용 데이터베이스 스키마 자동 분석
  static async analyzeBookDatabase(apiKey: string, databaseId: string): Promise<{
    success: true;
    data: {
      titleProperty: string;
      authorProperty: string;
      coverProperty: string;
      coverPropertyType: 'files' | 'url' | '';
      statusProperty: string;
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

      // 제목 속성 찾기 (Title 타입)
      let titleProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'title') {
          titleProperty = name;
          break;
        }
      }

      // 저자 속성 찾기 (Rich Text 타입, '저자' 또는 'author' 포함)
      let authorProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'rich_text' && 
            (name.toLowerCase() === 'author' || name.toLowerCase().includes('저자'))) {
          authorProperty = name;
          break;
        }
      }

      // 표지 속성 찾기 (Files 또는 URL 타입, 'cover' 또는 '표지' 포함)
      let coverProperty = '';
      let coverPropertyType: 'files' | 'url' | '' = '';
      for (const [name, prop] of Object.entries(properties)) {
        if ((prop.type === 'files' || prop.type === 'url') && 
            (name.toLowerCase() === 'cover' || name.toLowerCase().includes('표지'))) {
          coverProperty = name;
          coverPropertyType = prop.type as 'files' | 'url';
          break;
        }
      }

      // 상태 속성 찾기 (Select 타입)
      let statusProperty = '';
      for (const [name, prop] of Object.entries(properties)) {
        if (prop.type === 'select' && 
            (name.toLowerCase().includes('상태') || name.toLowerCase().includes('status'))) {
          statusProperty = name;
          break;
        }
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
          titleProperty,
          authorProperty,
          coverProperty,
          coverPropertyType,
          statusProperty,
        },
      };
    } catch (error) {
      console.error('Failed to analyze book database:', error);
      return {
        success: false,
        error: new Error(`Failed to analyze database: ${error}`),
      };
    }
  }

  // 도서를 Notion 데이터베이스에 추가
  async addBook(book: BookItem): Promise<Result<{ pageId: string }>> {
    try {
      const properties: any = {};

      // 제목 설정
      if (this.config.titleProperty) {
        properties[this.config.titleProperty] = {
          title: [{ text: { content: book.title } }],
        };
      }

      // 저자 설정
      if (this.config.authorProperty) {
        properties[this.config.authorProperty] = {
          rich_text: [{ text: { content: book.author } }],
        };
      }

      // 표지 URL 설정
      if (this.config.coverProperty && book.cover) {
        properties[this.config.coverProperty] = {
          url: book.cover,
        };
      }

      // 상태 설정 (기본값: 읽고 싶은 책)
      if (this.config.statusProperty) {
        properties[this.config.statusProperty] = {
          select: { name: '읽고 싶은 책' },
        };
      }

      const page = await this.client.pages.create({
        parent: { database_id: this.config.databaseId },
        properties,
      });

      return {
        success: true,
        data: { pageId: page.id },
      };
    } catch (error) {
      console.error('Failed to add book:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}
