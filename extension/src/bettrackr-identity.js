function cleanBaseUrl(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function cleanUserId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function responseError(status, data) {
  if (status === 401 || status === 403) {
    return "Sessão BetTrackr expirada. Inicia sessão novamente na app.";
  }
  if (status === 404) {
    return "O utilizador desta sessão não existe nesta base de dados. Termina sessão e volta a entrar na app.";
  }
  return data?.error || `Não foi possível validar a sessão BetTrackr (HTTP ${status}).`;
}

export async function verifyBettrackrIdentity({
  token,
  baseUrl,
  expectedUserId,
  fetchImpl = fetch,
}) {
  const normalizedToken = typeof token === "string" ? token.trim() : "";
  const normalizedBaseUrl = cleanBaseUrl(baseUrl);
  const normalizedExpectedUserId = cleanUserId(expectedUserId);

  if (!normalizedToken) {
    throw new Error("Sem sessão BetTrackr. Abre a app e inicia sessão.");
  }
  if (!normalizedBaseUrl) {
    throw new Error("O endereço da app BetTrackr não está disponível. Abre a app antes de importar.");
  }

  let response;
  try {
    response = await fetchImpl(`${normalizedBaseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${normalizedToken}`,
        Accept: "application/json",
      },
    });
  } catch (_) {
    throw new Error("Não foi possível contactar a app para validar a sessão BetTrackr.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(responseError(response.status, data));

  const actualUserId = cleanUserId(data?.user?.id);
  if (!actualUserId) {
    throw new Error("A app devolveu uma sessão sem utilizador válido. Inicia sessão novamente.");
  }
  if (normalizedExpectedUserId && actualUserId !== normalizedExpectedUserId) {
    throw new Error("A extensão está ligada a outro utilizador. Recarrega a app e tenta importar novamente.");
  }

  return { user: data.user, userId: actualUserId };
}

export async function runAfterBettrackrVerification(options, operation) {
  const identity = await verifyBettrackrIdentity(options);
  return operation(identity);
}
