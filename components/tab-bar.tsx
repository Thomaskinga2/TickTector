"use client";

import { Suspense, useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, House, Map, MessagesSquare } from "lucide-react";
import { ScanTickIcon } from "@/components/tick-icon";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;

const TABS: { href: string; label: string; icon: Icon }[] = [
  { href: "/", label: "Towns", icon: House },
  { href: "/map", label: "Map", icon: Map },
  { href: "/scan", label: "Scan", icon: ScanTickIcon },
  { href: "/forum", label: "Sightings", icon: MessagesSquare },
  { href: "/quest", label: "Quest", icon: Compass },
];

// iOS 26/27 tab bar: a floating Liquid Glass capsule above the home indicator. Town pages belong to Towns.
// Compose sheets hide it.
// usePathname suspends on dynamic routes under Cache Components; while it does, the bar keeps the last selection
// instead of blanking the lozenge (which made it blink on every navigation).
let lastActive = -1;

export function TabBar() {
  return (
    <Suspense fallback={<Bar active={lastActive} />}>
      <ActiveBar />
    </Suspense>
  );
}

// Whole segments only, so "/map" never claims a "/mapping" page.
const inTab = (path: string, href: string) =>
  href === "/" ? path === "/" || path.startsWith("/area/") : path === href || path.startsWith(`${href}/`);

function ActiveBar() {
  const path = usePathname();
  // A tap selects its tab at once; the route can take a beat to load. It only counts while we're still on the
  // page it was tapped from, so the URL takes over again as soon as the navigation lands.
  const [picked, setPicked] = useState<{ index: number; from: string } | null>(null);
  // Once the URL moves on, the tap has done its job. Forgetting it means going Back to that page shows its own tab.
  if (picked && picked.from !== path) setPicked(null);
  const active = picked?.from === path ? picked.index : TABS.findIndex(({ href }) => inTab(path, href));
  // Counts selection changes after the first render, so the picked icon hops on a change but not on page load.
  const [hop, setHop] = useState({ index: active, count: 0 });
  if (hop.index !== active) setHop({ index: active, count: hop.count + 1 });
  useEffect(() => {
    lastActive = active;
  }, [active]);
  if (path === "/forum/new") return null;
  return <Bar active={active} hop={hop.count} path={path} onPick={(index) => setPicked({ index, from: path })} />;
}

// The lozenge slide and the icon hop are CSS (globals.css, .tab-bar-lozenge / .tab-hop), not Motion: they play
// while the next page is being swapped in, when the main thread is busy, and JS-driven frames stalled there.
function Bar({ active, hop = 0, path, onPick }: { active: number; hop?: number; path?: string; onPick?: (index: number) => void }) {
  return (
    <>
      <nav
        aria-label="Tabs"
        className="fixed inset-x-0 bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))] z-50 flex justify-center px-4"
      >
        {/* Anchored: the tab bar stays put while the page underneath cross-fades. The name sits on the glass itself:
            on the <nav> it would make the nav a backdrop root, and the glass would stop blurring the page behind it. */}
        {/* The shadow sits beside the glass with its own transition snapshot (globals.css, .tab-bar-shadow). */}
        <div className="relative w-full max-w-md">
        <span aria-hidden style={{ viewTransitionName: "tab-bar-shadow" }} className="tab-bar-shadow" />
        <div style={{ viewTransitionName: "tab-bar" }} className="tab-bar glass relative rounded-full p-1">
          {/* The selection lozenge springs to the picked tab; a CSS transition, so a new pick retargets it mid-flight. */}
          <span
            aria-hidden
            className="tab-bar-lozenge"
            style={{ transform: `translateX(${Math.max(active, 0) * 100}%)`, opacity: active < 0 ? 0 : 1 }}
          />
          <ul className="relative grid grid-cols-5">
          {TABS.map(({ href, label, icon: Icon }, i) => {
            const current = i === active;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  onClick={(e) => {
                    // New-tab clicks and the like are the browser's.
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    // Tapping the tab you're already on scrolls back to the top, as on iOS.
                    if (path === href) {
                      e.preventDefault();
                      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
                      return;
                    }
                    onPick?.(i);
                  }}
                  className={cn(
                    "pressable relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-full type-caption2 font-medium",
                    current ? "text-primary" : "text-foreground/80",
                  )}
                >
                  {/* The icon does a little hop when its tab is picked: a new key per pick restarts the animation. */}
                  <span key={current ? hop : -1} className={cn(current && hop > 0 && "tab-hop")}>
                    <Icon className="size-6" strokeWidth={current ? 2.3 : 1.8} aria-hidden />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
          </ul>
        </div>
        </div>
      </nav>
    </>
  );
}
