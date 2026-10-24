import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Page({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <main className={cn("mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6", className)}>
      {title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
      {children}
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}
