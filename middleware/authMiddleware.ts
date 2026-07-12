import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is missing.");
  }
  return secret;
}

/**
 * Protege uma rota: exige um header "Authorization: Bearer <token>" válido.
 * Se o token for válido, anexa req.user = { id, username } e deixa passar.
 * Caso contrário, responde 401.
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Token de autenticação em falta." });
    return;
  }

  try {
    // Algoritmo fixado explicitamente: sem isto, a verificação aceita
    // qualquer algoritmo HMAC declarado no próprio token.
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as {
      id: string;
      username: string;
    };
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
