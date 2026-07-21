// scripts/bundle-app.mjs
// Live update da app nativa (Capacitor): empacota o build web (dist/) em
// dist/app-bundle.zip e escreve dist/app-version.json com a versão do build.
// A app Android compara a sua versão com este JSON no arranque e, se for
// diferente, descarrega o zip e aplica-o (ver src/lib/liveUpdate.ts) — sem
// reinstalar o APK.
//
// Corre DEPOIS do vite build (o conteúdo de dist/ tem de estar completo).
// É NÃO-FATAL: um problema aqui nunca deve fazer falhar o deploy do site.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const zipFile = path.join(distDir, "app-bundle.zip");
const versionFile = path.join(distDir, "app-version.json");

// Ficheiros de dist/ que NÃO fazem sentido dentro do bundle da app:
// o próprio zip, o zip da extensão de browser e o manifest de versão.
const EXCLUDE = new Set(["app-bundle.zip", "bettrackr-extension.zip", "app-version.json"]);

try {
  if (!existsSync(distDir) || !existsSync(path.join(distDir, "index.html"))) {
    console.warn("[bundle-app] dist/ incompleto — ignorado (corre depois do vite build).");
    process.exit(0);
  }

  // Versão do bundle: o commit do deploy (Vercel) ou um timestamp em builds
  // locais. Só interessa que mude a cada build — a app compara por igualdade.
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || `local-${Date.now()}`;

  const { default: AdmZip } = await import("adm-zip");
  const zip = new AdmZip();
  for (const entry of readdirSync(distDir)) {
    if (EXCLUDE.has(entry)) continue;
    const full = path.join(distDir, entry);
    if (statSync(full).isDirectory()) zip.addLocalFolder(full, entry);
    else zip.addLocalFile(full);
  }
  zip.writeZip(zipFile);

  // buildTime: escrito pelo vite (dist/build-time.json) e embutido no próprio
  // bundle como __BUILD_TIME__. Publicá-lo aqui permite à app comparar idades
  // e RECUSAR bundles que não sejam mais recentes do que o que já corre — sem
  // isto, um APK acabado de instalar era "atualizado" para um bundle antigo.
  let buildTime = null;
  try {
    buildTime = JSON.parse(readFileSync(path.join(distDir, "build-time.json"), "utf8")).buildTime ?? null;
  } catch {
    console.warn("[bundle-app] build-time.json ausente — app-version.json sai sem buildTime.");
  }

  writeFileSync(versionFile, JSON.stringify({ version, buildTime }) + "\n");

  console.log(`[bundle-app] criado dist/app-bundle.zip + app-version.json (versão ${version}, buildTime ${buildTime})`);
} catch (err) {
  console.warn("[bundle-app] falhou (ignorado):", (err && err.message) || err);
  process.exit(0);
}
