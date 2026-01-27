import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "리딩플로우 도서 검색 위젯",
  description: "Notion 연동 Y2K 스타일 도서 검색 위젯",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "'Galmuri11', monospace" }}>
        {children}
      </body>
    </html>
  );
}
