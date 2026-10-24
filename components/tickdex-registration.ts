// The Tickdex "registered" moment, played with the Web Animations API (timings in reference/tickdex-design.md).
// "new": the card flips from silhouette to caught, glows gold and stamps NEW!. "repeat": a short gold pulse and +1.
export type RegistrationKind = "new" | "repeat";

export type RegistrationTargets = {
  root: HTMLElement; // scrolled into view
  inner: HTMLElement; // the 3D layer holding both faces
  face: HTMLElement; // the caught face, which carries the glow
  badge: HTMLElement | null; // NEW! or +1
};

const SCROLL_WAIT_MS = 350;
const BOTTOM_NAV_PX = 64;
const FLIP_MS = 560;
const GLOW_MS = 720;
const PULSE_MS = 450;
const GOLD = "rgb(226 178 60 /";
const REST_GLOW = `0 0 0 2px ${GOLD} 1), 0 6px 16px -8px ${GOLD} 0.9)`;
const PEAK_GLOW = `0 0 0 6px ${GOLD} 0.55), 0 0 28px 6px ${GOLD} 0.7)`;
const NO_GLOW = `0 0 0 0 ${GOLD} 0), 0 0 0 0 ${GOLD} 0)`;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Catches already celebrated in this page session. Effects re-run when a hidden route is shown again,
// and the moment should play once per catch.
const played = new Set<string>();

// Starts the moment and returns a function that cancels it (for effect cleanup).
export function playRegistration(kind: RegistrationKind, entryId: string, t: RegistrationTargets): () => void {
  if (played.has(entryId)) return () => {};
  const reduced = prefersReducedMotion();
  scrollToCenter(t.root, reduced);
  const wait = reduced ? 0 : SCROLL_WAIT_MS;
  const animations = reduced ? playReduced(kind, t) : kind === "new" ? playFlip(t, wait) : playPulse(t, wait);
  // Count it as played once it has run; a cleanup before then (React Strict Mode re-runs effects) lets it replay.
  void Promise.all(animations.map((a) => a.finished)).then(
    () => played.add(entryId),
    () => {}, // cancelled
  );
  return () => animations.forEach((a) => a.cancel());
}

// Centres the card in the space above the bottom nav (scrollIntoView would ignore the nav).
function scrollToCenter(el: HTMLElement, reduced: boolean) {
  const rect = el.getBoundingClientRect();
  const visible = window.innerHeight - BOTTOM_NAV_PX;
  const top = Math.max(0, window.scrollY + rect.top - (visible - rect.height) / 2);
  if (Math.abs(top - window.scrollY) < 8) return;
  window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
}

function playFlip(t: RegistrationTargets, wait: number): Animation[] {
  const flip = t.inner.animate(
    [
      { transform: "rotateY(180deg) scale(1)" },
      { transform: "rotateY(80deg) scale(1.08)", offset: 0.45 },
      { transform: "rotateY(0deg) scale(1)" },
    ],
    { duration: FLIP_MS, delay: wait, easing: "cubic-bezier(.3,.7,.2,1)", fill: "backwards" },
  );
  return [flip, glow(t.face, wait + 380), stamp(t.badge, wait + 480)].filter((a): a is Animation => a !== null);
}

function playPulse(t: RegistrationTargets, wait: number): Animation[] {
  const pulse = t.inner.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.05)", offset: 0.4 }, { transform: "scale(1)" }],
    { duration: PULSE_MS, delay: wait, easing: "ease-out" },
  );
  return [pulse, glow(t.face, wait), stamp(t.badge, wait + 150)].filter((a): a is Animation => a !== null);
}

function glow(face: HTMLElement, delay: number): Animation {
  return face.animate([{ boxShadow: NO_GLOW }, { boxShadow: PEAK_GLOW, offset: 0.35 }, { boxShadow: REST_GLOW }], {
    duration: GLOW_MS,
    delay,
    easing: "ease-out",
  });
}

function stamp(badge: HTMLElement | null, delay: number): Animation | null {
  if (!badge) return null;
  return badge.animate(
    [
      { opacity: 0, transform: "rotate(-8deg) scale(1.8)" },
      { opacity: 1, transform: "rotate(-8deg) scale(0.92)", offset: 0.7 },
      { opacity: 1, transform: "rotate(-8deg) scale(1)" },
    ],
    { duration: 320, delay, easing: "ease-out", fill: "backwards" },
  );
}

function playReduced(kind: RegistrationKind, t: RegistrationTargets): Animation[] {
  const fade = kind === "new" ? t.face.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease-out" }) : null;
  return [fade].filter((a): a is Animation => a !== null);
}
