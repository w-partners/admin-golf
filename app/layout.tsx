import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionWrapper from '@/components/SessionWrapper';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { ConditionalLayout } from '@/components/layout/ConditionalLayout';
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
  title: "골프장 예약 관리",
  description: "골프장 예약 관리 시스템",
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
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </SessionWrapper>
      </body>
    </html>
  );
}