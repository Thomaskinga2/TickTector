import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Meadow } from "@/components/meadow";
import { Radar } from "@/components/radar";
import { Tick } from "@/components/tick";
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

export function LoadingState({ label = "Tick is on the case…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-6 type-subhead text-muted-foreground">
      <Radar size={40}>
        <Tick size={26} motion="search" />
      </Radar>
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="soft-block flex items-start gap-3 p-4">
      <Tick size={40} mood="puzzled" className="mt-0.5" />
      <div className="flex flex-col items-start gap-3">
        <p className="type-body">{message}</p>
        {onRetry && (
          <Button variant="tinted" size="sm" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}

// `action` is the way out of the empty state (HIG: offer the next step, not just a message).
// `puzzled` is for searches that came up empty.
export function EmptyState({ children, action, puzzled = false }: { children: ReactNode; action?: ReactNode; puzzled?: boolean }) {
  return (
    <div className="soft-block fade-in flex flex-col items-center gap-2 px-4 py-5 text-center">
      <Tick size={52} mood={puzzled ? "puzzled" : "happy"} className={puzzled ? undefined : "tick-crawl-in"} />
      <p className="max-w-[34ch] type-subhead text-muted-foreground">{children}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

// iOS "content unavailable" view: Tick napping in the meadow, a title and one line, centered.
// `puzzled` for dead ends (the 404): Tick awake and scratching its head instead of napping.
export function ComingSoon({
  title,
  icon: Icon,
  action,
  puzzled = false,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  puzzled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      {/* Tick is asleep in the grass (the feature isn't awake yet), or puzzled at a dead end. The badge says which feature. */}
      <div className="town-hero soft-block w-full max-w-sm overflow-hidden">
        <span className="relative mx-auto mt-7 -mb-6 block w-fit">
          <Tick size={84} mood={puzzled ? "puzzled" : "sleepy"} />
          {Icon && (
            <span className="module-icon absolute -right-1 bottom-6 shadow-[0_1px_3px_rgb(0_0_0/0.15)]">
              <Icon className="size-4" strokeWidth={2.2} aria-hidden />
            </span>
          )}
        </span>
        <Meadow level="moderate" />
      </div>
      <p className="mt-2 type-title3 font-semibold">{title}</p>
      <p className="max-w-[32ch] type-subhead text-muted-foreground">{children ?? "Coming soon."}</p>
      {action}
    </div>
  );
}

// `levels={false}` on screens that show no levels (Scan, Quest): just the medical line.
export function Disclaimer({ levels = true }: { levels?: boolean }) {
  return (
    <p className="px-1 type-footnote text-muted-foreground">
      {levels && "Levels are TickTector estimates from Mass. DPH surveillance data and the National Weather Service forecast. "}
      Information only, not medical advice.
    </p>
  );
}
