import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 lg:flex-row">
    <Sidebar />
    <main className="flex-1 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {children}
    </main>
  </div>;
}
