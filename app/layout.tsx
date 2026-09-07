import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "omgawdmadeit1 Suite",
  description: "Unified finance OS, Grok SaaS billing starter, and Agent Skill Exchange backend",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
