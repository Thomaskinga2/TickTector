import { Tick } from "@/components/tick";
import { cn } from "@/lib/utils";

// Tick on patrol: crawls along a dotted trail, turns around at each end and walks back.
// Decorative (aria-hidden) and placed only in open space at the end of a page. Sits still under Reduce Motion.
export function TickCrawler({ className, seconds = 18 }: { className?: string; seconds?: number }) {
  return (
    <div aria-hidden className={cn("tick-trail relative h-10", className)}>
      <div className="tick-crawler absolute top-1/2 left-0" style={{ animationDuration: `${seconds}s` }}>
        <Tick size={28} motion="search" />
      </div>
    </div>
  );
}
