import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// iOS inset grouped list (HIG Lists and tables) on TickTector's soft block, hairline separators inset from the text.
export function List({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <ul
      aria-label={label}
      className={cn(
        "soft-block overflow-hidden",
        "[&>li+li]:relative [&>li+li]:before:absolute [&>li+li]:before:inset-x-0 [&>li+li]:before:top-0 [&>li+li]:before:ml-4 [&>li+li]:before:h-px [&>li+li]:before:origin-top [&>li+li]:before:scale-y-50 [&>li+li]:before:bg-separator [&>li+li]:before:content-['']",
        className,
      )}
    >
      {children}
    </ul>
  );
}

// One row: at least 44 pt tall, optional leading mark, trailing detail and disclosure chevron.
export function ListRow({
  href,
  leading,
  trailing,
  chevron = !!href,
  className,
  children,
}: {
  href?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const content = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {trailing && <span className="flex shrink-0 items-center text-muted-foreground">{trailing}</span>}
      {chevron && <ChevronRight className="size-4 shrink-0 text-label-tertiary" strokeWidth={2.5} aria-hidden />}
    </>
  );
  const rowClass = cn("flex min-h-11 items-center gap-3 px-4 py-2.5", className);

  return (
    <li>
      {href ? (
        <Link href={href} className={cn(rowClass, "transition-colors active:bg-fill")}>
          {content}
        </Link>
      ) : (
        <div className={rowClass}>{content}</div>
      )}
    </li>
  );
}
