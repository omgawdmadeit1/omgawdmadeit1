import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Grok SaaS Billing Starter',
  description: 'AI SaaS MVP with Supabase auth, Stripe billing, Grok chat, and usage charts.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
