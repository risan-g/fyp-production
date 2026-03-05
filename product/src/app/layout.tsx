/**
 * @file layout.tsx
 * @description The Root Layout of the application.
 * This file wraps every page, providing a consistent structure,
 * global styles, and persistent components like the NavBar.
 */

"use client";
import { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Persistent Navigation Bar across all application routes */}
        <NavBar />

        {/* Main content area where individual page components are injected */}
        <main>{children}</main>
      </body>
    </html>
  );
}
