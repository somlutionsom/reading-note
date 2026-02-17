# 📚 Reading Note Widget

카카오 책 검색 API를 활용한 도서 검색 위젯입니다. 시계 화면과 도서 검색 기능을 제공합니다.

## 저장소 정보
- **GitHub URL**: https://github.com/somlutionsom/reading-note.git
- **배포 URL**: https://somy2kreadingnote.vercel.app/
- **프로젝트 유형**: 웹앱 (Next.js 기반)

## 주요 기능

- 🔍 **도서 검색**: 카카오 책 검색 API를 사용한 도서 검색
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
# .env.local 파일을 편집하여 카카오 REST API 키 설정

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속

## 환경변수 설정

```env
# 카카오 REST API 키 (필수)
# https://developers.kakao.com 에서 앱 생성 후 발급
KAKAO_REST_API_KEY=your_kakao_rest_api_key_here

# Next.js 환경 변수
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# 이미지 재호스팅 (권장)
# 설정 시 저장 시점에 표지 이미지를 Vercel Blob으로 업로드한 영구 URL을 Notion에 저장합니다.
# 미설정 시 프록시/원본 URL 폴백 모드로 동작합니다.
BLOB_READ_WRITE_TOKEN=your_vercel_blob_rw_token
IMAGE_FETCH_TIMEOUT_MS=15000
IMAGE_STORAGE_MAX_BYTES=10485760
```

## 카카오 REST API 키 발급 방법

1. [카카오 개발자 센터](https://developers.kakao.com) 접속
2. 카카오 계정으로 로그인
3. "내 애플리케이션" → "애플리케이션 추가하기" 클릭
4. 앱 이름, 사업자명 입력 후 저장
5. 생성된 앱 선택 → "앱 키" 탭에서 **REST API 키** 복사
6. 복사한 키를 `.env.local` 파일에 설정

## 프로젝트 구조

```
reading-note/
├── app/
│   ├── api/
│   │   └── books/
│   │       └── search/
│   │           └── route.ts    # 카카오 책 검색 API 연동
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
카카오 책 검색 API를 사용하여 도서를 검색합니다.

**쿼리 파라미터:**
- `query`: 검색어 (필수)
- `maxResults`: 최대 결과 수 (기본값: 10, 최대: 50)

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "id": "9788996991342",
      "title": "책 제목",
      "author": "저자명",
      "cover": "https://...",
      "coverOriginal": "https://t1.daumcdn.net/...",
      "publisher": "출판사",
      "pubDate": "2024-01-01",
      "description": "도서 소개",
      "isbn13": "9788996991342",
      "price": 15000,
      "link": "https://..."
    }
  ],
  "totalResults": 100
}
```

### POST `/api/books/save`
도서를 Notion 데이터베이스에 저장합니다.

- 1차 안정화: 커버 프록시 URL을 공개 프로덕션 도메인으로 정규화
- 2차 안정화: `BLOB_READ_WRITE_TOKEN` 설정 시 커버 이미지를 Vercel Blob에 재호스팅
- Blob 업로드 실패 시 프록시/원본 URL로 자동 폴백

## 위젯 임베드

### iframe으로 임베드

```html
<iframe 
  src="https://somy2kreadingnote.vercel.app/todo-widget/CONFIG" 
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
vercel env add KAKAO_REST_API_KEY
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
- **API**: 카카오 책 검색 API

## 라이선스

MIT

## 크레딧

- [카카오 개발자 센터](https://developers.kakao.com)
- [Lucide Icons](https://lucide.dev/)
- [Next.js](https://nextjs.org/)
