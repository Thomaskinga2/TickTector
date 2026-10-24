// One frame of the capture animation, drawn from a single time value. Ported from the render()
// of reference/capture-preview.html. Fixed game colours on purpose (see draw-kit.ts).
import { drawClamped, gradePhoto } from "./backdrop";
import type { DiagramSprites } from "./diagram-sprites";
import type { DiagramInfo } from "./diagram-caption";
import { drawDiagram } from "./draw-diagram";
import { brackets, drawVial, pill, roundRect, rng, stampText, star, type CanvasFonts, type Ctx } from "./draw-kit";
import { drawBiteHalo, drawTick3d, drawTick3dShadow, type Tick3dLook } from "./draw-tick-3d";
import { blendMapping, openingClip, RING_LOCK, SURROUND, type Circle, type Mapping, type Point, type SceneView } from "./framing";
import { biteAt, tickPose, vialPose } from "./poses";
import {
  clamp,
  DROP,
  eBack,
  eBounce,
  eIn,
  eInOut,
  eOut,
  GROUND_Y,
  grade,
  HIT,
  HOVER_Y,
  IN,
  lerp,
  OPEN_LEN,
  POP,
  ringAt,
  seg,
  TICK,
  TUG,
  WOBBLE,
  type Timeline,
} from "./timeline";

export type SceneAssets = {
  view: SceneView;
  dpr: number;
  fonts: CanvasFonts;
  sprites: DiagramSprites;
  backdrop: HTMLCanvasElement; // the clean photo, or the painted forearm
  wipeR: number;
};

export type SceneText = {
  pills: [string, string];
  plateTitle: string | null; // null while the API is still identifying
  plateSub: string;
  diagram: DiagramInfo;
  look: Tick3dLook; // the simulated tick, drawn where the opening left it
};

// The viewfinder circle opening out. The source is drawn with a mapping that blends from the
// viewfinder framing to the scene framing; graded sources fade in the photo grade as it opens.
export type Opening = {
  source: CanvasImageSource;
  srcW: number;
  srcH: number;
  from: Mapping;
  to: Mapping;
  anchor: Point;
  circleSrc: Circle;
  r0: number;
  graded: boolean;
};

function drawOpening(c: Ctx, op: Opening, a: SceneAssets, e: number): void {
  const { sw, sh } = a.view;
  const m = blendMapping(op.from, op.to, op.anchor, e);
  const clip = openingClip(op.circleSrc, m, op.r0, e, sw, sh);
  c.fillStyle = SURROUND;
  c.fillRect(0, 0, sw, sh);
  c.save();
  c.beginPath();
  c.arc(clip.x, clip.y, clip.r, 0, Math.PI * 2);
  c.clip();
  drawClamped(c, op.source, op.srcW, op.srcH, m, sw, sh);
  if (op.graded) gradePhoto(c, a.view, a.dpr, e);
  c.restore();
  if (e < 1) {
    c.strokeStyle = RING_LOCK;
    c.globalAlpha = 1 - e;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(clip.x, clip.y, clip.r + 1.5, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
}

// T: app time (the opening, then the scene). The canvas is the whole screen at a.dpr.
export function renderFrame(c: Ctx, T: number, L: Timeline, a: SceneAssets, text: SceneText, opening: Opening | null): void {
  const { view: v, dpr } = a;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (T < OPEN_LEN && opening) {
    drawOpening(c, opening, a, eOut(clamp(T / OPEN_LEN)));
    return;
  }
  const t = Math.min(T - OPEN_LEN, L.end);
  c.drawImage(a.backdrop, 0, 0, v.sw, v.sh);
  c.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.ox, dpr * v.oy);
  renderScene(c, t, L, a, text);
}

function renderScene(c: Ctx, t: number, L: Timeline, a: SceneAssets, text: SceneText): void {
  const f = a.fonts;
  const r = a.view.rect;
  const pw = pill(c, f, 16, 52, text.pills[0], "#2f7d4f");
  pill(c, f, 16 + pw + 8, 52, text.pills[1]);

  // redness around the bite, then the bite mark once the tick is out
  const look = text.look;
  const sc = Math.max(0.6, look.scale);
  const bite = biteAt(look);
  drawBiteHalo(c, bite.x, bite.y, look.scale);
  if (t >= POP) {
    c.fillStyle = "#8e1f1a";
    c.beginPath();
    c.arc(bite.x, bite.y, 2.6 * sc, 0, Math.PI * 2);
    c.fill();
  }

  // skin tenting while the mouthparts are pulled
  const tent = t >= TUG && t < POP + 0.08 ? Math.sin(seg(t, TUG, POP + 0.08) * Math.PI) : 0;
  if (tent > 0) {
    c.fillStyle = `rgba(255,220,195,${0.7 * tent})`;
    c.beginPath();
    c.ellipse(bite.x, bite.y - 4 * tent * sc, 10 * sc, (6 * tent + 2) * sc, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = `rgba(150,70,50,${0.4 * tent})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(bite.x, bite.y + 2 * sc, 13 * sc, 5 * sc, 0, 0, Math.PI);
    c.stroke();
  }

  // the tick's shadow on the skin, fading as it is lifted off
  const tp = tickPose(t, look);
  const posed = tp ? { ...look, scale: look.scale * tp.s, angle: tp.rot } : null;
  if (tp && posed) drawTick3dShadow(c, tp.x, tp.y, posed, { lift: tp.lift, phase: tp.phase });

  // camera lock-on
  const lock = eOut(seg(t, 0.12, 0.55));
  const lockA = seg(t, 0.08, 0.2) * (1 - seg(t, 0.9, 1.1));
  if (lockA > 0) brackets(c, TICK.x, TICK.y - 4, lerp(150, 72, lock), lockA);
  if (t > 0.15 && t < 0.42) {
    c.font = `600 12px ${f.mono}`;
    c.textAlign = "center";
    c.fillStyle = "#ffffff";
    c.fillText("IDENTIFYING" + ".".repeat(1 + (Math.floor(t * 12) % 3)), TICK.x, TICK.y + 100);
  }

  const plateA = clamp(seg(t, 0.4, 0.55) * (1 - seg(t, HIT, HIT + 0.25)));
  if (plateA > 0) {
    c.globalAlpha = plateA;
    c.fillStyle = "rgba(255,255,255,.92)";
    roundRect(c, TICK.x - 96, 200, 192, 42, 12);
    c.fill();
    c.fillStyle = "#1d2a1c";
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (text.plateTitle) {
      c.font = `20px ${f.display}`;
      c.fillText(text.plateTitle, TICK.x, 216);
      c.font = `500 10px ${f.mono}`;
      c.fillStyle = "#9a3a1a";
      c.fillText(text.plateSub, TICK.x, 233);
    } else {
      c.font = `18px ${f.display}`;
      c.fillText("Identifying" + ".".repeat(1 + (Math.floor(t * 4) % 3)), TICK.x, 221);
    }
    c.globalAlpha = 1;
  }

  // target ring
  const ringR = ringAt(Math.min(t, HIT));
  const ringA = seg(t, 0.25, 0.5) * (1 - seg(t, HIT, HIT + 0.12));
  if (ringA > 0) {
    c.globalAlpha = ringA;
    c.lineWidth = 2;
    c.strokeStyle = "rgba(255,255,255,.85)";
    c.beginPath();
    c.arc(TICK.x, TICK.y, 62, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 4.5;
    c.strokeStyle = ringR <= 28 ? "#ffb020" : ringR <= 42 ? "#ffd23f" : "#9be15d";
    c.beginPath();
    c.arc(TICK.x, TICK.y, ringR, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }

  // pop: the moment the mouthparts come free
  const pop = seg(t, POP, POP + 0.3);
  if (pop > 0 && pop < 1) {
    c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - pop)})`;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(bite.x, bite.y, 6 + 26 * eOut(pop), 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = `rgba(255,255,255,${1 - pop})`;
    c.lineWidth = 2.5;
    for (let i = 0; i < 6; i++) {
      const an = (i * Math.PI) / 3 + 0.3;
      const r0 = 10 + 14 * eOut(pop);
      const r1 = r0 + 8;
      c.beginPath();
      c.moveTo(bite.x + Math.cos(an) * r0, bite.y + Math.sin(an) * r0);
      c.lineTo(bite.x + Math.cos(an) * r1, bite.y + Math.sin(an) * r1);
      c.stroke();
    }
  }
  if (t >= POP - 0.02 && t < POP + 0.35) {
    stampText(c, f, "POP!", TICK.x + 58, bite.y - 20 - 18 * eOut(pop), 24, "#ffffff", "#9a3a1a", eBack(seg(t, POP, POP + 0.15)), 1 - seg(t, POP + 0.25, POP + 0.35));
  }

  // tractor beam, strongest once the tick is free
  const beam = seg(t, 1.66, 1.82) * (1 - seg(t, IN - 0.05, IN + 0.05)) * (t < TUG ? 1 : t < POP ? 0.6 : 1);
  if (beam > 0) {
    const g = c.createLinearGradient(0, HOVER_Y - 22, 0, TICK.y + 20);
    g.addColorStop(0, `rgba(200,255,220,${0.85 * beam})`);
    g.addColorStop(1, `rgba(110,240,160,${0.15 * beam})`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(TICK.x - 6, HOVER_Y - 22);
    c.lineTo(TICK.x + 6, HOVER_Y - 22);
    c.lineTo(TICK.x + 34, TICK.y + 22);
    c.lineTo(TICK.x - 34, TICK.y + 22);
    c.closePath();
    c.fill();
    const R = rng(3);
    c.fillStyle = `rgba(230,255,238,${beam})`;
    for (let i = 0; i < 14; i++) {
      const an = R() * Math.PI * 2;
      const d = 30 + R() * 30;
      const off = R();
      const p = ((t - 1.66) * 1.8 + off) % 1;
      const px = lerp(TICK.x + Math.cos(an) * d, TICK.x, eIn(p));
      const py = lerp(TICK.y + Math.sin(an) * d * 0.6, HOVER_Y - 22, eIn(p));
      c.beginPath();
      c.arc(px, py, 2.2 * (1 - p * 0.6), 0, Math.PI * 2);
      c.fill();
    }
  }

  if (tp && posed) drawTick3d(c, tp.x, tp.y, posed, { glow: tp.glow, phase: tp.phase, stretch: tp.stretch });

  // camera shutter
  const shut = seg(t, 0, 0.22);
  if (shut < 1) {
    c.fillStyle = `rgba(255,255,255,${0.85 * (1 - shut)})`;
    c.fillRect(r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
  }

  // hit flash
  const flash = seg(t, HIT, HIT + 0.3);
  if (flash > 0 && flash < 1) {
    c.fillStyle = `rgba(255,255,255,${0.9 * (1 - flash)})`;
    c.beginPath();
    c.arc(TICK.x, TICK.y - 10, 20 + 70 * eOut(flash), 0, Math.PI * 2);
    c.fill();
  }

  const v = vialPose(t, L);
  if (t >= DROP) {
    const near = t < L.wobStart ? eBounce(seg(t, DROP, L.wobStart)) : 1;
    c.fillStyle = `rgba(30,40,20,${0.3 * near})`;
    c.beginPath();
    c.ellipse(TICK.x, GROUND_Y + 30, 16 + 6 * near, 5, 0, 0, Math.PI * 2);
    c.fill();
  }
  if (v.trail) {
    for (let k = 1; k <= 5; k++) {
      const tv = vialPose(Math.max(0.9, t - k * 0.03), L);
      c.fillStyle = `rgba(255,255,255,${0.22 - k * 0.035})`;
      c.beginPath();
      c.arc(tv.x, tv.y, 16 * tv.s, 0, Math.PI * 2);
      c.fill();
    }
  }
  if (t < 0.9) {
    const p = (t * 1.4) % 1;
    c.strokeStyle = `rgba(150,255,190,${0.6 * (1 - p)})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(v.x, v.y, 44 + 26 * p, 0, Math.PI * 2);
    c.stroke();
  }
  drawVial(c, v, f);

  // wobble dots
  if (L.wobbles > 0 && t >= L.wobStart - 0.1 && t < L.card + 0.3) {
    c.globalAlpha = seg(t, L.wobStart - 0.1, L.wobStart) * (1 - seg(t, L.card, L.card + 0.3));
    for (let i = 0; i < 3; i++) {
      const lit = t >= L.wobStart + i * WOBBLE + 0.45;
      c.fillStyle = lit ? "#5cf08f" : "rgba(255,255,255,.35)";
      c.strokeStyle = "rgba(20,45,30,.6)";
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(TICK.x - 22 + i * 22, GROUND_Y + 56, 6, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    c.globalAlpha = 1;
  }

  // grade text
  const gp = seg(t, HIT, HIT + 0.9);
  if (gp > 0 && gp < 1) {
    stampText(c, f, grade(ringAt(HIT)), TICK.x, 190 - 26 * eOut(gp), 34, "#fff7d6", "#c86a0c", eBack(seg(t, HIT, HIT + 0.25)), 1 - seg(gp, 0.75, 1));
  }

  // click: shock ring + stars
  if (t >= L.click) {
    const p = seg(t, L.click, L.click + 0.5);
    if (p < 1) {
      c.strokeStyle = `rgba(120,255,170,${1 - p})`;
      c.lineWidth = 4 * (1 - p) + 1;
      c.beginPath();
      c.arc(TICK.x, GROUND_Y, 20 + 70 * eOut(p), 0, Math.PI * 2);
      c.stroke();
    }
    const sp = seg(t, L.click, L.click + 1.1);
    if (sp < 1) {
      const R = rng(11);
      for (let i = 0; i < 12; i++) {
        const an = -Math.PI / 2 + (i / 12) * Math.PI * 2 + R() * 0.3;
        const d = (55 + R() * 55) * eOut(sp);
        c.fillStyle = i % 3 ? `rgba(255,224,90,${1 - sp})` : `rgba(140,255,180,${1 - sp})`;
        star(c, TICK.x + Math.cos(an) * d, GROUND_Y + Math.sin(an) * d * 0.8 + 40 * sp * sp, (7 + R() * 5) * (1 - sp * 0.5), sp * 4 + i);
      }
    }
  }

  // life-cycle diagram on a paper wipe
  if (t >= L.card) drawDiagram(c, f, a.sprites, text.diagram, (t - L.card) / L.dScale, a.wipeR);

  // CAUGHT stamp
  if (t >= L.click + 0.1) {
    const sc = eBack(seg(t, L.click + 0.1, L.click + 0.45));
    const y = lerp(GROUND_Y - 90, 112, eInOut(seg(t, L.card, L.card + 0.5)));
    stampText(c, f, "CAUGHT!", TICK.x, y, 54, "#ffffff", "#2f7d4f", sc * (1 + 0.04 * Math.sin((t - L.click) * 6)), 1);
  }
}
