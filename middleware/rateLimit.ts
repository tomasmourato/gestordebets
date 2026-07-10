import { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Rate limiter de janela fixa, em memória, por IP.
 *
 * Em serverless cada instância tem o seu próprio Map, por isso o limite
 * efetivo é "max por instância" — não substitui um limitador distribuído,
 * mas trava força bruta contra o login e abuso da quota do Gemini sem
 * dependências externas. Requer `app.set("trust proxy", 1)` para que o
 * req.ip reflita o X-Forwarded-For atrás do proxy da Vercel.
 */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + options.windowMs };
      buckets.set(ip, bucket);
    }
    bucket.count++;

    if (bucket.count > options.max) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      res.status(429).json({
        error: options.message ?? "Demasiados pedidos. Tenta novamente dentro de alguns minutos.",
      });
      return;
    }

    // Limpeza oportunista para limitar a memória em processos de longa duração.
    if (buckets.size > 10000) {
      for (const [key, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(key);
      }
    }

    next();
  };
}
