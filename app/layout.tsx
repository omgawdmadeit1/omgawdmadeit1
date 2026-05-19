import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Prosperity CFO", description: "AI-powered proactive CFO dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
