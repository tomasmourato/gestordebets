import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import App from "./App";
import type { InitialAppData } from "./initialData";

// Os separadores são carregados com React.lazy (code splitting para o arranque
// da app nativa). O renderToString não espera por lazy — renderizava só o
// fallback do Suspense e o SSR ficava sem conteúdo. Com renderToPipeableStream
// e onAllReady esperamos que todos os chunks lazy resolvam antes de responder,
// por isso mantemos o code splitting E o HTML completo no servidor.
export function renderApp(initialData: InitialAppData): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    sink.on("finish", () => resolve(Buffer.concat(chunks).toString("utf8")));
    sink.on("error", reject);

    const { pipe, abort } = renderToPipeableStream(<App initialData={initialData} />, {
      // onAllReady (e não onShellReady): só respondemos quando todo o conteúdo
      // suspenso estiver resolvido, para o documento sair completo.
      onAllReady() {
        pipe(sink);
      },
      onShellError(error) {
        reject(error);
      },
      onError(error) {
        reject(error);
      },
    });

    // Rede de segurança: se algo pendurar, não seguramos o pedido para sempre.
    const timeout = setTimeout(() => abort(), 10_000);
    sink.on("finish", () => clearTimeout(timeout));
  });
}
