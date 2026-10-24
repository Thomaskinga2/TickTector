// The canvas faces of the capture animation: TickTector's own system type, so the game reads as part of the app.
// Display is SF Pro Rounded (heavy, set at each call site), body SF Pro, mono SF Mono; other platforms fall back.
import type { CanvasFonts } from "./draw-kit";

export const CAPTURE_FONTS: CanvasFonts = {
  display: 'ui-rounded, "SF Pro Rounded", system-ui, -apple-system, sans-serif',
  body: 'system-ui, -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

// System faces are already installed, so there is nothing to wait for. Kept so callers can still warm up first.
export function loadCaptureFonts(): Promise<void> {
  return Promise.resolve();
}
