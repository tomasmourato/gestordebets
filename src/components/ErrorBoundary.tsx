import { Component, ErrorInfo, ReactNode } from "react";

// Rede de segurança de topo. Sem isto, qualquer erro em runtime ou de
// hidratação (ex.: um gráfico que hidrata de forma diferente entre servidor e
// cliente) desmonta a árvore inteira e deixa a página em branco/preto, sem nada
// no ecrã nem pista para diagnosticar. Aqui apanhamos o erro, registamo-lo e
// mostramos um fallback recuperável em vez do ecrã vazio.
interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Prefixo próprio para ser fácil de encontrar nos logs do browser/Vercel.
    console.error("[BetTrackr] Erro não tratado na UI:", error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Algo correu mal
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            A página não conseguiu carregar. Tenta recarregar; se persistir, o
            detalhe abaixo ajuda-nos a corrigir.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-4 inline-flex items-center rounded-sm bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Recarregar
          </button>
          <pre className="mt-4 max-h-40 overflow-auto rounded-sm bg-zinc-100 dark:bg-zinc-900 p-3 text-left text-[11px] text-rose-600 dark:text-rose-400 whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }
}
