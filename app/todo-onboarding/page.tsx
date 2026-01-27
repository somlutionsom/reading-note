/**
 * 투두리스트 온보딩 페이지 - Soft Retro Y2K Design
 * PM/UX: 투두리스트 설정 및 위젯 생성 플로우
 */

'use client';

import React, { useState } from 'react';
import { 
  Monitor, 
  Settings2,
  Palette,
  Type,
  ListTodo,
  Copy,
  Heart,
  Plus,
  RefreshCw,
} from 'lucide-react';

// --- [내부 컴포넌트] 생성될 위젯 미리보기용 (실제 위젯 코드 디자인 적용) ---
const PreviewWidget = ({ theme, recurringTodos, fontFamily }: { theme: any, recurringTodos: string[], fontFamily: string }) => {
  const [localTodos] = useState([
    { id: 1, text: '비타민 챙겨먹기', completed: false, important: true },
    { id: 2, text: '리액트 공부하기', completed: true, important: false },
    ...recurringTodos.filter(t => t.trim()).map((text, idx) => ({ id: 100 + idx, text, completed: false, important: false }))
  ]);

  // HEX to RGB 변환하여 투명도 적용
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  };

  const bgStyle = theme.backgroundOpacity < 100 
    ? hexToRgba(theme.backgroundColor, theme.backgroundOpacity) 
    : theme.backgroundColor;

  // 폰트 매핑
  const getFontFamily = (font: string) => {
    switch(font) {
      case 'Galmuri11': return "'Galmuri11', monospace";
      case 'Pretendard': return "'Pretendard', sans-serif";
      case 'Corbel': return "'Corbel', sans-serif";
      default: return "'Galmuri11', monospace";
    }
  };

  // 모든 폰트 동일한 크기로 표시
  const fontSizeAdjust = 0;

  return (
    <div style={{
      fontFamily: getFontFamily(fontFamily),
      background: bgStyle,
      border: `1px solid ${theme.primaryColor}`,
      outline: `2px solid ${theme.primaryColor}33`, // primaryColor with ~20% opacity
      boxShadow: `2px 2px 0px ${hexToRgba(theme.primaryColor, 30)}, 4px 4px 12px ${hexToRgba(theme.primaryColor, 15)}`,
      borderRadius: '6px',
      overflow: 'hidden',
      width: '214px', // Increased width by 10px (204px -> 214px)
      margin: '0 auto',
      userSelect: 'none',
      transition: 'transform 0.2s ease',
      position: 'relative', // 우측 하단 새로고침 버튼 위치 지정을 위해
    }}>
      {/* 윈도우 헤더 */}
      <div style={{
        height: '24px',
        background: `${theme.primaryColor}33`, // Lighter version of primary
        borderBottom: `1px solid ${theme.primaryColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 6px',
        fontSize: '11px',
        color: theme.primaryColor,
        fontFamily: getFontFamily(fontFamily), // Apply selected font to header
      }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <ListTodo size={12} color={theme.primaryColor} />
          <span>to do list</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <div style={{ 
            width: '12px', height: '12px', border: `1px solid ${theme.primaryColor}`, 
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', cursor: 'pointer'
          }}>_</div>
          <div style={{ 
            width: '12px', height: '12px', border: `1px solid ${theme.primaryColor}`, 
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', cursor: 'pointer' 
          }}>x</div>
        </div>
      </div>

      {/* 입력창 영역 */}
      <div style={{ padding: '8px', borderBottom: `1px dotted ${theme.primaryColor}40`, display: 'flex', gap: '4px', alignItems: 'center' }}>
        <input 
          readOnly
          placeholder="할 일 추가..."
          style={{
            flex: 1,
            minWidth: 0, // Prevent flex overflow
            border: '1px solid #e8e8e8',
            padding: '4px 6px',
            fontSize: `${12 + fontSizeAdjust}px`, // 모든 폰트 12px
            fontFamily: getFontFamily(fontFamily),
            borderRadius: '3px',
            outline: 'none',
            color: theme.fontColor,
            background: 'white',
            boxSizing: 'border-box',
            height: '22px', // Adjusted height
            lineHeight: '14px',
          }}
        />
        <button style={{
          width: '20px', 
          height: '20px',
          minWidth: '20px', // Prevent shrinking
          minHeight: '20px',
          flexShrink: 0, // Prevent button from shrinking
          marginLeft: '5px', // 우측으로 5px 이동
          border: `1px solid ${theme.primaryColor}`,
          background: 'white',
          color: theme.primaryColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '4px', 
          cursor: 'default',
          boxSizing: 'border-box',
          padding: 0,
        }}>
          <Plus size={12} />
        </button>
      </div>

      {/* 리스트 영역 */}
      <div style={{ padding: '8px', minHeight: '150px' }}>
        {localTodos.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px', 
            border: `1px solid ${t.important && !t.completed ? theme.accentColor : '#e8e8e8'}`,
            marginBottom: '4px', borderRadius: '4px',
            background: t.important && !t.completed ? `${theme.accentColor}15` : 'white',
            transition: 'all 0.2s'
          }}>
            {/* 체크박스 */}
            <div style={{
              width: '12px', height: '12px',
              border: `1px solid ${theme.primaryColor}`,
              borderRadius: '2px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: t.completed ? theme.primaryColor : 'white',
              fontSize: '9px', color: 'white',
              cursor: 'pointer'
            }}>
              {t.completed && '✓'}
            </div>
            
            {/* 텍스트 */}
            <span style={{
              flex: 1, 
              fontSize: `${12 + fontSizeAdjust}px`, // 모든 폰트 12px
              fontFamily: getFontFamily(fontFamily), // Apply selected font
              color: t.completed 
                ? '#aaa' 
                : (t.important ? theme.accentColor : theme.fontColor),
              textDecoration: t.completed ? 'line-through' : 'none',
              fontWeight: t.important ? 'bold' : 'normal',
              letterSpacing: '-0.5px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{t.text}</span>
            
            {/* 하트 버튼 */}
            <div style={{ cursor: 'pointer' }}>
               <Heart size={12} fill={t.important ? theme.accentColor : 'none'} color={t.important ? theme.accentColor : '#ddd'} />
            </div>
             {/* 삭제 버튼 */}
            <div style={{ 
                width: '14px', height: '14px', border: '1px solid #ccc', borderRadius: '3px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999', cursor: 'pointer'
            }}>×</div>
          </div>
        ))}
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
        className="y2k-refresh-bottom"
        title="새로고침"
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          width: '14px',
          height: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: 0,
          color: '#d0d0d0', // 옅은 회색
          transition: 'all 0.2s',
          opacity: 0.6,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = '#999';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = '#d0d0d0';
        }}
      >
        <RefreshCw size={10} />
      </button>
    </div>
  );
};

// --- [메인 로직] ---

interface FormData {
  notionToken: string;
  databaseId: string;
  dateProperty: string;
  titleProperty: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  fontColor: string;
  recurringTodos: string[];
  fontFamily: string;
}

interface ThemePreset {
  name: string;
  colors: {
    background: string;
    primary: string;
    accent: string;
  };
}

const themePresets: ThemePreset[] = [
  { name: '파스텔', colors: { background: '#FFFCF9', primary: '#B5E3F0', accent: '#FFB8CC' } },
  { name: '핑크', colors: { background: '#FFF5F8', primary: '#F19CB6', accent: '#C9184A' } },
  { name: '다크', colors: { background: '#2D2D2D', primary: '#4A4A4A', accent: '#E8E8E8' } },
  { name: '화이트', colors: { background: '#FFFFFF', primary: '#2D2D2D', accent: '#FF758C' } },
  { name: '보라', colors: { background: '#F8F5FF', primary: '#B97FE7', accent: '#5A189A' } },
  { name: '그린', colors: { background: '#F5FBF7', primary: '#66C497', accent: '#2D6A4F' } },
  { name: '블루', colors: { background: '#F5FAFF', primary: '#5FA3EE', accent: '#1E3A8A' } },
  { name: '레몬', colors: { background: '#FFFEF5', primary: '#FCD34D', accent: '#F59E0B' } }
];

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#2D3748' : '#F7FAFC';
}

export default function TodoOnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    notionToken: '',
    databaseId: '',
    dateProperty: '',
    titleProperty: '',
    primaryColor: '#E8A8C0',
    accentColor: '#FFB8CC',
    backgroundColor: '#FFF0F5',
    backgroundOpacity: 100,
    fontColor: '#666666',
    recurringTodos: [],
    fontFamily: 'Galmuri11',
  });
  const [databases, setDatabases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string | null>('핑크');
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleThemeSelect = (theme: ThemePreset) => {
    setSelectedTheme(theme.name);
    const fontColor = getContrastColor(theme.colors.background);
    setFormData(prev => ({
      ...prev,
      backgroundColor: theme.colors.background,
      primaryColor: theme.colors.primary,
      accentColor: theme.colors.accent,
      fontColor: fontColor
    }));
  };

  // Step 1: Notion API 토큰으로 데이터베이스 목록 가져오기
  const handleFetchDatabases = async () => {
    if (!formData.notionToken.trim()) {
      setError('⚠ Notion API 토큰을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: formData.notionToken }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorMsg = data.error?.message || data.error?.details || data.error || '데이터베이스를 가져오는데 실패했습니다.';
        throw new Error(errorMsg);
      }

      setDatabases(data.data || []);
      setStep(2);
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 데이터베이스 선택 및 속성 분석
  const handleSelectDatabase = async (dbId: string) => {
    setFormData(prev => ({ ...prev, databaseId: dbId }));
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-todo-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: formData.notionToken,
          databaseId: dbId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorMsg = data.error?.message || data.error?.details || data.error || '데이터베이스 분석에 실패했습니다.';
        throw new Error(errorMsg);
      }

      if (data.data) {
        setFormData(prev => ({
          ...prev,
          dateProperty: data.data.dateProperty,
          titleProperty: data.data.titleProperty,
        }));
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: 위젯 생성
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/setup-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: formData.notionToken,
          databaseId: formData.databaseId,
          dateProperty: formData.dateProperty,
          titleProperty: formData.titleProperty,
          theme: {
            primaryColor: formData.primaryColor,
            accentColor: formData.accentColor,
            backgroundColor: formData.backgroundColor,
            backgroundOpacity: formData.backgroundOpacity,
            fontColor: formData.fontColor,
            fontFamily: formData.fontFamily,
          },
          recurringTodos: formData.recurringTodos.filter(t => t.trim()),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '위젯 생성에 실패했습니다.');
      }

      setEmbedUrl(data.data.embedUrl);
      setStep(5);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css');
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        
        * {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
        }

        body {
          margin: 0;
          padding: 0;
          display: block !important;
          min-height: 100vh;
          background-color: #FDF0F6;
          background-image: 
            linear-gradient(rgba(232, 168, 192, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232, 168, 192, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
          color: #4A4A4A;
        }

        .pixel-window {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #E8A8C0;
          border-radius: 16px;
          box-shadow: 0 20px 60px -10px rgba(232, 168, 192, 0.25);
          max-width: 900px;
          margin: 3rem auto;
          position: relative;
          backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .title-bar {
          background: white;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #FFE4E1;
          color: #E8A8C0;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .window-content {
          padding: 40px;
          min-height: 500px;
        }

        .step-progress-bar {
          display: flex;
          margin-bottom: 40px;
          justify-content: center;
          gap: 12px;
        }

        .step-pill {
          padding: 8px 24px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          color: #bbb;
          background: #f8f8f8;
          transition: all 0.3s ease;
        }

        .step-pill.active {
          background: #FFF0F5;
          color: #E8A8C0;
          box-shadow: 0 4px 12px rgba(232, 168, 192, 0.2);
        }
        
        .step-pill.completed {
          background: #E8A8C0;
          color: white;
        }

        .soft-input {
          width: 100%;
          padding: 16px;
          border: 1px solid #eee;
          border-radius: 12px;
          background: #F9F9F9;
          font-family: 'Pretendard', sans-serif;
          font-size: 16px;
          color: #444;
          outline: none;
          margin-bottom: 12px;
          transition: all 0.2s;
        }

        .soft-input:focus {
          background: white;
          border-color: #E8A8C0;
          box-shadow: 0 0 0 4px rgba(232, 168, 192, 0.1);
        }

        .soft-btn {
          background: #E8A8C0;
          color: white;
          border: none;
          padding: 14px 32px;
          font-family: 'Pretendard', sans-serif;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(232, 168, 192, 0.3);
          transition: all 0.2s;
        }

        .soft-btn:hover {
          transform: translateY(-2px);
          background: #E090A8;
          box-shadow: 0 6px 16px rgba(232, 168, 192, 0.4);
        }

        .soft-btn:active {
          transform: translateY(0);
        }

        .soft-btn:disabled {
          background: #F0D0D8;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .soft-btn.secondary {
          background: white;
          color: #666;
          border: 1px solid #eee;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .soft-btn.secondary:hover {
          background: #f9f9f9;
          border-color: #ddd;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .db-card {
          border: 1px solid #f0f0f0;
          border-radius: 16px;
          background: white;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }

        .db-card:hover {
          border-color: #E8A8C0;
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(232, 168, 192, 0.15);
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .theme-item {
          border: 1px solid #f0f0f0;
          border-radius: 12px;
          background: white;
          padding: 12px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        
        .theme-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .theme-item.selected {
          border-color: #E8A8C0;
          background: #FFF5F8;
          box-shadow: 0 0 0 2px #E8A8C0;
        }

        .color-dot {
          width: 20px; height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(0,0,0,0.05);
          display: inline-block;
          margin: 0 -4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #333;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .color-picker-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px;
            background: #fff;
            border: 1px solid #f0f0f0;
            border-radius: 10px;
            margin-bottom: 8px;
        }

        .color-input-circle {
            width: 32px;
            height: 32px;
            padding: 0;
            border: none;
            border-radius: 50%;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .color-input-circle::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        .color-input-circle::-webkit-color-swatch {
            border: none;
            border-radius: 50%;
        }

        .range-slider {
            width: 100%;
            height: 6px;
            border-radius: 5px;
            background: #eee;
            outline: none;
            -webkit-appearance: none;
        }
        
        .range-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #E8A8C0;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            transition: transform 0.1s;
        }
        
        .range-slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E8A8C0; border-radius: 10px; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .footer-credits {
          text-align: center;
          padding: 40px 20px;
          margin-top: 2rem;
          color: #888;
          font-size: 14px;
          line-height: 1.8;
          font-family: 'Pretendard', sans-serif;
          width: 100%;
          display: block;
          clear: both;
        }

        .footer-credits a {
          color: #E8A8C0;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-credits a:hover {
          color: #E090A8;
          text-decoration: underline;
        }

        .step-3-container {
          display: flex;
          gap: 50px;
          flex-direction: row;
          flex-wrap: nowrap; /* Desktop default */
        }

        .settings-panel {
          flex: 1;
          min-width: 0; /* Prevent flex overflow */
        }

        .preview-panel {
          flex: 0 0 320px;
          background: #F7F8FA;
          padding: 30px 20px;
          border-radius: 20px;
          border: 1px solid #eee;
          align-self: flex-start;
          position: sticky;
          top: 20px;
        }

        @media (max-width: 900px) {
          .step-3-container {
            flex-direction: column;
          }
          
          .settings-panel {
            width: 100%;
          }

          .preview-panel {
            width: 100%;
            flex: none;
            position: static;
            margin-top: 20px;
            /* Move preview below detailed settings in mobile view */
            order: 2; 
          }
        }
      `}</style>

      <div className="pixel-window">
        {/* 윈도우 타이틀바 */}
        <div className="title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Pretendard, sans-serif' }}>
            <Monitor size={18} strokeWidth={2.5} />
            <span>SOMLUTION</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eee' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eee' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FF6B6B', cursor: 'pointer' }}></div>
          </div>
        </div>

        {/* 윈도우 컨텐츠 */}
        <div className="window-content">
          
          {/* 상단 진행 바 */}
          <div className="step-progress-bar">
            <div className={`step-pill ${step >= 1 ? 'completed' : 'active'}`}>01 연결</div>
            <div className={`step-pill ${step > 2 ? 'completed' : step === 2 ? 'active' : ''}`}>02 선택</div>
            <div className={`step-pill ${step > 3 ? 'completed' : step === 3 ? 'active' : ''}`}>03 디자인</div>
            <div className={`step-pill ${step > 4 ? 'completed' : step === 4 ? 'active' : ''}`}>04 완료</div>
          </div>

          <div style={{ minHeight: '300px' }}>
            {error && (
              <div style={{ 
                background: '#FFF0F0', 
                border: '1px solid #FFCDD2', 
                borderRadius: '12px',
                padding: '16px', 
                marginBottom: '24px',
                color: '#D32F2F',
                display: 'flex', alignItems: 'center', gap: '12px',
                fontSize: '14px'
              }}>
                <span style={{ fontSize: '18px' }}>⚠</span> {error}
              </div>
            )}

            {step === 1 && (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ 
                    width: '80px', height: '80px', background: '#FFF0F5', 
                    borderRadius: '50%', margin: '0 auto 20px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <Settings2 size={40} color="#E8A8C0" />
                  </div>
                  <h2 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '700' }}>노션과 연결해볼까요?</h2>
                  <p style={{ color: '#888', fontSize: '15px' }}>Integration 토큰을 아래 입력창에 넣어주세요.</p>
                </div>

                <div style={{ maxWidth: '450px', margin: '0 auto' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px', color: '#555' }}>API TOKEN</label>
                  <input
                    type="password"
                    className="soft-input"
                    value={formData.notionToken}
                    onChange={(e) => handleInputChange('notionToken', e.target.value)}
                    placeholder="secret_..."
                  />
                  <div style={{ textAlign: 'right', marginTop: '30px' }}>
                    <button className="soft-btn" onClick={handleFetchDatabases} disabled={loading}>
                      {loading ? '연결 중...⏳' : '다음 단계로 >'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ animation: 'fadeIn 0.5s' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: '700' }}>데이터베이스 선택</h2>
                    <p style={{ color: '#888', fontSize: '15px' }}>투두리스트로 사용할 데이터베이스를 골라주세요.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {databases.map((db) => (
                    <div key={db.id} className="db-card" onClick={() => handleSelectDatabase(db.id)}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: '#FFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <ListTodo size={24} color="#E8A8C0" />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#333', marginBottom: '4px' }}>{db.title || '제목 없음'}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>ID: {db.id.substr(0, 8)}...</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {loading && <div style={{ textAlign: 'center', marginTop: '40px', color: '#888' }}>데이터베이스 분석 중... 💾</div>}
                
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center' }}>
                  <button className="soft-btn secondary" onClick={() => setStep(1)} style={{ padding: '12px 30px' }}>이전으로</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-3-container" style={{ animation: 'fadeIn 0.5s' }}>
                
                {/* 왼쪽 설정 패널 */}
                <div className="settings-panel">
                  
                  {/* 테마 프리셋 */}
                  <div style={{ marginBottom: '32px' }}>
                    <div className="section-title"><Palette size={18} /> 테마 선택</div>
                    <div className="theme-grid">
                      {themePresets.map((theme) => (
                        <div 
                          key={theme.name} 
                          className={`theme-item ${selectedTheme === theme.name ? 'selected' : ''}`}
                          onClick={() => handleThemeSelect(theme)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', paddingLeft: '8px' }}>
                            <div className="color-dot" style={{ background: theme.colors.background }}></div>
                            <div className="color-dot" style={{ background: theme.colors.primary }}></div>
                            <div className="color-dot" style={{ background: theme.colors.accent }}></div>
                          </div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>{theme.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 폰트 설정 */}
                  <div style={{ marginBottom: '32px' }}>
                    <div className="section-title"><Type size={18} /> 폰트 선택</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select 
                            className="soft-input" 
                            style={{ padding: '12px', cursor: 'pointer' }}
                            value={formData.fontFamily}
                            onChange={(e) => handleInputChange('fontFamily', e.target.value)}
                        >
                            <option value="Galmuri11">갈무리11 (Pixel)</option>
                            <option value="Pretendard">프리텐다드 (Modern)</option>
                            <option value="Corbel">Corbel (Simple)</option>
                        </select>
                    </div>
                  </div>

                  {/* 세부 커스터마이징 */}
                  <div style={{ marginBottom: '32px', background: '#F9F9F9', padding: '20px', borderRadius: '16px' }}>
                    <div className="section-title" style={{ fontSize: '14px' }}>✨ 세부 색상 & 투명도</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>기본 색상</div>
                            <div className="color-picker-wrapper">
                                <span style={{ fontSize: '13px', color: '#555' }}>{formData.primaryColor}</span>
                                <input 
                                    type="color" 
                                    className="color-input-circle" 
                                    value={formData.primaryColor} 
                                    onChange={(e) => {
                                        handleInputChange('primaryColor', e.target.value);
                                        setSelectedTheme(null);
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>강조 색상</div>
                            <div className="color-picker-wrapper">
                                <span style={{ fontSize: '13px', color: '#555' }}>{formData.accentColor}</span>
                                <input 
                                    type="color" 
                                    className="color-input-circle" 
                                    value={formData.accentColor} 
                                    onChange={(e) => {
                                        handleInputChange('accentColor', e.target.value);
                                        setSelectedTheme(null);
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>배경 색상</div>
                            <div className="color-picker-wrapper">
                                <span style={{ fontSize: '13px', color: '#555' }}>{formData.backgroundColor}</span>
                                <input 
                                    type="color" 
                                    className="color-input-circle" 
                                    value={formData.backgroundColor} 
                                    onChange={(e) => {
                                        handleInputChange('backgroundColor', e.target.value);
                                        const fontColor = getContrastColor(e.target.value);
                                        handleInputChange('fontColor', fontColor);
                                        setSelectedTheme(null);
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>폰트 색상</div>
                            <div className="color-picker-wrapper">
                                <span style={{ fontSize: '13px', color: '#555' }}>{formData.fontColor}</span>
                                <input 
                                    type="color" 
                                    className="color-input-circle" 
                                    value={formData.fontColor} 
                                    onChange={(e) => {
                                        handleInputChange('fontColor', e.target.value);
                                        setSelectedTheme(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '0 4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>배경 투명도</span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#E8A8C0' }}>{formData.backgroundOpacity}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={formData.backgroundOpacity} 
                            className="range-slider"
                            onChange={(e) => handleInputChange('backgroundOpacity', parseInt(e.target.value))}
                        />
                    </div>
                  </div>

                  {/* 반복 할 일 */}
                  <div>
                    <div className="section-title"><ListTodo size={18} /> 반복 할 일 (Daily)</div>
                    {formData.recurringTodos.map((todo, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input 
                          className="soft-input" 
                          style={{ marginBottom: 0, padding: '12px' }}
                          value={todo}
                          placeholder="예: 물 마시기, 영양제 먹기"
                          onChange={(e) => {
                            const newTodos = [...formData.recurringTodos];
                            newTodos[idx] = e.target.value;
                            setFormData(prev => ({...prev, recurringTodos: newTodos}));
                          }}
                        />
                        <button 
                          className="soft-btn secondary"
                          style={{ padding: '0 16px', color: '#FF6B6B', borderColor: '#FFCDD2' }}
                          onClick={() => {
                            const newTodos = formData.recurringTodos.filter((_, i) => i !== idx);
                            setFormData(prev => ({...prev, recurringTodos: newTodos}));
                          }}
                        >×</button>
                      </div>
                    ))}
                    {formData.recurringTodos.length < 5 && (
                      <button 
                        className="soft-btn secondary" 
                        style={{ width: '100%', fontSize: '14px', padding: '12px', borderStyle: 'dashed' }}
                        onClick={() => setFormData(prev => ({...prev, recurringTodos: [...prev.recurringTodos, '']}))}
                      >
                        + 반복 할 일 추가하기
                      </button>
                    )}
                  </div>

                </div>

                {/* 우측 미리보기 패널 */}
                <div className="preview-panel">
                  <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '14px', color: '#888', fontWeight: '600' }}>
                    LIVE PREVIEW
                  </div>
                  
                  <PreviewWidget 
                    key={JSON.stringify({ ...formData, step })} // Force re-render on any formData change
                    theme={{
                      primaryColor: formData.primaryColor,
                      accentColor: formData.accentColor,
                      backgroundColor: formData.backgroundColor,
                      fontColor: formData.fontColor,
                      backgroundOpacity: formData.backgroundOpacity
                    }}
                    recurringTodos={formData.recurringTodos}
                    fontFamily={formData.fontFamily}
                  />

                  <div style={{ marginTop: '40px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button className="soft-btn secondary" onClick={() => setStep(2)} style={{ padding: '12px 20px' }}>이전</button>
                    <button className="soft-btn" onClick={() => { setStep(4); handleSubmit(); }} style={{ flex: 1 }}>완료 및 생성 ✨</button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '60px 0', animation: 'fadeIn 0.5s' }}>
                <div style={{ fontSize: '50px', marginBottom: '30px', animation: 'spin 2s linear infinite' }}>💿</div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>위젯을 굽고 있습니다...</h3>
                <p style={{ color: '#888', fontSize: '15px' }}>잠시만 기다려주세요.</p>
              </div>
            )}

            {step === 5 && (
              <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s', padding: '40px 0' }}>
                <div style={{ 
                    width: '80px', height: '80px', background: '#E8F5E9', 
                    borderRadius: '50%', margin: '0 auto 24px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#4CAF50', fontSize: '40px'
                }}>🎉</div>
                <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', color: '#333' }}>설치가 완료되었습니다!</h2>
                <p style={{ marginBottom: '40px', color: '#666', fontSize: '16px' }}>아래 링크를 노션에 '임베드'하여 사용하세요.</p>

                <div style={{ background: '#F9F9F9', border: '1px solid #eee', borderRadius: '12px', padding: '20px', maxWidth: '500px', margin: '0 auto 40px' }}>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px', textAlign: 'left', fontWeight: '600' }}>EMBED URL</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input className="soft-input" readOnly value={embedUrl} style={{ marginBottom: 0, fontSize: '14px', background: 'white' }} />
                    <button className="soft-btn" onClick={() => {
                      navigator.clipboard.writeText(embedUrl);
                      alert('URL이 복사되었습니다!');
                    }} style={{ padding: '0 20px' }}>
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <button className="soft-btn" onClick={() => window.open(embedUrl, '_blank')}>
                    <Monitor size={16} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
                    위젯 바로가기
                  </button>
                  <button className="soft-btn secondary" onClick={() => {
                    setStep(3);
                    setShowPreview(true);
                  }}>
                    <Palette size={16} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
                    디자인 수정하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Credits */}
      <div className="footer-credits" style={{ marginTop: 'auto' }}>
        <div style={{ marginBottom: '8px', fontWeight: '600', color: '#666' }}>created by SOMLUTION</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <a href="https://x.com/somnote_" target="_blank" rel="noopener noreferrer">
            ❤️ X (@somnote_)
          </a>
          <a href="mailto:somlution@gmail.com">
            💌 somlution@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
