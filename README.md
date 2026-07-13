# BetTrackr

Aplicação web para gestão e análise de boletins de apostas desportivas.
Permite registar apostas manualmente, importar boletins a partir de um
screenshot (com extração automática via Gemini) e acompanhar estatísticas de
desempenho — lucro líquido, ROI/yield, taxa de acerto e análise de freebets.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Recharts
- **Backend:** Express, PostgreSQL (`pg`), autenticação com JWT + bcrypt
- **IA:** Google Gemini (extração de dados de screenshots de boletins)

## Arquitetura

O PostgreSQL é a única fonte de verdade para as apostas. O armazenamento local
do browser guarda apenas o token JWT, o utilizador em cache e as preferências
(`g_prefs`, que inclui o tema claro/escuro).

```
src/components/   componentes de UI
src/hooks/        estado da aplicação (apostas, preferências, tema, auditoria)
src/lib/          camada de API (authApi, betsApi) e mapeamento BD <-> frontend
routes/           rotas Express (/api/auth, /api/bets)
middleware/       verificação do JWT
db/               pool de conexões, schema e migrações
```

## Configuração

**Requisitos:** Node.js 20+ e uma base de dados PostgreSQL.

1. Instalar as dependências:

   ```bash
   npm install
   ```

2. Criar um ficheiro `.env.local` na raiz do projeto (ver [.env.example](.env.example)):

   ```
   DATABASE_URL=postgres://user:password@host:5432/bettrackr
   JWT_SECRET=<valor aleatório e longo>
   GEMINI_API_KEY=<chave da API do Gemini>
   ```

   Para gerar um `JWT_SECRET`:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. Preparar a base de dados:

   - Instalações novas: executar [db/schema.sql](db/schema.sql).
   - Bases de dados existentes: executar, por ordem, as migrações idempotentes
     em [db/migrations](db/migrations) (`001` até à mais recente).

4. Arrancar em modo de desenvolvimento:

   ```bash
   npm run dev
   ```

   A app fica disponível em `http://localhost:3000`.

## Scripts

| Comando         | Descrição                                            |
| --------------- | ---------------------------------------------------- |
| `npm run dev`   | Servidor Express com o Vite em middleware mode        |
|  `npm run build` | Compila o frontend (`dist/`) e o servidor (`dist-server/`)   |
| `npm start`     | Corre o build de produção                             |
| `npm run lint`  | Verificação de tipos com o TypeScript                 |

## API

Todas as rotas de `/api/bets` exigem o header `Authorization: Bearer <token>`
e devolvem apenas as apostas do utilizador autenticado.

| Método   | Endpoint          | Descrição                          |
| -------- | ----------------- | ---------------------------------- |
| `POST`   | `/api/auth/register` | Cria uma conta e devolve um JWT |
| `POST`   | `/api/auth/login`    | Autentica e devolve um JWT      |
| `GET`    | `/api/auth/me`       | Utilizador autenticado          |
| `GET`    | `/api/health`        | Estado da função e da BD        |
| `GET`    | `/api/bets`          | Lista as apostas                |
| `POST`   | `/api/bets`          | Cria uma aposta                 |
| `POST`   | `/api/bets/bulk`     | Importa várias apostas (transação) |
| `PUT`    | `/api/bets/:id`      | Atualiza uma aposta             |
| `DELETE` | `/api/bets/:id`      | Apaga uma aposta                |
| `DELETE` | `/api/bets`          | Apaga todas as apostas          |
