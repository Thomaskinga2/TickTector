// Small pictures for the life-cycle diagram: the hosts, the person, the leaf litter and the eggs.
// Ported from reference/capture-preview.html. Fixed game colours on purpose (see draw-kit.ts).
import { rng, roundRect, sprite, type Ctx, type Sprite } from "./draw-kit";

function drawHuman(c: Ctx): void {
  c.fillStyle = "#b9bec5";
  c.beginPath();
  c.arc(25, 10, 9, 0, Math.PI * 2);
  c.fill();
  roundRect(c, 21, 17, 8, 8, 2);
  c.fill();
  c.beginPath();
  c.moveTo(11, 26);
  c.quadraticCurveTo(25, 21, 39, 26);
  c.lineTo(36, 58);
  c.lineTo(14, 58);
  c.closePath();
  c.fill();
  for (const x of [11, 39]) {
    c.beginPath();
    c.arc(x, 29, 5.5, 0, Math.PI * 2);
    c.fill();
  }
  for (const [x, y, w, h] of [[4, 27, 8, 33], [38, 27, 8, 33], [14, 54, 10, 42], [26, 54, 10, 42]]) {
    roundRect(c, x, y, w, h, 4);
    c.fill();
  }
}
// white-footed mouse, facing right
function drawMouse(c: Ctx): void {
  const col = "#8f8378";
  c.strokeStyle = col;
  c.lineWidth = 1.4;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(6, 14);
  c.quadraticCurveTo(0, 13, 2, 6);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.arc(21, 6.5, 3.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(14, 13, 9, 5.5, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(23, 11.5, 5.5, 4, -0.25, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(26, 9);
  c.lineTo(30, 12);
  c.lineTo(26, 13.8);
  c.fill();
  c.fillStyle = "#d8aaa0";
  c.beginPath();
  c.arc(21, 6.5, 1.8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.ellipse(15, 15.5, 6, 2.6, 0, 0, Math.PI);
  c.fill();
  c.fillStyle = "#1d1712";
  c.beginPath();
  c.arc(25, 10.5, 0.9, 0, Math.PI * 2);
  c.fill();
}
// white-tailed deer, facing left
function drawDeer(c: Ctx): void {
  const col = "#a56f40";
  c.fillStyle = col;
  c.strokeStyle = col;
  c.lineCap = "round";
  c.lineWidth = 2.6;
  for (const [a, b, x, y] of [[12, 20, 11, 32], [16, 21, 16, 32], [24, 21, 25, 32], [28, 20, 29, 32]]) {
    c.beginPath();
    c.moveTo(a, b);
    c.lineTo(x, y);
    c.stroke();
  }
  c.beginPath();
  c.ellipse(20, 18, 10.5, 5.5, 0, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 4.5;
  c.beginPath();
  c.moveTo(12, 16);
  c.lineTo(8, 8);
  c.stroke();
  c.beginPath();
  c.ellipse(6, 7, 4.6, 3, -0.35, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(10.5, 3.2, 2.8, 1.3, -0.7, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.ellipse(30.5, 15, 1.8, 2.6, 0.3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#1d1712";
  c.beginPath();
  c.arc(1.9, 8.4, 1, 0, Math.PI * 2);
  c.fill();
}
function leafShape(c: Ctx, x: number, y: number, len: number, w: number, rot: number, fill: string): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(-len / 2, 0);
  c.quadraticCurveTo(0, -w, len / 2, 0);
  c.quadraticCurveTo(0, w, -len / 2, 0);
  c.fill();
  c.strokeStyle = "rgba(80,45,15,.4)";
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-len / 2, 0);
  c.lineTo(len / 2, 0);
  c.stroke();
  c.restore();
}
function drawLeaves(c: Ctx): void {
  leafShape(c, 15, 16, 30, 11, -0.6, "#8f6a3a");
  leafShape(c, 25, 17, 28, 10, 0.5, "#6f8a4a");
}

export type DiagramSprites = Record<"human" | "mouse" | "deer" | "leaves", Sprite>;
export function makeDiagramSprites(dpr: number): DiagramSprites {
  return {
    human: sprite(50, 96, drawHuman, dpr, 1.3),
    mouse: sprite(30, 20, drawMouse, dpr, 0.85),
    deer: sprite(34, 34, drawDeer, dpr, 0.72),
    leaves: sprite(40, 30, drawLeaves, dpr, 1.05),
  };
}

export function drawEggs(c: Ctx, x: number, y: number): void {
  const R = rng(5);
  for (let i = 0; i < 16; i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R()) * 9;
    const ex = x + Math.cos(a) * d * 1.2;
    const ey = y + Math.sin(a) * d * 0.75;
    c.fillStyle = "#7a3412";
    c.beginPath();
    c.ellipse(ex, ey + 0.6, 2.7, 2.3, a, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#c4682a";
    c.beginPath();
    c.ellipse(ex, ey, 2.5, 2.1, a, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(255,232,195,.9)";
    c.beginPath();
    c.arc(ex - 0.8, ey - 0.7, 0.75, 0, Math.PI * 2);
    c.fill();
  }
}
