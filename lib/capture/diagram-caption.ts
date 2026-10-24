// The one-line result under the life-cycle diagram. Fixed game colours (see draw-kit.ts).
import type { TickStage } from "@/lib/tickdex";
import { roundRect, type CanvasFonts, type Ctx } from "./draw-kit";
import { eOut, seg, W } from "./timeline";

const INK = "#1d2a1c";
export const CAPTION_AT = 2.15;

// Stage names and risk copy for the result line
export const STAGE_COPY: Record<TickStage, { name: string; risk: string; note?: string }> = {
  larva: { name: "larva", risk: "Very low risk", note: "Larvae hatch Lyme-free, so no red arrow from stage 2." },
  nymph: { name: "nymph", risk: "Low risk" },
  adult: { name: "adult female", risk: "Low risk" },
};

export type DiagramInfo = {
  stage: TickStage;
  heading: string; // "TICKDEX · NO. 003 · NEW SPECIES"
  captionLine: string; // "Likely deer tick · adult female · partly fed"
  footer: string | null; // small mono line under the caption
};

export function drawCaption(c: Ctx, fonts: CanvasFonts, info: DiagramInfo, u: number): void {
  const p = eOut(seg(u, CAPTION_AT, CAPTION_AT + 0.35));
  if (p <= 0) return;
  const sm = STAGE_COPY[info.stage];
  c.save();
  c.globalAlpha = p;
  c.translate(0, (1 - p) * 12);
  c.textBaseline = "middle";
  c.textAlign = "left";
  const line = info.captionLine;
  c.font = `600 12px ${fonts.body}`;
  const tw = c.measureText(line).width;
  c.font = `700 11px ${fonts.body}`;
  const pw = c.measureText(sm.risk).width + 16;
  const x0 = (W - tw - 8 - pw) / 2;
  c.font = `600 12px ${fonts.body}`;
  c.fillStyle = INK;
  c.fillText(line, x0, 562);
  c.fillStyle = "#dcefe2";
  roundRect(c, x0 + tw + 8, 552, pw, 20, 10);
  c.fill();
  c.font = `700 11px ${fonts.body}`;
  c.fillStyle = "#1f6b3f";
  c.fillText(sm.risk, x0 + tw + 16, 562.5);
  const lead = "Watch for ";
  const rest = "a spreading rash, fever or aches";
  c.font = `700 12px ${fonts.body}`;
  const lw = c.measureText(lead).width;
  c.font = `500 12px ${fonts.body}`;
  const rw = c.measureText(rest).width;
  const x1 = (W - lw - rw) / 2;
  c.font = `700 12px ${fonts.body}`;
  c.fillStyle = "#9a3a1a";
  c.fillText(lead, x1, 588);
  c.font = `500 12px ${fonts.body}`;
  c.fillStyle = "#3b4436";
  c.fillText(rest, x1 + lw, 588);
  c.textAlign = "center";
  c.fillText("over the next 30 days.", W / 2, 604);
  if (sm.note) {
    c.font = `600 11.5px ${fonts.body}`;
    c.fillStyle = "#4f5947";
    c.fillText(sm.note, W / 2, 624);
  }
  if (info.footer) {
    c.font = `500 10px ${fonts.mono}`;
    c.fillStyle = "#8a8570";
    c.fillText(info.footer, W / 2, 648);
  }
  c.restore();
}
