"use client";
import { ReactNode } from "react";
import SearchBar from "@/components/SearchBar";
import "./globals.css";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <header className="w-full flex justify-center py-4 shadow-sm bg-white sticky top-0 z-50">
          <div className="w-1/3 flex justify-center">
            <SearchBar />
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
