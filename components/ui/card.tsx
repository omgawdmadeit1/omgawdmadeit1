import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-slate-800 bg-surface/80 p-5 shadow-card", className)}>{children}</div>;
}
