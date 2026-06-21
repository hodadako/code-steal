import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamForge | 유사 시험 문제 플랫폼",
  description: "영어 수능 유형 유사 문제 생성 및 시험지 제작 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
