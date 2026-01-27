# 📚 Reading Note Widget

알라딘 API를 활용한 도서 검색 위젯입니다. 시계 화면과 도서 검색 기능을 제공합니다.

## 저장소 정보
- **GitHub URL**: https://github.com/somlutionsom/reading-note.git
- **배포 URL**: (배포 후 업데이트 예정)
- **프로젝트 유형**: 웹앱 (Next.js 기반)

## 주요 기능

- 🔍 **도서 검색**: 알라딘 API를 사용한 도서 검색
- 🕐 **시계 위젯**: 현재 시간과 날짜 표시
- 🎨 **깔끔한 디자인**: 미니멀하고 모던한 UI
- 📱 **임베드 지원**: iframe으로 다른 페이지에 삽입 가능

## 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/somlutionsom/reading-note.git
cd reading-note

# 의존성 설치
npm install

# 환경변수 설정
cp env.example .env.local
# .env.local 파일을 편집하여 알라딘 API 키 설정

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속

## 환경변수 설정

```env
# 알라딘 API 키 (필수)
# https://www.aladin.co.kr/ttb/wblog_manage.aspx 에서 발급
ALADIN_TTB_KEY=your_aladin_ttb_key_here

# Next.js 환경 변수
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

## 알라딘 API 키 발급 방법

1. [알라딘 TTB 관리](https://www.aladin.co.kr/ttb/wblog_manage.aspx) 페이지 접속
2. 알라딘 계정으로 로그인
3. "TTB 키 발급받기" 클릭
4. 블로그/사이트 정보 입력 후 키 발급
5. 발급된 TTB 키를 `.env.local` 파일에 설정

## 프로젝트 구조

```
reading-note/
├── app/
│   ├── api/
│   │   └── books/
│   │       └── search/
│   │           └── route.ts    # 알라딘 API 연동
│   ├── components/
│   │   ├── BookSearchWidget.tsx # 메인 위젯 컴포넌트
│   │   ├── ErrorBoundary.tsx
│   │   └── LoadingSpinner.tsx
│   ├── todo-widget/
│   │   └── [cfg]/
│   │       └── page.tsx        # 임베드용 위젯 페이지
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # 홈페이지
├── lib/
│   ├── notion.ts               # Notion 연동 (선택적)
│   ├── types.ts                # 타입 정의
│   ├── utils.ts
│   └── validation.ts           # 데이터 검증
├── env.example
├── package.json
└── README.md
```

## API 엔드포인트

### GET `/api/books/search`
알라딘 API를 사용하여 도서를 검색합니다.

**쿼리 파라미터:**
- `query`: 검색어 (필수)
- `maxResults`: 최대 결과 수 (기본값: 10)

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "title": "책 제목",
      "author": "저자명",
      "cover": "https://...",
      "publisher": "출판사",
      "pubDate": "2024-01-01",
      "isbn13": "9781234567890",
      "price": 15000,
      "link": "https://..."
    }
  ],
  "totalResults": 100
}
```

## 위젯 임베드

### iframe으로 임베드

```html
<iframe 
  src="https://your-domain.com/todo-widget/CONFIG" 
  width="220" 
  height="200" 
  frameborder="0"
  style="border-radius: 10px;">
</iframe>
```

## 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정
vercel env add ALADIN_TTB_KEY
```

### 수동 배포

```bash
# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 기술 스택

- **프레임워크**: Next.js 15+
- **언어**: TypeScript
- **스타일링**: CSS-in-JS
- **아이콘**: Lucide React
- **API**: 알라딘 Open API

## 라이선스

MIT

## 크레딧

- [알라딘 Open API](https://www.aladin.co.kr/ttb/apiguide.aspx)
- [Lucide Icons](https://lucide.dev/)
- [Next.js](https://nextjs.org/)
