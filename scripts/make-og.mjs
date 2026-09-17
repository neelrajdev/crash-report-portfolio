/**
 * OG image generator — renders the FATAL error screen as a 1200×630 PNG.
 * Run: node scripts/make-og.mjs   (needs @resvg/resvg-js devDependency)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0c"/>
  <g opacity="0.05">
    ${Array.from({ length: 21 }, (_, i) => `<rect x="0" y="${i * 30}" width="1200" height="1" fill="#ffffff"/>`).join("\n    ")}
  </g>

  <!-- window chrome -->
  <circle cx="64" cy="66" r="9" fill="#ff3b47" opacity="0.85"/>
  <circle cx="94" cy="66" r="9" fill="#ffb454" opacity="0.85"/>
  <circle cx="124" cy="66" r="9" fill="#3ddc84" opacity="0.85"/>
  <text x="160" y="72" font-family="Consolas, 'Courier New', monospace" font-size="20" fill="#8b8b93">DevTools — neelraj.dev</text>
  <text x="1136" y="72" text-anchor="end" font-family="Consolas, 'Courier New', monospace" font-size="18" fill="#5a5a62">neelraj-os 5.1.0</text>

  <!-- pause banner -->
  <rect x="0" y="106" width="1200" height="56" fill="#4d9fff" opacity="0.12"/>
  <rect x="4" y="106" width="3" height="56" fill="#4d9fff"/>
  <text x="52" y="141" font-family="Consolas, 'Courier New', monospace" font-size="22" font-weight="bold" fill="#4d9fff">⏸ Paused on exception — SIGPORTFOLIO</text>

  <!-- fatal headline -->
  <text x="60" y="278" font-family="Consolas, 'Courier New', monospace" font-size="78" font-weight="bold" fill="#ff3b47">FATAL: CAREER_OVERFLOW</text>
  <text x="62" y="330" font-family="Consolas, 'Courier New', monospace" font-size="24" fill="#8b8b93">The story you are about to read could not be contained in a resume.</text>
  <text x="62" y="372" font-family="Consolas, 'Courier New', monospace" font-size="21" fill="#ffb454">&gt; expand the frames. every crash is a chapter.</text>

  <!-- fake frames -->
  <text x="62" y="450" font-family="Consolas, 'Courier New', monospace" font-size="20" fill="#3ddc84">  at Chapter4.buildingTheCrash</text>
  <text x="62" y="482" font-family="Consolas, 'Courier New', monospace" font-size="20" fill="#3ddc84" opacity="0.6">    at Chapter3.buildingForMyself</text>
  <text x="62" y="514" font-family="Consolas, 'Courier New', monospace" font-size="20" fill="#3ddc84" opacity="0.35">      at Chapter2.fallingForAI</text>
  <text x="62" y="546" font-family="Consolas, 'Courier New', monospace" font-size="20" fill="#3ddc84" opacity="0.2">        at Chapter1.helloWorld</text>

  <!-- footer -->
  <rect x="0" y="580" width="1200" height="1" fill="#1d1d22"/>
  <text x="62" y="606" font-family="Consolas, 'Courier New', monospace" font-size="22" font-weight="bold" fill="#3ddc84">neelrajdev.pages.dev</text>
  <text x="1138" y="606" text-anchor="end" font-family="Consolas, 'Courier New', monospace" font-size="18" fill="#5a5a62">4 frames · 1 uncaught exception · 0 regrets</text>
</svg>`;

const png = new Resvg(svg, {
  fitTo: { mode: "width", value: 1200 },
  font: { loadSystemFonts: true },
}).render().asPng();

mkdirSync("public", { recursive: true });
writeFileSync("public/og-image.png", png);
console.log(`wrote public/og-image.png (${png.length} bytes)`);
