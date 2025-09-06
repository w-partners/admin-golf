import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionWrapper from '@/components/SessionWrapper';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "골프장 예약 관리 시스템",
  description: "Golf Course Reservation Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          <div className="min-h-screen bg-gray-50">
            <GlobalHeader />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}