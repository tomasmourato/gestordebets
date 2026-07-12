// scripts/zip-extension.mjs
// Empacota a pasta extension/ num único zip servido estaticamente
// (/betclic-extension.zip), para o app oferecer o download apenas da extensão
// — sem o utilizador ter de descarregar o projeto todo.
//
// Corre depois do build (o zip vai para dist/). É NÃO-FATAL de propósito: um
// problema a gerar o zip nunca deve fazer falhar o deploy do site.

import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extDir = path.join(root, "extension");
const outDir = path.join(root, "dist");
const outFile = path.join(outDir, "betclic-extension.zip");

try {
  if (!existsSync(extDir)) {
    console.warn("[zip-extension] pasta extension/ não encontrada — ignorado.");
    process.exit(0);
  }

  const { default: AdmZip } = await import("adm-zip");
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const zip = new AdmZip();
  // Fica sob uma pasta "extension/" dentro do zip, para extrair de forma
  // limpa e o utilizador poder escolher essa pasta em "Carregar expandida".
  zip.addLocalFolder(extDir, "extension");
  zip.writeZip(outFile);

  console.log("[zip-extension] criado dist/betclic-extension.zip");
} catch (err) {
  console.warn("[zip-extension] falhou (ignorado):", (err && err.message) || err);
  process.exit(0);
}
