// Aplica todas as migrações de db/migrations por ordem alfabética.
// Todas são idempotentes, por isso correr o script várias vezes é seguro.
// Uso: node --env-file=.env scripts/migrate.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não está definida no ambiente.");
  process.exit(1);
}

const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);
const pool = new pg.Pool({
  connectionString,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
});

const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
for (const file of files) {
  process.stdout.write(`-> ${file} ... `);
  await pool.query(readFileSync(join(dir, file), "utf8"));
  console.log("ok");
}

await pool.end();
console.log(`\n${files.length} migrações aplicadas.`);
