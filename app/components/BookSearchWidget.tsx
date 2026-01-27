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

interface BookSearchWidgetProps {
  onSelectBook?: (book: BookResult) => void;
}

export default function BookSearchWidget({ onSelectBook }: BookSearchWidgetProps) {
  const [view, setView] = useState<"main" | "search">("main");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BookResult[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateString = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const MOCK_BOOKS: BookResult[] = [
    { id: 1, title: "물고기는 존재하지 않는다", author: "룰루 밀러", cover: "", color: "#CDE4F5" },
    { id: 2, title: "헤어질 결심 각본", author: "정서경, 박찬욱", cover: "", color: "#D8EBF7" },
    { id: 3, title: "도둑맞은 집중력", author: "요한 하리", cover: "", color: "#E0F0FA" },
    { id: 4, title: "도시와 그 불확실한 벽", author: "무라카미 하루키", cover: "", color: "#D1E6F3" },
    { id: 5, title: "모순", author: "양귀자", cover: "", color: "#DBEEF9" },
  ];

  const handleSearch = async () => {
    if (query.trim() !== "") {
      setIsLoading(true);
      setResults([]); 
      
      try {
        const response = await fetch(`/api/books/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setResults(data.data);
        } else {
          // API 실패 시 mock 데이터 사용
          setResults(MOCK_BOOKS);
        }
      } catch (error) {
        console.error('검색 오류:', error);
        // 오류 시 mock 데이터 사용
        setResults(MOCK_BOOKS);
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

  const handleSelectBook = (book: BookResult) => {
    setSelectedBookId(book.id);
    if (onSelectBook) {
      onSelectBook(book);
    }
    setTimeout(() => {
      setSelectedBookId(null);
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
        .book-widget-body {
          background: transparent;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          font-family: 'Corbel', 'Malgun Gothic', sans-serif;
        }

        .window {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #D6E6F2;
          box-shadow: 0 4px 12px rgba(184, 212, 235, 0.1);
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
          background: #F2F9FF;
          border-bottom: 1px solid #E6F2FA;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          font-size: 11px;
          color: #8FB6D6;
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
          background: #DCEBF7;
          border-radius: 50%;
          margin-left: 5px;
        }

        /* --- Main View Styles --- */
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
          color: #6C9AC4;
          font-weight: 300;
          letter-spacing: -1px;
          margin-bottom: 2px;
          line-height: 1;
          user-select: none;
        }

        .clock-date {
          font-size: 11px;
          color: #A0BBD0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1px;
          user-select: none;
        }

        /* 변경된 검색 트리거: 버튼 형태가 아닌 텍스트/아이콘 힌트 */
        .search-trigger {
          margin-top: 18px;
          display: flex;
          align-items: center;
          gap: 5px;
          color: #B4D4EC; /* 아주 연한 색상 */
          font-size: 11px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
          background: transparent;
        }

        .search-trigger:hover {
          color: #8FB6D6; /* 호버 시 약간 진해짐 */
          background: rgba(242, 249, 255, 0.5);
          transform: translateY(-1px);
        }

        /* --- Search View Styles --- */
        .search-view {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .search-area {
          padding: 6px 8px;
          border-bottom: 1px solid #F0F7FC;
          display: flex;
          gap: 6px;
          align-items: center;
          background: #FFFFFF;
        }

        .back-btn {
          color: #A0BBD0;
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .back-btn:hover {
          background: #F0F7FC;
          color: #6C9AC4;
        }

        .search-input {
          flex: 1;
          border: 1px solid #E1EEF6;
          background: #FAFDFF;
          padding: 4px 8px;
          font-family: inherit;
          font-size: 11px;
          color: #555;
          border-radius: 4px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .search-input::placeholder {
          color: #C8DBE9;
        }

        .search-input:focus {
          border-color: #B4D4EC;
        }

        .content-area {
          flex: 1;
          padding: 2px;
          overflow-y: auto;
          background: white;
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
          background: #F5FBFF;
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
          background: #EBF5FB;
          border: 1px solid #D6E6F2;
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
          box-shadow: 0 3px 6px rgba(168, 192, 232, 0.2);
          z-index: 10;
          border-color: #B4D4EC;
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
          color: #555;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .book-author {
          font-size: 9px;
          color: #A0BBD0;
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
          color: #B4D4EC;
          font-size: 10px;
          gap: 6px;
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E1EEF6; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #CFE3F2; }

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
              <div className="win-btn" style={{ background: "#DCEBF7" }}></div>
              <div className="win-btn" style={{ background: "#C8DBE9" }}></div>
            </div>
          </div>

          {/* 뷰 컨텐츠: 메인 vs 검색 */}
          {view === 'main' ? (
            <div className="main-view">
              <div className="clock-time">{timeString}</div>
              <div className="clock-date">{dateString}</div>
              
              {/* 눈에 띄지 않는 은은한 검색 트리거 */}
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
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#6C9AC4", fontSize: "11px", height: "30px" }}>
                          <Check size={14} strokeWidth={2.5} />
                          <span>Saved</span>
                        </div>
                      ) : (
                        <>
                          <div className="book-cover-container">
                            <div className="book-cover" style={{ backgroundColor: book.color }}>
                              {book.cover ? (
                                <img src={book.cover} alt={book.title} />
                              ) : (
                                <span style={{ fontSize: "7px", opacity: 0.6, color: "#6C9AC4" }}>IMG</span>
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
