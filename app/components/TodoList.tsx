/**
 * 투두리스트 컴포넌트 - Y2K 스타일
 * FE 리드: 할 일 관리 UI 구현
 * PM/UX: 사용자 인터랙션 및 반응형 디자인
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TodoItem, ThemeConfig } from '@/lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { ListTodo, Plus, Heart, RefreshCw } from 'lucide-react';

interface TodoListProps {
  configId: string;
  config?: any;
  theme?: ThemeConfig;
  selectedDate?: string; // YYYY-MM-DD
}

// 기본 Y2K 핑크 테마 색상
const defaultTheme: ThemeConfig = {
  primaryColor: '#E8A8C0',
  accentColor: '#E8A8C0',
  backgroundColor: '#FFFFFF',
  backgroundOpacity: 100,
  fontColor: '#666666',
  fontFamily: 'Galmuri11', // 기본 폰트
};

export function TodoList({
  configId,
  config,
  theme,
  selectedDate,
}: TodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoText, setNewTodoText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // 테마 색상 (전달된 theme이 없으면 기본값 사용)
  const currentTheme = {
    ...defaultTheme,
    ...theme,
  };
  
  // 로컬 시간대 기준 날짜 가져오기 (사용자의 시간대 자동 적용)
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [currentDate, setCurrentDate] = useState<string>(getLocalDate());
  
  // 반복 할 일 추가 여부를 localStorage에서 관리
  const getRecurringStorageKey = () => {
    if (!config || configId === 'preview') return null;
    return `recurring-added:${config.databaseId}`;
  };
  
  const getLastRecurringDate = () => {
    if (typeof window === 'undefined') return '';
    const key = getRecurringStorageKey();
    if (!key) return '';
    return localStorage.getItem(key) || '';
  };
  
  const setLastRecurringDate = (date: string) => {
    if (typeof window === 'undefined') return;
    const key = getRecurringStorageKey();
    if (!key) return;
    localStorage.setItem(key, date);
  };

  // 날짜 변경 감지 (자정에 자동으로 새로운 날짜의 할 일로 전환)
  useEffect(() => {
    console.log('🕐 날짜 체크 타이머 시작. 현재 날짜:', currentDate);
    
    const checkDateChange = () => {
      const newDate = getLocalDate();
      const now = new Date().toLocaleString('ko-KR');
      console.log(`🕐 [${now}] 날짜 체크: currentDate=${currentDate}, newDate=${newDate}`);
      
      if (newDate !== currentDate) {
        console.log('🌅🌅🌅 날짜 변경 감지! 이전:', currentDate, '→ 현재:', newDate);
        console.log('🔄 fetchTodos가 자동으로 재실행됩니다 (useEffect 의존성)');
        setCurrentDate(newDate);
      }
    };

    // 1분마다 날짜 체크
    const dateCheckInterval = setInterval(checkDateChange, 60000);
    
    return () => {
      console.log('🕐 날짜 체크 타이머 종료');
      clearInterval(dateCheckInterval);
    };
  }, [currentDate]);

  // 투두리스트 데이터 가져오기
  useEffect(() => {
    console.log('📅 fetchTodos 실행 - currentDate:', currentDate, 'selectedDate:', selectedDate);
    console.log('📅 config 존재 여부:', !!config, 'configId:', configId);
    if (config) {
      console.log('📅 config.recurringTodos:', config.recurringTodos);
    }
    
    const fetchTodos = async () => {
      // 미리보기 모드
      if (configId === 'preview') {
        const sampleTodos: TodoItem[] = [
          {
            id: '1',
            text: '밥 먹기',
            completed: false,
            priority: 'high',
            category: '일상',
            isImportant: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            text: '약속가기',
            completed: false,
            priority: 'medium',
            category: '약속',
            isImportant: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '3',
            text: '공부',
            completed: true,
            priority: 'high',
            category: '학습',
            isImportant: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setTodos(sampleTodos);
        setLoading(false);
        return;
      }

      // 실제 Notion 연동
      if (!config) {
        setLoading(false);
        return;
      }

      // selectedDate가 없으면 currentDate 사용 (자정에 자동 업데이트)
      const targetDate = selectedDate || currentDate;

      try {
        setLoading(true);

        const params = new URLSearchParams({
          token: config.token,
          dbId: config.databaseId,
          date: targetDate,
          dateProp: config.dateProperty,
          titleProp: config.titleProperty,
        });

        const response = await fetch(`/api/todos?${params}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(typeof data.error === 'string' ? data.error : '할 일을 가져오는데 실패했습니다.');
        }

        let currentTodos = data.data?.todos || [];

        // 반복 할 일 자동 추가 (날짜가 바뀌었을 때 한 번만)
        const lastRecurringDate = getLastRecurringDate();
        if (config.recurringTodos && config.recurringTodos.length > 0 && lastRecurringDate !== targetDate) {
          console.log('🔄 반복 할 일 자동 추가 시작 (날짜:', targetDate, ', 마지막 추가 날짜:', lastRecurringDate, ')');
          const validRecurringTodos = config.recurringTodos.filter((t: string) => t && t.trim());
          const existingTexts = currentTodos.map((t: TodoItem) => t.text);
          let hasAddedAny = false;
          
          for (const recurringText of validRecurringTodos) {
            const trimmedText = recurringText.trim();
            
            if (!existingTexts.includes(trimmedText)) {
              try {
                await fetch('/api/todos', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    token: config.token,
                    dbId: config.databaseId,
                    date: targetDate,
                    action: 'add',
                    text: trimmedText,
                    dateProp: config.dateProperty,
                    titleProp: config.titleProperty,
                  }),
                });
                
                existingTexts.push(trimmedText);
                hasAddedAny = true;
                console.log('✅ 반복 할 일 추가됨:', trimmedText);
              } catch (err) {
                console.error('반복 할 일 추가 오류:', err);
              }
            }
          }
          
          if (hasAddedAny) {
            const finalResponse = await fetch(`/api/todos?${params}`);
            const finalData = await finalResponse.json();
            if (finalData.success) {
              currentTodos = finalData.data?.todos || [];
            }
          }
          
          // localStorage에 오늘 날짜 저장
          setLastRecurringDate(targetDate);
          console.log('💾 localStorage에 저장됨:', targetDate);
        }

        setTodos(currentTodos);
      } catch (err: any) {
        console.error('투두리스트 로딩 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
    
    // 자동 새로고침 (10분마다) - 너무 자주 새로고침되면 입력 중 데이터 손실 가능
    const interval = setInterval(() => {
      if (configId !== 'preview' && config) {
        fetchTodos();
      }
    }, 600000); // 10분 (600초)
    
    return () => clearInterval(interval);
  }, [configId, config, selectedDate, currentDate]);

  // 새로고침 함수
  const handleRefresh = async () => {
    if (configId === 'preview') return; // 미리보기 모드에서는 새로고침 불필요
    if (!config) return; // config가 없으면 새로고침 불가
    
    setRefreshing(true);

    try {
      const targetDate = selectedDate || currentDate;
      
      const params = new URLSearchParams({
        token: config.token,
        dbId: config.databaseId,
        date: targetDate,
        dateProp: config.dateProperty,
        titleProp: config.titleProperty,
      });

      const response = await fetch(`/api/todos?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(typeof data.error === 'string' ? data.error : '할 일을 가져오는데 실패했습니다.');
      }

      // 새로고침은 단순히 데이터만 다시 불러옴 (반복 할 일 추가 안 함)
      setTodos(data.data?.todos || []);
    } catch (err: any) {
      console.error('새로고침 오류:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return;

    // 할 일 개수 제한 확인 (10개)
    console.log('Current todos length:', todos.length);
    if (todos.length >= 10) {
      console.warn('할 일은 최대 10개까지 추가할 수 있습니다.');
      return;
    }

    const todoText = newTodoText.trim();
    setNewTodoText(''); // 즉시 입력 필드 비우기

    // 미리보기 모드
    if (configId === 'preview') {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: todoText,
        completed: false,
        priority: 'medium',
        isImportant: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTodos(prev => [...prev, newTodo]);
      return;
    }

    // 실제 Notion 연동
    if (!config) return;

    // 임시 ID로 즉시 로컬 상태 업데이트
    const tempId = `temp-${Date.now()}`;
    const newTodo: TodoItem = {
      id: tempId,
      text: todoText,
      completed: false,
      priority: 'medium',
      isImportant: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setTodos(prev => [...prev, newTodo]);

    const targetDate = selectedDate || currentDate;

    // 백그라운드에서 API 호출
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.token,
          dbId: config.databaseId,
          date: targetDate,
          action: 'add',
          text: todoText,
          dateProp: config.dateProperty,
          titleProp: config.titleProperty,
        }),
      });

      const data = await response.json();
      console.log('Add Todo API Response:', data);

      if (!data.success) {
        // 실패 시 임시 항목 제거
        setTodos(prev => prev.filter(t => t.id !== tempId));
        console.error('Add Todo failed:', data);
        throw new Error(typeof data.error === 'string' ? data.error : '할 일 추가에 실패했습니다.');
      }

      // 성공 시 임시 항목을 실제 항목으로 교체
      if (data.data?.todo) {
        setTodos(prev => 
          prev.map(t => 
            t.id === tempId ? data.data.todo : t
          )
        );
      }
    } catch (err: any) {
      console.error('할 일 추가 오류:', err);
    }
  };

  const handleToggleTodo = async (id: string) => {
    // 미리보기 모드
    if (configId === 'preview') {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id
            ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
            : todo
        )
      );
      return;
    }

    // 실제 Notion 연동
    if (!config) return;

    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
          : t
      )
    );

    // 임시 ID인 경우 (temp-로 시작) API 호출하지 않음
    if (id.startsWith('temp-')) {
      return;
    }

    const targetDate = selectedDate || new Date().toISOString().split('T')[0];

    // 백그라운드에서 API 호출
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.token,
          dbId: config.databaseId,
          date: targetDate,
          action: 'toggle',
          todoId: id,
          completed: !todo.completed,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('서버 응답을 파싱할 수 없습니다.');
      }

      if (!data.success) {
        // 실패 시 원래 상태로 되돌리기
        setTodos(prev =>
          prev.map(t =>
            t.id === id
              ? { ...t, completed: todo.completed, updatedAt: new Date().toISOString() }
              : t
          )
        );
        console.error('Toggle failed:', data);
        throw new Error(typeof data.error === 'string' ? data.error : '할 일 업데이트에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('할 일 토글 오류:', err);
    }
  };

  const handleToggleImportant = async (id: string) => {
    // 미리보기 모드
    if (configId === 'preview') {
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id
            ? { ...todo, isImportant: !todo.isImportant, updatedAt: new Date().toISOString() }
            : todo
        )
      );
      return;
    }

    // 실제 Notion 연동
    if (!config) return;

    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setTodos(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, isImportant: !t.isImportant, updatedAt: new Date().toISOString() }
          : t
      )
    );

    // 임시 ID인 경우 (temp-로 시작) API 호출하지 않음
    if (id.startsWith('temp-')) {
      return;
    }

    const targetDate = selectedDate || new Date().toISOString().split('T')[0];

    // 백그라운드에서 API 호출
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.token,
          dbId: config.databaseId,
          date: targetDate,
          action: 'toggle-important',
          todoId: id,
          isImportant: !todo.isImportant,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('서버 응답을 파싱할 수 없습니다.');
      }

      if (!data.success) {
        // 실패 시 원래 상태로 되돌리기
        setTodos(prev =>
          prev.map(t =>
            t.id === id
              ? { ...t, isImportant: todo.isImportant, updatedAt: new Date().toISOString() }
              : t
          )
        );
        console.error('Toggle important failed:', data);
        throw new Error(typeof data.error === 'string' ? data.error : '중요도 업데이트에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('중요도 토글 오류:', err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    // 미리보기 모드
    if (configId === 'preview') {
      setTodos(prev => prev.filter(todo => todo.id !== id));
      return;
    }

    // 실제 Notion 연동
    if (!config) return;

    // 삭제할 항목 백업
    const todoToDelete = todos.find(t => t.id === id);
    if (!todoToDelete) return;

    // 임시 ID인 경우 (temp-로 시작) 로컬에서만 삭제
    if (id.startsWith('temp-')) {
      setTodos(prev => prev.filter(todo => todo.id !== id));
      return;
    }

    // 즉시 로컬 상태에서 제거
    setTodos(prev => prev.filter(todo => todo.id !== id));

    const targetDate = selectedDate || new Date().toISOString().split('T')[0];

    // 백그라운드에서 API 호출
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.token,
          dbId: config.databaseId,
          date: targetDate,
          action: 'delete',
          todoId: id,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('서버 응답을 파싱할 수 없습니다.');
      }

      if (!data.success) {
        // 실패 시 항목 복원
        setTodos(prev => [...prev, todoToDelete]);
        console.error('Delete failed:', data);
        throw new Error(typeof data.error === 'string' ? data.error : '할 일 삭제에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('할 일 삭제 오류:', err);
    }
  };

  // 중요한 할 일을 최상단으로, 완료된 항목을 하단으로 정렬
  const sortedTodos = [...todos].sort((a, b) => {
    // 완료된 항목을 하단으로
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // 완료되지 않은 항목 중에서 중요한 항목을 상단으로
    if (!a.completed && !b.completed) {
      if (a.isImportant && !b.isImportant) return -1;
      if (!a.isImportant && b.isImportant) return 1;
    }
    
    return 0;
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    }
  };

  if (loading) {
    return <LoadingSpinner message="할 일을 불러오는 중..." />;
  }

  // 배경색 투명도 적용
  const bgColor = currentTheme.backgroundColor || '#FFFFFF';
  const bgOpacity = currentTheme.backgroundOpacity ?? 100;
  const bgColorWithOpacity = bgOpacity < 100 
    ? `${bgColor}${Math.round((bgOpacity / 100) * 255).toString(16).padStart(2, '0')}`
    : bgColor;

  // 연한 배경색 (hover, important 상태용)
  const primaryColor = currentTheme.primaryColor || '#E8A8C0';
  const accentColor = currentTheme.accentColor || '#E8A8C0';
  const fontColor = currentTheme.fontColor || '#666666';
  
  // 폰트 매핑
  const getFontFamily = (font?: string) => {
    switch(font) {
      case 'Galmuri11': return "'Galmuri11', monospace";
      case 'Pretendard': return "'Pretendard', sans-serif";
      case 'Corbel': return "'Corbel', sans-serif";
      default: return "'Galmuri11', monospace";
    }
  };
  
  // 모든 폰트 동일한 크기로 표시
  const getFontSizeAdjustment = (font?: string) => {
    return 0; // 모든 폰트 동일
  };
  
  const fontFamily = getFontFamily(currentTheme.fontFamily);
  const fontSizeAdjust = getFontSizeAdjustment(currentTheme.fontFamily);

  return (
    <div 
      className="y2k-widget"
      style={{
        '--y2k-primary': primaryColor,
        '--y2k-accent': accentColor,
        '--y2k-bg': bgColorWithOpacity,
        '--y2k-font': fontColor,
        backgroundColor: bgColorWithOpacity,
        borderColor: primaryColor,
        outlineColor: `${primaryColor}30`,
        fontFamily: fontFamily,
        letterSpacing: '-0.5px',
      } as React.CSSProperties}
    >
      {/* 윈도우 헤더 */}
      <div 
        className="y2k-header"
        style={{
          backgroundColor: `${primaryColor}20`,
          borderBottomColor: primaryColor,
          color: primaryColor,
          letterSpacing: '-0.5px',
        }}
      >
        <span className="y2k-header-title" style={{ letterSpacing: '-0.5px' }}>
          <ListTodo size={12} />
          to do list
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="y2k-btn"
            title="새로고침"
            style={{ 
              borderColor: primaryColor,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              background: 'white',
            }}
          >
            <RefreshCw 
              size={8} 
              color={accentColor}
              className={refreshing ? 'animate-spin' : ''} 
            />
          </button>
          <div className="y2k-btn" style={{ borderColor: primaryColor }}>x</div>
        </div>
      </div>

      {/* 입력 영역 */}
      <div 
        className="y2k-input-area"
        style={{ borderBottomColor: `${primaryColor}50` }}
      >
        <input
          type="text"
          className="y2k-input"
          placeholder="할 일 추가..."
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ 
            color: fontColor,
            fontFamily: fontFamily,
            letterSpacing: '-0.5px',
            fontSize: `${12 + fontSizeAdjust}px`, // 모든 폰트 12px
          }}
        />
        <button 
          className="y2k-add-btn" 
          onClick={handleAddTodo}
          style={{
            borderColor: primaryColor,
            backgroundColor: `${primaryColor}20`,
            color: primaryColor,
          }}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* 투두 리스트 */}
      <div className="y2k-todo-list">
        {sortedTodos.length === 0 ? (
          <div className="y2k-empty-state" style={{ 
            color: `${fontColor}80`, 
            letterSpacing: '-0.5px',
            fontSize: `${11 + fontSizeAdjust}px`, // 모든 폰트 11px
          }}>
            오늘 할 일을 추가해보세요 ♡
          </div>
        ) : (
          sortedTodos.map((todo) => (
            <div
              key={todo.id}
              className={`y2k-todo-item ${todo.isImportant && !todo.completed ? 'important' : ''}`}
              style={{
                borderColor: todo.isImportant && !todo.completed ? accentColor : '#e8e8e8',
                backgroundColor: todo.isImportant && !todo.completed ? `${accentColor}15` : 'white',
              }}
            >
              {/* 체크박스 */}
              <div
                className={`y2k-checkbox ${todo.completed ? 'checked' : ''}`}
                onClick={() => handleToggleTodo(todo.id)}
                style={{
                  borderColor: primaryColor,
                  backgroundColor: todo.completed ? primaryColor : 'white',
                }}
              >
                {todo.completed && '✓'}
              </div>

              {/* 텍스트 */}
              <span
                className={`y2k-todo-text ${
                  todo.isImportant && !todo.completed ? 'important' : ''
                } ${todo.completed ? 'completed' : ''}`}
                style={{
                  color: todo.completed 
                    ? '#aaa' 
                    : todo.isImportant 
                      ? accentColor 
                      : fontColor,
                  fontFamily: fontFamily,
                  letterSpacing: '-0.5px',
                  fontSize: `${12 + fontSizeAdjust}px`, // 모든 폰트 12px
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {todo.text}
              </span>

              {/* 하트 버튼 (항상 표시) */}
              <button
                className={`y2k-heart-btn ${todo.isImportant ? 'active' : ''}`}
                onClick={() => handleToggleImportant(todo.id)}
                title={todo.isImportant ? '중요 표시 해제' : '중요 표시'}
                style={{ color: todo.isImportant ? accentColor : '#ddd' }}
              >
                <Heart
                  size={12}
                  fill={todo.isImportant ? accentColor : 'none'}
                />
              </button>

              {/* 삭제 버튼 (항상 표시) */}
              <button
                className="y2k-delete-btn"
                onClick={() => handleDeleteTodo(todo.id)}
                title="삭제"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* 로고 */}
      <div style={{
        textAlign: 'center',
        fontSize: '6px',
        color: '#ccc',
        padding: '2px 0 4px 0', // 상단 2px, 하단 4px
        letterSpacing: '1px',
        fontFamily: "'Pretendard', sans-serif",
      }}>
        SOMLUTION
      </div>

      {/* 우측 하단 새로고침 버튼 */}
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="y2k-refresh-bottom"
        title="새로고침"
      >
        <RefreshCw 
          size={10} 
          className={refreshing ? 'animate-spin' : ''} 
        />
      </button>

    </div>
  );
}
