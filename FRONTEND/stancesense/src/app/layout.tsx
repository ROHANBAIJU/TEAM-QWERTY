import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "StanceSense - Parkinson's Monitoring Dashboard",
  description: "AI-Powered Wearable System for Proactive Parkinson's Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex overflow-hidden">
        <Sidebar />
        <div className="main-layout">
          <div className="container">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
