// Gera todos os ícones da app a partir de um ficheiro master (SVG ou PNG).
//
// Uso:  node scripts/gen-icons.mjs <master.svg|master.png>
// Requer (não instalados por omissão): npm i -D sharp png-to-ico
//
// Saídas: public/ (pwa-192/512, favicon.ico/.svg, apple-touch-icon.png),
//         extension/icons/ (16/32/48/128) e assets/logo.png (1024, master
//         do @capacitor/assets para regenerar os ícones/splash Android com
//         `npx @capacitor/assets generate --android`).
import sharp from "sharp";
import pngToIco from "png-to-ico";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { join, extname, dirname } from "path";
import { fileURLToPath } from "url";

const [, , masterPath] = process.argv;
if (!masterPath) {
  console.error("Uso: node scripts/gen-icons.mjs <master.svg|master.png>");
  process.exit(1);
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const master = readFileSync(masterPath);
const isSvg = extname(masterPath).toLowerCase() === ".svg";
const base = sharp(master, isSvg ? { density: 300 } : {});

const out = (...p) => join(repoRoot, ...p);
const png = (size) => base.clone().resize(size, size).png();

await png(192).toFile(out("public", "pwa-192x192.png"));
await png(512).toFile(out("public", "pwa-512x512.png"));
await png(180).toFile(out("public", "apple-touch-icon.png"));
if (isSvg) copyFileSync(masterPath, out("public", "favicon.svg"));

const icoSizes = await Promise.all([16, 32, 48].map((s) => png(s).toBuffer()));
writeFileSync(out("public", "favicon.ico"), await pngToIco(icoSizes));

mkdirSync(out("extension", "icons"), { recursive: true });
for (const s of [16, 32, 48, 128]) {
  await png(s).toFile(out("extension", "icons", `icon${s}.png`));
}

await png(1024).toFile(out("assets", "logo.png"));

console.log("Ícones gerados: public/, extension/icons/ e assets/logo.png");
