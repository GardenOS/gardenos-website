import type { ReactNode } from "react";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={notoSansSc.variable} lang="zh" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
