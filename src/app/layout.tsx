import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "이르미 — 민생위기 조기경보 레이더",
  description: "매경 뉴스 데이터 기반 민생위기 조기경보 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Navigation />
        <main className="mx-auto px-6 md:px-12 lg:px-20 py-6 md:py-10 pb-20">
          {children}
        </main>
      </body>
    </html>
  );
}
