import { describe, expect, test } from "bun:test";
import {
  runAfterBettrackrVerification,
  verifyBettrackrIdentity,
} from "../src/bettrackr-identity.js";

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

describe("BetTrackr import identity verification", () => {
  test("accepts a token whose API user matches the website user", async () => {
    const requests = [];
    const identity = await verifyBettrackrIdentity({
      token: "current-token",
      baseUrl: "https://gestordebets.vercel.app/",
      expectedUserId: "user-current",
      fetchImpl: async (url, init) => {
        requests.push({ url, init });
        return response(200, { user: { id: "user-current", username: "ronk" } });
      },
    });

    expect(identity.userId).toBe("user-current");
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe("https://gestordebets.vercel.app/api/auth/me");
    expect(requests[0].init.headers.Authorization).toBe("Bearer current-token");
  });

  test("blocks a different website user before the import operation runs", async () => {
    let importsStarted = 0;
    await expect(runAfterBettrackrVerification({
      token: "stale-token",
      baseUrl: "https://gestordebets.vercel.app",
      expectedUserId: "new-user",
      fetchImpl: async () => response(200, { user: { id: "old-user" } }),
    }, async () => {
      importsStarted++;
    })).rejects.toThrow("outro utilizador");

    expect(importsStarted).toBe(0);
  });

  test("blocks expired sessions and users missing from the current database", async () => {
    await expect(verifyBettrackrIdentity({
      token: "expired",
      baseUrl: "https://gestordebets.vercel.app",
      fetchImpl: async () => response(401, { error: "Token inválido" }),
    })).rejects.toThrow("expirada");

    await expect(verifyBettrackrIdentity({
      token: "old-database-token",
      baseUrl: "https://gestordebets.vercel.app",
      fetchImpl: async () => response(404, { error: "Utilizador não encontrado" }),
    })).rejects.toThrow("não existe nesta base de dados");
  });

  test("allows a popup import without a cached website id after /me validates the token", async () => {
    let importsStarted = 0;
    const result = await runAfterBettrackrVerification({
      token: "popup-token",
      baseUrl: "https://gestordebets.vercel.app",
      expectedUserId: null,
      fetchImpl: async () => response(200, { user: { id: "popup-user" } }),
    }, async (identity) => {
      importsStarted++;
      return identity.userId;
    });

    expect(result).toBe("popup-user");
    expect(importsStarted).toBe(1);
  });
});
