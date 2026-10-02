import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "与神同行 · 每日信仰陪伴",
  description: "安静祷告、轻柔音乐与每天踏实的一小步。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
