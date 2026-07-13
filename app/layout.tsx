import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "pretendard/dist/web/static/pretendard.css";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lightlink Tools | 사역을 더 가볍게",
  description:
    "광림교회 청년부의 사역을 돕는 쉽고 간편한 웹 도구 모음입니다.",
  icons: {
    icon: "/brand/lightlink-icon.png",
    apple: "/brand/lightlink-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={dmSans.variable}>{children}</body>
    </html>
  );
}
