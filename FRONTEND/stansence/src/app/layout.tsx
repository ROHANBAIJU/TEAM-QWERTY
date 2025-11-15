import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { SensorDataProvider } from "@/contexts/SensorDataContext";
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
      <body style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <AuthProvider>
          <SensorDataProvider>
            <Sidebar />
            <main style={{ 
              marginLeft: '200px',
              width: 'calc(100vw - 200px)',
              height: '100vh',
              overflow: 'hidden'
            }}>
              {children}
            </main>
          </SensorDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
