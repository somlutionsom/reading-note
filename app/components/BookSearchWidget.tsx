'use client';

import { useState, useEffect } from "react";
import { Search, Book, Check, Loader2, ArrowLeft, Clock } from "lucide-react";

interface BookResult {
  id: number;
  title: string;
  author: string;
  cover: string;
  color: string;
}

interface WidgetConfig {
  token?: string;
  databaseId?: string;
  titleProperty?: string;
  authorProperty?: string;
  coverProperty?: string;
  coverPropertyType?: 'files' | 'url' | '';
  statusProperty?: string;
  theme?: {
    primaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    backgroundOpacity?: number;
    fontColor?: string;
    fontFamily?: string;
  };
}

interface BookSearchWidgetProps {
  config?: WidgetConfig;
  onSelectBook?: (book: BookResult) => void;
}

export default function BookSearchWidget({ config, onSelectBook }: BookSearchWidgetProps) {
  const [view, setView] = useState<"main" | "search">("main");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BookResult[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // 테마 기본값
  const theme = {
    primaryColor: config?.theme?.primaryColor || '#6C9AC4',
    accentColor: config?.theme?.accentColor || '#B4D4EC',
    backgroundColor: config?.theme?.backgroundColor || '#FFFFFF',
    backgroundOpacity: config?.theme?.backgroundOpacity ?? 95,
    fontColor: config?.theme?.fontColor || '#555555',
    fontFamily: config?.theme?.fontFamily || 'Corbel',
  };

  // HEX to RGBA
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha / 100})`;
  };

  const bgStyle = theme.backgroundOpacity < 100 
    ? hexToRgba(theme.backgroundColor, theme.backgroundOpacity) 
    : theme.backgroundColor;

  const getFontFamily = (font: string) => {
    switch(font) {
      case 'Galmuri11': return "'Galmuri11', monospace";
      case 'Pretendard': return "'Pretendard', sans-serif";
      case 'Corbel': return "'Corbel', 'Malgun Gothic', sans-serif";
      default: return "'Corbel', 'Malgun Gothic', sans-serif";
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleSearch = async () => {
    if (query.trim() !== "") {
      setIsLoading(true);
      setResults([]); 
      
      try {
        const response = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setResults(data.data);
        }
      } catch (error) {
        console.error('검색 오류:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 노션에 도서 저장
  const saveToNotion = async (book: BookResult) => {
    if (!config?.token || !config?.databaseId) {
      console.log('노션 설정이 없습니다.');
      return false;
    }

    try {
      const response = await fetch('/api/books/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: config.token,
          databaseId: config.databaseId,
          titleProperty: config.titleProperty,
          authorProperty: config.authorProperty,
          coverProperty: config.coverProperty,
          coverPropertyType: config.coverPropertyType || 'files',
          statusProperty: config.statusProperty,
          book: {
            title: book.title,
            author: book.author,
            cover: book.cover,
          },
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('노션 저장 오류:', error);
      return false;
    }
  };

  const handleSelectBook = async (book: BookResult) => {
    setSelectedBookId(book.id);
    
    // 노션에 저장 시도
    if (config?.token && config?.databaseId) {
      const saved = await saveToNotion(book);
      setSaveMessage(saved ? 'Saved!' : 'Save failed');
    } else {
      setSaveMessage('Saved!');
    }

    if (onSelectBook) {
      onSelectBook(book);
    }

    setTimeout(() => {
      setSelectedBookId(null);
      setSaveMessage(null);
    }, 1500);
  };

  const goSearch = () => setView("search");
  const goMain = () => {
    setView("main");
    setQuery("");
    setResults([]);
  };

  return (
    <>
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css');
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");

        .book-widget-body {
          background: transparent;
          margin: 0;
          padding: 4px;
          font-family: ${getFontFamily(theme.fontFamily)};
        }

        .book-widget-body * {
          font-family: inherit;
        }

        .window {
          background: ${bgStyle};
          border: 1px solid ${theme.primaryColor}40;
          box-shadow: 0 4px 12px ${hexToRgba(theme.primaryColor, 10)};
          border-radius: 10px;
          overflow: hidden;
          width: 200px;
          height: 180px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .win-header {
          height: 26px;
          background: ${hexToRgba(theme.primaryColor, 15)};
          border-bottom: 1px solid ${theme.primaryColor}30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          font-size: 11px;
          color: ${theme.primaryColor};
          font-weight: 600;
          flex-shrink: 0;
        }

        .win-header-title {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .win-btn {
          width: 7px;
          height: 7px;
          background: ${theme.primaryColor}40;
          border-radius: 50%;
          margin-left: 5px;
        }

        .main-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding-bottom: 8px;
        }

        .clock-time {
          font-size: 34px;
          color: ${theme.primaryColor};
          font-weight: 300;
          letter-spacing: -1px;
          margin-bottom: 2px;
          line-height: 1;
          user-select: none;
        }

        .clock-date {
          font-size: 11px;
          color: ${theme.primaryColor}99;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          user-select: none;
        }

        .search-trigger {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: ${theme.accentColor};
          font-size: 11px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
          background: transparent;
        }

        .search-trigger:hover {
          color: ${theme.primaryColor};
          background: ${hexToRgba(theme.primaryColor, 10)};
          transform: translateY(-1px);
        }

        .search-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .search-area {
          padding: 6px 8px;
          border-bottom: 1px solid ${theme.primaryColor}15;
          display: flex;
          gap: 6px;
          align-items: center;
          background: ${bgStyle};
        }

        .back-btn {
          color: ${theme.primaryColor}80;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .back-btn:hover {
          background: ${hexToRgba(theme.primaryColor, 10)};
          color: ${theme.primaryColor};
        }

        .search-input {
          flex: 1;
          border: 1px solid ${theme.primaryColor}25;
          background: transparent;
          padding: 4px 8px;
          font-family: inherit;
          font-size: 11px;
          color: ${theme.fontColor};
          border-radius: 4px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .search-input::placeholder {
          color: ${theme.primaryColor}60;
        }

        .search-input:focus {
          border-color: ${theme.accentColor};
        }

        .content-area {
          flex: 1;
          padding: 2px;
          overflow-y: auto;
          background: ${bgStyle};
        }

        .book-item {
          display: flex;
          gap: 8px;
          padding: 6px;
          margin: 2px 4px;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          align-items: center;
        }

        .book-item:hover {
          background: ${hexToRgba(theme.primaryColor, 8)};
        }

        .book-cover-container {
          width: 22px;
          height: 30px;
          position: relative;
          perspective: 500px;
        }

        .book-cover {
          width: 100%;
          height: 100%;
          background: ${hexToRgba(theme.primaryColor, 15)};
          border: 1px solid ${theme.primaryColor}30;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center center;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .book-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .book-item:hover .book-cover {
          transform: scale(1.4) translateY(-1px);
          box-shadow: 0 3px 6px ${hexToRgba(theme.primaryColor, 20)};
          z-index: 10;
          border-color: ${theme.accentColor};
        }

        .book-info {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .book-title {
          font-size: 11px;
          color: ${theme.fontColor};
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .book-author {
          font-size: 9px;
          color: ${theme.primaryColor}99;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-msg {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: ${theme.accentColor};
          font-size: 10px;
          gap: 6px;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.primaryColor}30; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.primaryColor}50; }

        .spin { animation: spin 1.5s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="book-widget-body">
        <div className="window">
          {/* 공통 헤더 */}
          <div className="win-header">
            <span className="win-header-title">
              {view === 'main' ? <Clock size={11} strokeWidth={2} /> : <Book size={11} strokeWidth={2} />}
              {view === 'main' ? 'Today' : 'Lib'}
            </span>
            <div style={{ display: "flex" }}>
              <div className="win-btn"></div>
              <div className="win-btn" style={{ background: `${theme.primaryColor}60` }}></div>
            </div>
          </div>

          {/* 뷰 컨텐츠: 메인 vs 검색 */}
          {view === 'main' ? (
            <div className="main-view">
              <div className="clock-time">{timeString}</div>
              <div className="clock-date">{dateString}</div>
              
              <div className="search-trigger" onClick={goSearch} title="Click to search books">
                <Search size={11} strokeWidth={2.5} />
                <span>search</span>
              </div>
            </div>
          ) : (
            <div className="search-view">
              <div className="search-area">
                <div className="back-btn" onClick={goMain} title="Back to Clock">
                  <ArrowLeft size={14} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>

              <div className="content-area">
                {isLoading ? (
                  <div className="status-msg">
                    <Loader2 className="spin" size={16} />
                  </div>
                ) : results.length > 0 ? (
                  results.map((book) => (
                    <div
                      key={book.id}
                      className="book-item"
                      onClick={() => handleSelectBook(book)}
                    >
                      {selectedBookId === book.id ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: theme.primaryColor, fontSize: "11px", height: "30px" }}>
                          <Check size={14} strokeWidth={2.5} />
                          <span>{saveMessage || 'Saved!'}</span>
                        </div>
                      ) : (
                        <>
                          <div className="book-cover-container">
                            <div className="book-cover" style={{ backgroundColor: book.color }}>
                              {book.cover ? (
                                <img src={book.cover} alt={book.title} />
                              ) : (
                                <span style={{ fontSize: "7px", opacity: 0.6, color: theme.primaryColor }}>IMG</span>
                              )}
                            </div>
                          </div>
                          <div className="book-info">
                            <div className="book-title">{book.title}</div>
                            <div className="book-author">{book.author}</div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="status-msg">
                    <span style={{ fontSize: "18px", opacity: 0.5 }}>☁️</span>
                    <span>Search...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
