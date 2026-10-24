// Last beat: the deer tick (Ixodes scapularis) life cycle, clockwise from top left.
// Ported from reference/capture-preview.html; facts and sources in reference/lifecycle-facts.md.
// Fixed game colours on purpose (see draw-kit.ts).
import type { TickStage } from "@/lib/tickdex";
import { drawCaption, type DiagramInfo } from "./diagram-caption";
import { drawEggs, type DiagramSprites } from "./diagram-sprites";
import { blit, drawTick, mix, roundRect, type CanvasFonts, type Ctx } from "./draw-kit";
import { clamp, eBack, eOut, GROUND_Y, lerp, seg, TICK, W } from "./timeline";

const RING = { x: 180, y: 366, r: 118 };
const NODE_R = 27;
const NAVY = "#26418f";
const RED = "#b8232b";
const GOLD = "#e2b23c";
export const PAPER = "#fbf8ef";
const INK = "#1d2a1c";
const MUTED = "#66705f";

type NodeKey = "egg" | TickStage;
type DexNode = {
  key: NodeKey;
  title: string;
  sub: string;
  a: number;
  host?: "mouse" | "deer";
  tick?: { s: number; fed: number; legs?: number };
  n: number;
  x: number;
  y: number;
  top: boolean;
  outX: number;
};

const NODES: DexNode[] = [
  { key: "egg" as const, title: "Eggs", sub: "in leaf litter", a: -0.75 * Math.PI },
  { key: "larva" as const, title: "Larva", sub: "mice & birds", a: -0.25 * Math.PI, host: "mouse" as const, tick: { s: 0.36, fed: 0.1, legs: 3 } },
  { key: "nymph" as const, title: "Nymph", sub: "tiny, bites people", a: 0.25 * Math.PI, host: "mouse" as const, tick: { s: 0.5, fed: 0.25 } },
  { key: "adult" as const, title: "Adult", sub: "feeds on deer", a: 0.75 * Math.PI, host: "deer" as const, tick: { s: 0.68, fed: 0.5 } },
].map((nd, i) => {
  const x = RING.x + Math.cos(nd.a) * RING.r;
  const y = RING.y + Math.sin(nd.a) * RING.r;
  return { ...nd, n: i + 1, x, y, top: y < RING.y, outX: x < RING.x ? -1 : 1 };
});
const NODE_BY = Object.fromEntries(NODES.map((nd) => [nd.key, nd])) as Record<NodeKey, DexNode>;
// Only nymphs and adult females pass Lyme to people, so only they get a red arrow
const BITES = (["nymph", "adult"] as const).map((key) => {
  const nd = NODE_BY[key];
  const to = { x: RING.x + nd.outX * 22, y: 408 };
  const dx = to.x - nd.x;
  const dy = to.y - nd.y;
  const len = Math.hypot(dx, dy);
  return { key, from: { x: nd.x + (dx / len) * (NODE_R + 4), y: nd.y + (dy / len) * (NODE_R + 4) }, to };
});
// u = seconds into the beat at 1x (see lifecycle-design.md)
const NODE_AT = [0.4, 0.72, 1.04, 1.36];
const ARROW_AT = [0.48, 0.8, 1.12, 1.44];
const POP_DUR = 0.22;
const ARROW_DUR = 0.24;
const BITE_AT = 1.75;
const BITE_DUR = 0.22;
const MARK_AT = 2.05;

const BREATHE_AT = 2.3;
const GAP0 = (NODE_R + 6) / RING.r;
const GAP1 = (NODE_R + 12) / RING.r;
const WALKER: { s: number; legs?: number }[] = [{ s: 0.24, legs: 3 }, { s: 0.24, legs: 3 }, { s: 0.31 }, { s: 0.38 }];

function arrowHead(c: Ctx, x: number, y: number, ang: number, size: number, fill: string): void {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(size, 0);
  c.lineTo(-size * 0.7, -size * 0.75);
  c.lineTo(-size * 0.3, 0);
  c.lineTo(-size * 0.7, size * 0.75);
  c.closePath();
  c.fill();
  c.restore();
}
const breath = (u: number): number => (u < BREATHE_AT ? 0 : 0.5 - 0.5 * Math.cos(((u - BREATHE_AT) * Math.PI * 2) / 1.4));

function drawCycleArrows(c: Ctx, u: number): void {
  c.save();
  c.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const p = seg(u, ARROW_AT[i], ARROW_AT[i] + ARROW_DUR);
    if (p <= 0) continue;
    const a0 = NODES[i].a + GAP0;
    const a1 = a0 + (Math.PI / 2 - GAP0 - GAP1) * p;
    c.strokeStyle = NAVY;
    c.lineWidth = 3.5;
    c.beginPath();
    c.arc(RING.x, RING.y, RING.r, a0, a1);
    c.stroke();
    const hx = RING.x + Math.cos(a1) * RING.r;
    const hy = RING.y + Math.sin(a1) * RING.r;
    const headA = seg(p, 0.85, 1);
    if (headA > 0) {
      c.globalAlpha = headA;
      arrowHead(c, hx, hy, a1 + Math.PI / 2, 8, NAVY);
      c.globalAlpha = 1;
    }
    // the walker: a tiny tick riding the arrow, bigger after each molt
    const wa = clamp(p / 0.12) * clamp((1 - p) / 0.15);
    if (wa > 0) {
      const wk = WALKER[i];
      c.globalAlpha = wa;
      c.fillStyle = PAPER;
      c.beginPath();
      c.arc(hx, hy, 6 + wk.s * 22, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = NAVY;
      c.lineWidth = 1.5;
      c.stroke();
      c.save();
      c.translate(hx, hy);
      c.rotate(a1 + Math.PI);
      drawTick(c, 0, 0, wk.s, { phase: u * 2, fed: 0.2, legs: wk.legs || 4 });
      c.restore();
      c.globalAlpha = 1;
    }
  }
  c.restore();
}

function drawNode(c: Ctx, spr: DiagramSprites, nd: DexNode, u: number, scanned: boolean): void {
  const i = nd.n - 1;
  const p = seg(u, NODE_AT[i], NODE_AT[i] + POP_DUR);
  if (p <= 0) return;
  let k = eBack(p);
  if (nd.key === "egg") k *= 1 + 0.1 * Math.sin(seg(u, 1.66, 1.88) * Math.PI); // the walker comes home
  const a = clamp(p * 2);
  const b = scanned ? breath(u) : 0;
  // the scanned stage looks like the others until the "you are here" moment
  const hl = scanned ? eOut(seg(u, MARK_AT - 0.08, MARK_AT + 0.17)) : 0;
  c.save();
  c.translate(nd.x, nd.y);
  if (hl > 0) {
    c.strokeStyle = `rgba(226,178,60,${hl * (0.65 - 0.35 * b)})`;
    c.lineWidth = 2.5;
    c.beginPath();
    c.arc(0, 0, NODE_R + 5 + 4 * b, 0, Math.PI * 2);
    c.stroke();
  }
  c.scale(k, k);
  c.globalAlpha = a;
  c.fillStyle = mix("#f1ebdc", "#fff3cf", hl);
  c.beginPath();
  c.arc(0, 0, NODE_R, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = lerp(1.5, 3, hl);
  c.strokeStyle = mix("#d6ccb2", GOLD, hl);
  c.stroke();
  if (nd.key === "egg") {
    blit(c, spr.leaves, 0, 4);
    drawEggs(c, 0, -1);
  } else if (nd.tick) {
    c.globalAlpha = a * lerp(0.82, 1, hl);
    drawTick(c, 0, 2, nd.tick.s, { fed: nd.tick.fed, legs: nd.tick.legs || 4, phase: 0.3 });
    c.globalAlpha = a;
  }
  if (nd.host) {
    const hx = nd.outX * 34;
    const hy = nd.top ? 15 : -15;
    c.fillStyle = "#ffffff";
    c.strokeStyle = "#d6ccb2";
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(hx, hy, 15.5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    blit(c, spr[nd.host], hx, hy);
  }
  c.restore();
}

function drawLabel(c: Ctx, fonts: CanvasFonts, nd: DexNode, u: number): void {
  const i = nd.n - 1;
  const a = seg(u, NODE_AT[i] + 0.08, NODE_AT[i] + 0.3);
  if (a <= 0) return;
  const y = nd.top ? nd.y - 69 : nd.y + 61;
  c.save();
  c.globalAlpha = a;
  c.textAlign = "center";
  c.textBaseline = "middle";
  // numbered like the CDC figure: a navy badge in front of the stage name
  c.font = `700 12.5px ${fonts.body}`;
  const tw = c.measureText(nd.title).width;
  const x0 = nd.x - (tw + 21) / 2;
  c.fillStyle = NAVY;
  c.beginPath();
  c.arc(x0 + 8, y, 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffffff";
  c.font = `700 10.5px ${fonts.body}`;
  c.fillText(String(nd.n), x0 + 8, y + 0.5);
  c.fillStyle = INK;
  c.font = `700 12.5px ${fonts.body}`;
  c.textAlign = "left";
  c.fillText(nd.title, x0 + 21, y);
  c.textAlign = "center";
  c.fillStyle = "#4f5947";
  c.font = `500 11.5px ${fonts.body}`;
  c.fillText(nd.sub, nd.x, y + 14.5);
  c.restore();
}

function drawBites(c: Ctx, u: number, scannedKey: TickStage): void {
  const order = BITES.filter((b) => b.key !== scannedKey).concat(BITES.filter((b) => b.key === scannedKey));
  for (const bt of order) {
    const strong = bt.key === scannedKey;
    const start = BITE_AT + (strong ? BITE_DUR : 0);
    const p = eOut(seg(u, start, start + BITE_DUR));
    if (p <= 0) continue;
    const x = lerp(bt.from.x, bt.to.x, p);
    const y = lerp(bt.from.y, bt.to.y, p);
    const ang = Math.atan2(bt.to.y - bt.from.y, bt.to.x - bt.from.x);
    c.save();
    c.lineCap = "round";
    c.globalAlpha = strong ? 1 : 0.7;
    if (strong) {
      c.shadowColor = "rgba(220,40,40,.75)";
      c.shadowBlur = 6 + 8 * breath(u);
    }
    c.strokeStyle = RED;
    c.lineWidth = strong ? 4.5 : 3.5;
    c.beginPath();
    c.moveTo(bt.from.x, bt.from.y);
    c.lineTo(x - Math.cos(ang) * 5, y - Math.sin(ang) * 5);
    c.stroke();
    arrowHead(c, x, y, ang, strong ? 9 : 8, RED);
    c.restore();
    const land = seg(u, start + BITE_DUR, start + BITE_DUR + 0.4);
    if (strong && land > 0 && land < 1) {
      c.strokeStyle = `rgba(184,35,43,${0.8 * (1 - land)})`;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(bt.to.x, bt.to.y, 6 + 20 * eOut(land), 0, Math.PI * 2);
      c.stroke();
    }
  }
}

function drawRibbon(c: Ctx, fonts: CanvasFonts, nd: DexNode, u: number): void {
  const p = seg(u, MARK_AT, MARK_AT + 0.25);
  if (p <= 0) return;
  c.save();
  c.translate(nd.x, nd.top ? nd.y - NODE_R - 12 : nd.y + NODE_R + 12);
  const k = eBack(p);
  c.scale(k, k);
  c.font = `700 10.5px ${fonts.body}`;
  const w = c.measureText("Your tick").width + 16;
  c.fillStyle = GOLD;
  roundRect(c, -w / 2, -8.5, w, 17, 8.5);
  c.fill();
  c.strokeStyle = PAPER;
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = "#3b2a05";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText("Your tick", 0, 0.5);
  c.restore();
}

// u: seconds into the beat at 1x. wipeR: radius that covers every visible corner from the vial.
export function drawDiagram(c: Ctx, fonts: CanvasFonts, spr: DiagramSprites, info: DiagramInfo, u: number, wipeR: number): void {
  // paper wipes in from the vial
  const wipe = eOut(seg(u, 0, 0.45));
  if (wipe <= 0) return;
  c.fillStyle = PAPER;
  c.beginPath();
  c.arc(TICK.x, GROUND_Y, wipeR * wipe, 0, Math.PI * 2);
  c.fill();
  if (wipe < 1) {
    c.strokeStyle = `rgba(98,197,138,${1 - wipe})`;
    c.lineWidth = 6;
    c.beginPath();
    c.arc(TICK.x, GROUND_Y, wipeR * wipe, 0, Math.PI * 2);
    c.stroke();
  }
  const head = seg(u, 0.25, 0.5);
  if (head > 0) {
    c.save();
    c.globalAlpha = head;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `500 10.5px ${fonts.mono}`;
    c.fillStyle = "#7a7560";
    c.fillText(info.heading, W / 2, 148);
    c.font = `19px ${fonts.display}`;
    c.fillStyle = INK;
    c.fillText("Deer tick life cycle", W / 2, 174);
    c.font = `500 11px ${fonts.body}`;
    c.fillStyle = MUTED;
    c.fillText("About 2 years · not to scale", W / 2, 193);
    c.strokeStyle = "#e2d9c3";
    c.lineWidth = 1.5;
    c.setLineDash([3, 6]);
    c.beginPath();
    c.arc(RING.x, RING.y, RING.r, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  drawCycleArrows(c, u);
  const hp = eOut(seg(u, 1.55, 1.8));
  if (hp > 0) {
    c.save();
    c.globalAlpha = hp;
    blit(c, spr.human, RING.x, RING.y + (1 - hp) * 10);
    c.restore();
  }
  drawBites(c, u, info.stage);
  // key for the red arrows, right under the person
  const key = seg(u, BITE_AT + 0.1, BITE_AT + 0.35);
  if (key > 0) {
    c.save();
    c.globalAlpha = key;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `700 10.5px ${fonts.body}`;
    c.fillStyle = RED;
    c.fillText("can pass", RING.x, 440);
    c.fillText("Lyme to you", RING.x, 453);
    c.restore();
  }
  for (const nd of NODES) {
    drawNode(c, spr, nd, u, nd.key === info.stage);
    drawLabel(c, fonts, nd, u);
  }
  const scanned = NODE_BY[info.stage];
  drawRibbon(c, fonts, scanned, u);
  if (!BITES.some((b) => b.key === info.stage)) {
    const land = seg(u, BITE_AT + 2 * BITE_DUR, BITE_AT + 2 * BITE_DUR + 0.4);
    if (land > 0 && land < 1) {
      c.strokeStyle = `rgba(226,178,60,${0.9 * (1 - land)})`;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(scanned.x, scanned.y, NODE_R + 4 + 18 * eOut(land), 0, Math.PI * 2);
      c.stroke();
    }
  }
  drawCaption(c, fonts, info, u);
}
