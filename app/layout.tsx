import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SessionWrapper from '@/components/SessionWrapper';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { BRANDING } from '@/constants/branding';
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
  title: BRANDING.SYSTEM_NAME,
  description: BRANDING.COMPANY_DESCRIPTION,
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