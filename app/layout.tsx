import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rnews",
  description: "聚合技术社区、AI、科技媒体与主机资讯。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
