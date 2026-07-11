import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

// O pool é criado à primeira utilização e não no import do módulo. Se este
// ficheiro lançasse um erro ao ser importado, uma DATABASE_URL em falta
// derrubava a função inteira (FUNCTION_INVOCATION_FAILED na Vercel) em vez de
// devolver um erro tratado pelas rotas.
let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não está definida no ambiente.");
  }

  // Providers geridos (Supabase, Neon, Railway, RDS) exigem SSL sempre, mesmo
  // quando o backend corre em localhost e se liga remotamente à BD. Só
  // desligamos o SSL se a própria BD for local.
  const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);

  pool = new Pool({
    connectionString,
    ssl: isLocalDb ? undefined : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });

  pool.on("error", (err) => {
    console.error("Erro inesperado no pool do PostgreSQL:", err);
  });

  return pool;
}

// Mantém a mesma superfície de API usada pelas rotas (`pool.query`, `pool.connect`).
export default {
  query<R extends QueryResultRow = any>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<R>> {
    return getPool().query<R>(text, params);
  },
  connect(): Promise<PoolClient> {
    return getPool().connect();
  },
};
