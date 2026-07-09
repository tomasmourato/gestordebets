import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "\n[db/pool.ts] DATABASE_URL não está definida.\n" +
    "Confirma que existe um ficheiro .env.local (ou .env) na raiz do projeto\n" +
    "com a linha DATABASE_URL=postgres://... e que reiniciaste o `npm run dev`\n" +
    "depois de o criar/editar.\n"
  );
}

// Providers gerenciados (Supabase, Neon, Railway, RDS) exigem SSL sempre,
// mesmo quando o backend corre em localhost e liga-se remotamente à BD.
// Só desligamos o SSL se a própria BD for local (localhost/127.0.0.1).
const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString || "");

// Um único pool de conexões partilhado por toda a app.
// Em serverless (Vercel) isto evita abrir uma ligação nova a cada pedido.
const pool = new Pool({
  connectionString,
  ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
  max: 10, // nº máximo de conexões simultâneas no pool
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do PostgreSQL:", err);
});

export default pool;
