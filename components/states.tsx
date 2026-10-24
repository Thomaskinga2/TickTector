import type { ReactNode } from "react";
import { Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

// Every slot component takes these, usually spread from useAsync().
export type SlotProps = { loading?: boolean; error?: string | null; onRetry?: () => void };

// Returns the loading / error / empty view, or null when the slot should render its data.
export function slotStatus({ loading, error, onRetry }: SlotProps, isEmpty: boolean, emptyText: string) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState>{emptyText}</EmptyState>;
  return null;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-2 py-6 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-risk-high/30 bg-risk-high/5 p-4">
      <p>{message}</p>
      {onRetry && (
        <Button variant="outline" className="h-11 px-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed p-4 text-muted-foreground">{children}</p>;
}

export function ComingSoon({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/50 px-4 py-8 text-center">
      <Sprout className="size-6 text-primary" aria-hidden />
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{children ?? "Coming soon."}</p>
    </div>
  );
}

export function Disclaimer() {
  return <p className="text-sm text-muted-foreground">Information only, not medical advice.</p>;
}
