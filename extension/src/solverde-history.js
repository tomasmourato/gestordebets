// solverde-history.js — pagina o endpoint POST /bets da Solverde
// (sportswidget.solverde.pt). O intervalo from/to é arbitrário mas o
// tamanho máximo aceite por pedido não está confirmado, por isso avançamos
// por janelas de 90 dias (o mesmo tamanho que se viu a própria Solverde
// pedir com paginação confirmada a funcionar) em vez de arriscar um único
// pedido multi-ano.
//
// A paginação usa `pagination.hasMoreData` (a flag que a própria API
// devolve) em vez de recalcular `totalPages` a partir de `itemsPerPage` —
// pedir mais de 20 itens por página fazia a API devolver uma paginação
// inconsistente e a importação parava sempre nos primeiros 50 resultados.

const HISTORY_START_YEAR = 2016; // ajusta se faltarem apostas mais antigas
const WINDOW_DAYS = 90;
const ITEMS_PER_PAGE = 20; // valor confirmado a funcionar; a API não respeita bem outros
const MAX_PAGES_PER_WINDOW = 200; // salvaguarda contra um loop infinito se a API nunca parar de sinalizar hasMoreData

export function solverdeHistoryStart() {
  return new Date(Date.UTC(HISTORY_START_YEAR, 0, 1, 0, 0, 0, 0));
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * requestPage({ from, to, page, itemsPerPage }) -> { bets, pagination }
 * (o formato cru devolvido por data.data da API da Solverde).
 */
export async function fetchSolverdeHistory(requestPage, options = {}) {
  const itemsPerPage = options.itemsPerPage || ITEMS_PER_PAGE;
  const windowDays = options.windowDays || WINDOW_DAYS;
  const start = options.start || solverdeHistoryStart();
  const now = options.now || new Date();
  const byId = new Map();

  let windowEnd = now;
  let windowIndex = 0;
  while (windowEnd > start) {
    windowIndex++;
    const windowStart = new Date(Math.max(addDays(windowEnd, -windowDays).getTime(), start.getTime()));

    let page = 1;
    let hasMore = true;
    let sawAnyBet = false;
    while (hasMore && page <= MAX_PAGES_PER_WINDOW) {
      const data = await requestPage({
        from: windowStart.toISOString(),
        to: windowEnd.toISOString(),
        page,
        itemsPerPage,
      });
      const bets = Array.isArray(data && data.bets) ? data.bets : [];
      for (const bet of bets) {
        if (bet && bet.id !== undefined && bet.id !== null) {
          sawAnyBet = true;
          byId.set(String(bet.id), bet);
        }
      }
      const pagination = (data && data.pagination) || {};
      // hasMoreData é o sinal fiável da própria API; se não vier presente,
      // caímos para "só há mais se esta página veio cheia" como aproximação.
      hasMore = pagination.hasMoreData === true ||
        (pagination.hasMoreData === undefined && bets.length === itemsPerPage);
      if (options.onPage) {
        options.onPage({ count: byId.size, window: windowIndex, page, hasMore });
      }
      page++;
    }

    // Otimização: se uma janela de 90 dias não teve nenhuma aposta, é pouco
    // provável (mas não impossível) que haja atividade dispersa mais antiga
    // logo a seguir — continuamos sempre até ao início definido, só paramos
    // mais cedo se quem chamar isto quiser (não paramos aqui por defeito).
    void sawAnyBet;

    windowEnd = windowStart;
  }

  return [...byId.values()];
}

