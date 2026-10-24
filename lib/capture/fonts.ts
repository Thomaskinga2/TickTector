// The three canvas faces of the capture animation, self-hosted through next/font.
import { Figtree, IBM_Plex_Mono, Lilita_One } from "next/font/google";
import type { CanvasFonts } from "./draw-kit";

const display = Lilita_One({ weight: "400", subsets: ["latin"], variable: "--font-capture-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-capture-body" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-capture-mono" });

// Put on an element so the @font-face rules are in the page
export const captureFontVars = `${display.variable} ${body.variable} ${mono.variable}`;

// next/font may rename a family; the canvas needs the name the @font-face rule really uses
const family = (f: { style: { fontFamily: string } }): string => f.style.fontFamily.split(",")[0].trim();

export const CAPTURE_FONTS: CanvasFonts = {
  display: `${family(display)}, system-ui, sans-serif`,
  body: `${family(body)}, system-ui, sans-serif`,
  mono: `${family(mono)}, monospace`,
};

// Every face the canvas draws with, loaded before the first frame so none draws in a fallback
const FACES = [
  `20px ${family(display)}`,
  `500 11px ${family(body)}`,
  `600 12px ${family(body)}`,
  `700 12px ${family(body)}`,
  `400 12px ${family(mono)}`,
  `500 10px ${family(mono)}`,
];
// Offline or blocked fonts must not freeze the scan: give up waiting after this long
const FONT_WAIT_MS = 4000;

let loading: Promise<void> | null = null;
export function loadCaptureFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  loading ??= Promise.race([
    Promise.all(FACES.map((face) => document.fonts.load(face))).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, FONT_WAIT_MS)),
  ]).catch(() => undefined);
  return loading;
}
