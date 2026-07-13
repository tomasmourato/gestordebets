// Paginação pura do histórico Betclic. A API pode devolver menos registos do
// que o `limit` pedido, por isso o próximo offset tem de avançar pelo número
// realmente recebido, não pelo tamanho de página solicitado.
export async function fetchBetclicHistory(requestPage, options = {}) {
  const pageSize = options.pageSize || 20;
  const maxOffset = options.maxOffset || 5000;
  const out = [];
  let offset = 0;
  let total = Infinity;

  // `X-Total-Count` não é fiável para cashouts: a Betclic pode anunciar só
  // as apostas ganhas/perdidas e ainda devolver cashouts depois desse offset.
  // Por isso o total serve apenas para progresso; só uma página vazia termina
  // a paginação.
  while (offset <= maxOffset) {
    const page = await requestPage({ offset, limit: pageSize });
    const bets = Array.isArray(page && page.bets) ? page.bets : [];
    const reportedTotal = Number(page && page.total);
    if (Number.isFinite(reportedTotal)) total = reportedTotal;

    out.push(...bets);
    if (options.onPage) options.onPage({ count: out.length, total });
    if (bets.length === 0) break;

    offset += bets.length;
  }

  return out;
}
