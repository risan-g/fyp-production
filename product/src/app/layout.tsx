/**
 * @file layout.tsx
 * @description The Root Layout of the application.
 * This file wraps every page, providing a consistent structure,
 * global styles, and persistent components like the NavBar.
 */

import { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

import Script from "next/script";

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <Script src="/api/config" strategy="beforeInteractive" />
        {/* Persistent Navigation Bar across all application routes */}
        <NavBar />

        {/* Main content area where individual page components are injected */}
        <main>{children}</main>
      </body>
    </html>
  );
}
