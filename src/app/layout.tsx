import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansSc = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const signInForceRedirectUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL?.trim();
  const signUpForceRedirectUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL?.trim();

  return (
    <html className={notoSansSc.variable} lang="zh" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <ClerkProvider
          afterSignOutUrl="/zh"
          signInFallbackRedirectUrl="/zh/dashboard"
          signUpFallbackRedirectUrl="/zh/dashboard"
          signInForceRedirectUrl={signInForceRedirectUrl || undefined}
          signUpForceRedirectUrl={signUpForceRedirectUrl || undefined}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
