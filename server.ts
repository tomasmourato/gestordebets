import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// --- NOVO: rotas e middleware de autenticação / bets ---
import authRoutes from "./routes/authRoutes";
import betsRoutes from "./routes/betsRoutes";
import { authenticateToken, AuthenticatedRequest } from "./middleware/authMiddleware";

// Carrega .env primeiro (se existir) e depois .env.local por cima, com
// override — dotenv.config() sozinho só lê ".env" por defeito, por isso o
// DATABASE_URL definido em .env.local nunca estava a ser carregado.
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Limite ideal para payloads na Vercel (máximo suportado por eles é 4.5mb)
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ limit: "4mb", extended: true }));

// --- NOVO: regista as rotas de autenticação e de bets ---
app.use("/api/auth", authRoutes);
app.use("/api/bets", betsRoutes);

// Lazy init of GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint to parse betting screenshot with Gemini
// --- NOVO: authenticateToken garante que só utilizadores com sessão
// válida podem usar este endpoint (evita que estranhos gastem a tua quota do Gemini)
app.post("/api/parse-screenshot", authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: "Nenhuma imagem foi fornecida." });
      return;
    }

    const ai = getAiClient();

    // Clean up base64 prefix if present (e.g. "data:image/png;base64,")
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    let mimeType = "image/png";
    let pureBase64 = imageBase64;
    if (match) {
      mimeType = match[1];
      pureBase64 = match[2];
    }

    const systemInstruction = `
És um especialista em apostas desportivas e processamento de imagem de recibos de apostas (boletins).
Analisa o screenshot do boletim de apostas desportivas fornecido e extrai as informações do boletim estruturadas exatamente de acordo com o esquema JSON pedido.
Escreve todos os textos extraídos em português (como os nomes dos mercados, escolhas, etc.).
Formatos comuns de casas de apostas em Portugal: Betano, Betclic, Placard.pt, Bwin, Solverde, Casino Portugal, etc.
Para o campo "type", classifica como "SIMPLES" se for apenas 1 seleção, ou "MULTIPLA" se forem 2 ou mais seleções.
Se não conseguires identificar alguma informação com certeza, faz a melhor estimativa ou deixa em branco.
`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash"];
    let response: any = null;
    let lastError: any = null;
    const maxAttempts = 3; // Reduzido para 3 para evitar dar timeout na Vercel

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const model = modelsToTry[attempt % modelsToTry.length];
      try {
        console.log(`Tentativa ${attempt + 1}/${maxAttempts}: a analisar screenshot com o modelo ${model}...`);
        response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: pureBase64,
              },
            },
            {
              text: "Extrai as informações do boletim de apostas desportivas desta imagem em formato JSON.",
            },
          ],
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                bookmaker: {
                  type: Type.STRING,
                  description: "Nome da casa de apostas, ex: Betano, Betclic, Placard, Solverde, Bwin",
                },
                type: {
                  type: Type.STRING,
                  description: "Tipo de aposta: SIMPLES ou MULTIPLA",
                },
                stake: {
                  type: Type.NUMBER,
                  description: "Valor total apostado (stake) em Euros, ex: 10.00",
                },
                odd: {
                  type: Type.NUMBER,
                  description: "Odd total combinada da aposta, ex: 1.85",
                },
                potentialReturn: {
                  type: Type.NUMBER,
                  description: "Retorno potencial total em Euros, ex: 18.50",
                },
                dateTime: {
                  type: Type.STRING,
                  description: "Data e hora da aposta no formato YYYY-MM-DD HH:mm (se disponível)",
                },
                selections: {
                  type: Type.ARRAY,
                  description: "Lista de seleções incluídas na aposta",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      event: {
                        type: Type.STRING,
                        description: "O jogo ou evento desportivo, ex: Benfica vs Porto, Real Madrid vs Barcelona",
                      },
                      market: {
                        type: Type.STRING,
                        description: "O mercado apostado, ex: Resultado Final, Ambas Equipas Marcam, Total de Golos",
                      },
                      choice: {
                        type: Type.STRING,
                        description: "A seleção ou escolha feita, ex: Benfica, Sim, Mais de 2.5",
                      },
                      odd: {
                        type: Type.NUMBER,
                        description: "A odd individual desta seleção, ex: 1.85",
                      },
                    },
                    required: ["event", "market", "choice", "odd"],
                  },
                },
              },
              required: ["bookmaker", "type", "stake", "odd", "potentialReturn", "selections"],
            },
          },
        });

        if (response && response.text) {
          console.log(`Sucesso na tentativa ${attempt + 1} com o modelo ${model}!`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa ${attempt + 1} falhou com o modelo ${model}:`, err.message || err);
        const baseWait = (attempt + 1) * 1000;
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, baseWait));
        }
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("Não foi possível obter resposta do Gemini após várias tentativas.");
    }

    const textResult = response.text;
    const parsedData = JSON.parse(textResult.trim());
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Erro ao analisar imagem com Gemini:", error);
    res.status(500).json({
      error: "Ocorreu um erro ao processar o screenshot.",
      details: error.message,
    });
  }
});

// Configure Vite middleware in development or serve static in production
async function start() {
  if (process.env.VERCEL) {
    return; // Na Vercel não faz nada, deixa a Vercel servir os estáticos nativamente
  }
  if (process.env.NODE_ENV !== "production") {
    // IMPORT DINÂMICO: O Vite só é carregado aqui se estiveres a rodar no teu PC localmente!
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Modo de desenvolvimento: Middleware do Vite ativado.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor a correr em http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error("Erro ao iniciar o servidor:", err);
  });
}

export default app;
