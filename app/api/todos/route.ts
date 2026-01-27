/**
 * 투두리스트 API
 * BE 리드: Notion API 연동 및 투두리스트 CRUD
 * PM/UX: 할 일 데이터 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { TodoItem, TodoPage, ApiResponse } from '@/lib/types';

// Notion 클라이언트 초기화
function getNotionClient(token: string) {
  return new Client({ auth: token });
}

// 투두리스트 페이지 가져오기
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const dbId = searchParams.get('dbId');
    const date = searchParams.get('date');

    if (!token || !dbId || !date) {
      return NextResponse.json<ApiResponse<TodoPage>>({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: '필수 파라미터가 누락되었습니다.',
        },
      });
    }

    const notion = getNotionClient(token);

    const dateProp = searchParams.get('dateProp') || '날짜';
    const titleProp = searchParams.get('titleProp') || '제목';
    
    // 해당 날짜의 페이지 찾기 (Date property 기준)
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: dateProp,
        date: {
          equals: date,
        },
      },
      sorts: [
        {
          property: dateProp,
          direction: 'descending', // 최신순 정렬
        },
      ],
    });

    console.log(`📅 날짜 ${date}에 해당하는 페이지 개수:`, response.results.length);
    
    if (response.results.length === 0) {
      console.log(`⚠️ ${date} 날짜의 페이지가 없습니다. 빈 투두리스트 반환.`);
      return NextResponse.json<ApiResponse<TodoPage>>({
        success: true,
        data: {
          id: '',
          date,
          title: `${date} 할 일`,
          todos: [],
          pageUrl: '',
        },
      });
    }

    // 같은 날짜에 여러 페이지가 있으면 최신 페이지 사용
    const page = response.results[0] as any;
    const pageId = page.id;
    
    console.log(`✅ 사용할 페이지 ID: ${pageId}, 제목:`, page.properties[titleProp]?.title?.[0]?.plain_text || '제목 없음');

    // 페이지 내용 가져오기
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });

    // 투두리스트 아이템 파싱
    const todos: TodoItem[] = [];
    for (const block of blocks.results) {
      if ('type' in block && block.type === 'to_do') {
        const todoBlock = block as any;
        const fullText = todoBlock.to_do.rich_text
          .map((text: any) => text.plain_text)
          .join('');
        
        // ♥︎ 마크 확인하여 중요도 판단
        const isImportant = fullText.startsWith('♥︎');
        const cleanText = isImportant ? fullText.replace(/^♥︎\s*/, '') : fullText;
        
        todos.push({
          id: todoBlock.id,
          text: cleanText,
          completed: todoBlock.to_do.checked,
          priority: 'medium', // 기본값
          isImportant,
          createdAt: todoBlock.created_time,
          updatedAt: todoBlock.last_edited_time,
        });
      }
    }
    
    const todoPage: TodoPage = {
      id: pageId,
      date,
      title: page.properties[titleProp]?.title?.[0]?.plain_text || `${date} 할 일`,
      todos,
      pageUrl: page.url,
    };

    return NextResponse.json<ApiResponse<TodoPage>>({
      success: true,
      data: todoPage,
    });
  } catch (error) {
    console.error('투두리스트 가져오기 오류:', error);
    return NextResponse.json<ApiResponse<TodoPage>>({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: '투두리스트를 가져오는 중 오류가 발생했습니다.',
      },
    });
  }
}

// 투두리스트 아이템 추가/수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, dbId, date, action, todoId, text, completed } = body;

    if (!token || !dbId || !date) {
      return NextResponse.json<ApiResponse<any>>({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: '필수 파라미터가 누락되었습니다.',
        },
      });
    }

    const notion = getNotionClient(token);

    if (action === 'add') {
      const { dateProp, titleProp } = body;
      
      console.log(`📝 [할 일 추가 API] 호출됨 - 날짜: ${date}, 할 일: "${text}"`);
      console.log(`📝 [할 일 추가 API] dateProp: ${dateProp}, titleProp: ${titleProp}`);
      
      // 해당 날짜의 페이지 찾기 (Date property 기준)
      const response = await notion.databases.query({
        database_id: dbId,
        filter: {
          property: dateProp || '날짜',
          date: {
            equals: date,
          },
        },
        sorts: [
          {
            property: dateProp || '날짜',
            direction: 'descending', // 최신순 정렬
          },
        ],
      });

      console.log(`📅 [할 일 추가] 날짜 ${date}에 해당하는 페이지 개수:`, response.results.length);

      let pageId: string;
      if (response.results.length === 0) {
        // 해당 날짜의 페이지가 없으면 새 페이지 생성
        console.log(`⚠️ ${date} 날짜의 페이지가 없어 새로 생성합니다.`);
        const properties: any = {
          [dateProp || '날짜']: { date: { start: date } },
          [titleProp || '제목']: {
            title: [
              {
                text: {
                  content: `${date} 할 일`,
                },
              },
            ],
          },
        };
        
        const newPage = await notion.pages.create({
          parent: { database_id: dbId },
          properties,
        });
        pageId = newPage.id;
        console.log(`✅ 새 페이지 생성됨: ${pageId}`);
      } else {
        // 같은 날짜에 여러 페이지가 있으면 최신 페이지 사용
        const page = response.results[0] as any;
        pageId = page.id;
        const pageTitle = page.properties[titleProp || '제목']?.title?.[0]?.plain_text || '제목 없음';
        console.log(`✅ 기존 페이지 사용: ${pageId}, 제목: ${pageTitle}`);
      }

      // 투두 블록 추가
      console.log(`➕ Notion 페이지 ${pageId}에 할 일 블록 추가 중: "${text}"`);
      await notion.blocks.children.append({
        block_id: pageId,
        children: [
          {
            type: 'to_do',
            to_do: {
              rich_text: [
                {
                  text: {
                    content: text,
                  },
                },
              ],
              checked: false,
            },
          },
        ],
      });
      
      console.log(`✅ [할 일 추가 성공] "${text}" → Notion 페이지 ${pageId}`);

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { message: '할 일이 추가되었습니다.' },
      });
    }

    if (action === 'toggle' && todoId) {
      // 투두 완료 상태 토글
      // 현재 블록 정보 가져오기 (텍스트 보존을 위해)
      const currentBlock = await notion.blocks.retrieve({
        block_id: todoId,
      }) as any;
      
      await notion.blocks.update({
        block_id: todoId,
        to_do: {
          rich_text: currentBlock.to_do.rich_text, // 기존 텍스트 유지
          checked: completed,
        },
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { message: '할 일 상태가 업데이트되었습니다.' },
      });
    }

    if (action === 'delete' && todoId) {
      // 투두 삭제
      await notion.blocks.delete({
        block_id: todoId,
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { message: '할 일이 삭제되었습니다.' },
      });
    }

    if (action === 'toggle-important' && todoId) {
      // 투두 중요 상태 토글 (텍스트에 ♥︎ 마크 추가/제거)
      const { isImportant } = body;
      
      // 현재 블록 정보 가져오기
      const currentBlock = await notion.blocks.retrieve({
        block_id: todoId,
      }) as any;
      
      const currentText = currentBlock.to_do.rich_text
        .map((text: any) => text.plain_text)
        .join('');
      
      let newText = currentText;
      if (isImportant) {
        // 중요 표시 추가 (텍스트 앞에 ♥︎ 추가, 이미 있으면 제거 후 추가)
        newText = newText.replace(/^♥︎\s*/, '');
        newText = `♥︎ ${newText}`;
      } else {
        // 중요 표시 제거
        newText = newText.replace(/^♥︎\s*/, '');
      }
      
      // 블록 업데이트
      await notion.blocks.update({
        block_id: todoId,
        to_do: {
          rich_text: [
            {
              text: {
                content: newText,
              },
            },
          ],
          checked: currentBlock.to_do.checked,
        },
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { message: '할 일 중요 상태가 업데이트되었습니다.' },
      });
    }

    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: {
        code: 'INVALID_ACTION',
        message: '잘못된 액션입니다.',
      },
    });
  } catch (error) {
    console.error('투두리스트 업데이트 오류:', error);
    console.error('Error details:', error);
    return NextResponse.json<ApiResponse<any>>({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: `투두리스트를 업데이트하는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      },
    });
  }
}
