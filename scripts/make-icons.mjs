// Renders TickTector's app icons from Tick (the same drawing as components/tick.tsx) on hemlock green.
// Usage: node scripts/make-icons.mjs   (uses sharp, which ships with Next.js)
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const legs = [
  "M23 24 Q16 18 11 19", "M21.5 29 Q14 26 8.5 28", "M21.5 35 Q14 35.5 9 39", "M23 41 Q17 45 13 50",
  "M41 24 Q44 22.6 45.6 21", "M42.5 29 Q50 26 55.5 28", "M42.5 35 Q50 35.5 55 39", "M41 41 Q47 45 51 50",
];
const tick = `
  <g fill="none" stroke="#2a1910" stroke-width="2.8" stroke-linecap="round">${legs.map((d) => `<path d="${d}"/>`).join("")}</g>
  <path d="M45.4 21.2 L47.7 17.3" stroke="#7a5232" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="51.6" cy="11.8" r="6.2" fill="#d9eef3" fill-opacity="0.6" stroke="#3a2419" stroke-width="2.2"/>
  <path d="M48.6 10.6 Q49.4 8.4 51.4 8" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>
  <rect x="28.5" y="10" width="7" height="8" rx="3.2" fill="#3a2419"/>
  <ellipse cx="32" cy="37" rx="14" ry="16" fill="#c06d41"/>
  <ellipse cx="38.5" cy="43" rx="3.2" ry="5" fill="#fff" opacity="0.18"/>
  <ellipse cx="32" cy="26" rx="10.5" ry="9" fill="#3a2419"/>
  <ellipse cx="28" cy="25" rx="2.7" ry="3" fill="#fff"/><ellipse cx="36" cy="25" rx="2.7" ry="3" fill="#fff"/>
  <circle cx="28.9" cy="24.9" r="1.55" fill="#1d120c"/><circle cx="36.9" cy="24.9" r="1.55" fill="#1d120c"/>
  <circle cx="29.4" cy="24.2" r="0.55" fill="#fff"/><circle cx="37.4" cy="24.2" r="0.55" fill="#fff"/>
  <path d="M30 30 Q32 31.8 34 30" fill="none" stroke="#f6dccb" stroke-width="1.4" stroke-linecap="round"/>
  <ellipse cx="23.6" cy="36.5" rx="2.8" ry="1.7" fill="#ff9d9a" opacity="0.65"/>
  <ellipse cx="40.4" cy="36.5" rx="2.8" ry="1.7" fill="#ff9d9a" opacity="0.65"/>`;

// Full-bleed square (iOS and Android mask the corners); Tick sits a touch above center with a soft leaf-green glow.
const icon = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <defs><radialGradient id="g" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="#55a862"/><stop offset="1" stop-color="#2a6b38"/></radialGradient></defs>
  <rect width="64" height="64" fill="url(#g)"/>
  <ellipse cx="32" cy="50.5" rx="12" ry="2.4" fill="#000" opacity="0.2"/>
  <g transform="translate(32 31) scale(0.78) translate(-32 -32)">${tick}</g>
</svg>`;

for (const [file, size] of [["public/icon-192.png", 192], ["public/icon-512.png", 512], ["app/apple-icon.png", 180]]) {
  await sharp(Buffer.from(icon(size))).png().toFile(file);
  console.log(file);
}
// Link preview (Open Graph): Tick on its radar beside the name and promise, on the leaf-green card.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="bg" cx="25%" cy="45%" r="90%"><stop offset="0" stop-color="#2f7d45"/><stop offset="0.55" stop-color="#17502b"/><stop offset="1" stop-color="#0c2f18"/></radialGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(330 315)" fill="none" stroke="#a2f5a4" stroke-opacity="0.3" stroke-width="2.5">
    <circle r="230"/><circle r="155"/><circle r="80"/><path d="M-230 0H230M0-230V230"/>
  </g>
  <path d="M330 315 L330 85 A230 230 0 0 1 492 152 Z" fill="#a2f5a4" fill-opacity="0.22"/>
  <g transform="translate(330 315) scale(4.4) translate(-32 -32)">${tick}</g>
  <text x="640" y="290" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-size="92" fill="#ffffff">TickTector</text>
  <text x="644" y="360" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="36" fill="#ffffff" fill-opacity="0.85">This week's tick risk for</text>
  <text x="644" y="406" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="36" fill="#ffffff" fill-opacity="0.85">every Massachusetts town.</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("app/opengraph-image.png");
console.log("app/opengraph-image.png");

// Browser tab icon as SVG: crisp at any size.
writeFileSync("app/icon.svg", icon(64));
console.log("app/icon.svg");
