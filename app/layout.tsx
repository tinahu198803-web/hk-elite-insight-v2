import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '港股智通 - 港股IPO专家 | HK-Elite Insight',
  description: '专业港股通体检、招股书分析，为内地企业家提供港股IPO一站式服务',
  keywords: '港股, IPO, 港股通, 招股书, 上市, 体检, 投资',
  authors: [{ name: 'HK-Elite Insight' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#0a2463',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
