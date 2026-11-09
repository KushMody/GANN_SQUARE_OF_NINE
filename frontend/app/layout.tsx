import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gann Square of Nine Roadmap | Professional Market Analysis",
  description: "Advanced browser-based Square of Nine Roadmap and Price-Time Squaring terminal inspired by TradingFives methodology.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
