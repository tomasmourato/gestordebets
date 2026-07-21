import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "bettrackr_session";

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

function cookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1 || part.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

export function tokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);
  return cookieValue(req.headers.cookie, SESSION_COOKIE);
}

export function authenticatedUserFromRequest(req: Request): AuthenticatedRequest["user"] | null {
  const token = tokenFromRequest(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as {
      id: string;
      username: string;
    };
    return { id: payload.id, username: payload.username };
  } catch {
    return null;
  }
}

/**
 * Protege uma rota: aceita o bearer token da extensão/API ou o cookie HttpOnly
 * usado pelo browser e pelo renderer do documento inicial.
 * Se o token for válido, anexa req.user = { id, username } e deixa passar.
 * Caso contrário, responde 401.
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const user = authenticatedUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Token de autenticação em falta." });
    return;
  }
  req.user = user;
  next();
}
