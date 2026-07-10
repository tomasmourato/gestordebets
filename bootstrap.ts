import dotenv from "dotenv";

// Este é o ponto de entrada de desenvolvimento (npm run dev). Marca o
// ambiente como development para o server.ts ativar o middleware do Vite;
// em produção (npm start / Vercel) esta variável nunca é definida aqui.
process.env.NODE_ENV ??= "development";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

await import("./server");
