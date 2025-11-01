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
      <body className="bg-gray-50 min-h-screen">
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
