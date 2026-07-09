import { Pool } from "pg";

// Um único pool de conexões partilhado por toda a app.
// Em serverless (Vercel) isto evita abrir uma ligação nova a cada pedido.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // A maioria dos providers gerenciados (Neon, Supabase, Railway, RDS)
  // exige SSL em produção. Em dev local contra um Postgres sem SSL, isto
  // é ignorado pelo próprio driver se o servidor não pedir SSL.
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10, // nº máximo de conexões simultâneas no pool
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Erro inesperado no pool do PostgreSQL:", err);
});

export default pool;
