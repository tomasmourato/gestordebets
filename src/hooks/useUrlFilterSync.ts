import { useEffect, useRef } from "react";

interface UseUrlFilterSyncOptions {
  /** Caminho da página que possui estes filtros ("/dashboard", "/bets"). */
  path: string;
  /** Query string serializada do estado atual ("?a=b" ou ""). */
  search: string;
  /** Reaplica os filtros de um URL que mudou por fora (back/forward). */
  onExternalChange: (params: URLSearchParams) => void;
}

/**
 * Mantém os filtros de uma página em sincronia com o URL nos dois sentidos:
 *
 * - estado -> URL: cada alteração de filtro faz pushState, por isso o "voltar"
 *   do browser percorre os filtros um a um;
 * - URL -> estado: no popstate reaplicamos os filtros no sítio, sem remontar a
 *   página (mantém o scroll, a pesquisa por texto e modais abertos).
 *
 * Só age quando o browser está mesmo em `path`, para uma página que ainda esteja
 * montada durante uma transição de separador não escrever no URL da outra.
 */
export function useUrlFilterSync({ path, search, onExternalChange }: UseUrlFilterSyncOptions) {
  // O primeiro render apenas reflete o URL que já lá está — escrever nessa
  // altura duplicaria a entrada de histórico da navegação que nos trouxe aqui.
  const isFirstRun = useRef(true);

  // Guardado numa ref para o efeito de escrita não depender da identidade do
  // callback (que muda a cada render dos componentes que o passam inline).
  const onExternalChangeRef = useRef(onExternalChange);
  useEffect(() => {
    onExternalChangeRef.current = onExternalChange;
  }, [onExternalChange]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (window.location.pathname !== path) return;
    if (window.location.search === search) return;
    window.history.pushState({ ...window.history.state }, "", `${path}${search}`);
  }, [path, search]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname !== path) return;
      onExternalChangeRef.current(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [path]);
}
