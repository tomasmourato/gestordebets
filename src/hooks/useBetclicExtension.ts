// src/hooks/useBetclicExtension.ts
// Comunica com a extensão de browser "BetTrackr — Importar do Betclic" através
// de window.postMessage (a extensão injeta um content script nesta origem que
// serve de ponte). Não precisa do ID da extensão nem de a publicar.
//
// Um site NUNCA consegue instalar uma extensão automaticamente — isso é uma
// fronteira de segurança do browser. O que isto permite é: detetar se a
// extensão está instalada e disparar a importação a partir de um botão do app.

import { useCallback, useEffect, useRef, useState } from "react";

const APP = "bettrackr-app";
const EXT = "bettrackr-ext";

export interface BetclicImportResult {
  ok: boolean;
  imported?: number;
  skipped?: number;
  fetched?: number;
  error?: string;
}

export function useBetclicExtension() {
  // null = ainda a verificar; true/false = resposta conhecida
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<BetclicImportResult | null>(null);
  const reloadTimer = useRef<number | null>(null);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== EXT) return;

      if (data.type === "PONG") {
        setInstalled(true);
        if (data.version) setVersion(String(data.version));
      } else if (data.type === "PROGRESS") {
        setProgress(String(data.text || ""));
      } else if (data.type === "RESULT") {
        setImporting(false);
        setProgress(null);
        setResult({
          ok: !!data.ok,
          imported: data.imported,
          skipped: data.skipped,
          fetched: data.fetched,
          error: data.error,
        });
        // Se entraram apostas novas, recarrega para o dashboard as refletir
        // (a extensão grava direto na BD, fora do estado do app).
        if (data.ok && data.imported > 0) {
          reloadTimer.current = window.setTimeout(() => window.location.reload(), 1800);
        }
      }
    }

    window.addEventListener("message", onMessage);
    // Pergunta se a extensão está presente; se não responder, assume ausente.
    window.postMessage({ source: APP, type: "PING" }, window.location.origin);
    const probe = window.setTimeout(() => {
      setInstalled((prev) => (prev === null ? false : prev));
    }, 1500);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(probe);
      if (reloadTimer.current) window.clearTimeout(reloadTimer.current);
    };
  }, []);

  const recheck = useCallback(() => {
    setInstalled(null);
    window.postMessage({ source: APP, type: "PING" }, window.location.origin);
    window.setTimeout(() => {
      setInstalled((prev) => (prev === null ? false : prev));
    }, 1500);
  }, []);

  const runImport = useCallback(() => {
    setResult(null);
    setProgress(null);
    setImporting(true);
    window.postMessage({ source: APP, type: "IMPORT" }, window.location.origin);
    // Salvaguarda: se a extensão nunca responder, não fica preso "a importar".
    window.setTimeout(() => {
      setImporting((busy) => {
        if (busy) {
          setResult({ ok: false, error: "A extensão não respondeu. Reabre a página das apostas no Betclic." });
        }
        return false;
      });
    }, 60000);
  }, []);

  return { installed, version, importing, progress, result, runImport, recheck };
}
