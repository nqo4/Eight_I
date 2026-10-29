import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeBack",
  description: "AI가 만든 코드를, 진짜 내 코드로.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
