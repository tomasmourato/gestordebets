# BetTrackr — Extensão de importação de apostas

Extensão de browser (Manifest V3, Chrome/Edge/Brave) que importa as tuas
apostas do Betclic.pt e Betano.pt diretamente para o BetTrackr.

## Como funciona

Os sites consomem APIs JSON internas. A extensão:

1. **Captura a sessão** — scripts no contexto de cada página observam apenas
   os headers que o próprio site envia. No Betano, os pedidos são executados na
   página aberta para reutilizar cookies e contexto anti-bot.
2. **Lê as apostas** — pagina Betclic (`ended`/`ongoing`) e Betano (abertas e
   janelas de seis meses até 2012).
3. **Traduz** — cada casa tem um mapper próprio, incluindo regras próprias para
   freebets e promoções.
4. **Deduplica e atualiza** — usa chaves `betclic:<ref>` ou `betano:<BetId>`;
   uma aposta aberta é atualizada quando passa a estar liquidada.
5. **Envia** — cria novas apostas em lote e atualiza as existentes pela API do
   BetTrackr.

A extensão nunca inclui cookies, passwords ou tokens de sessão no código.

## Instalação (modo programador)

1. Abre `chrome://extensions` (ou `brave://extensions`).
2. Ativa o **Modo de programador**.
3. Extrai o zip e, em **Carregar expandida**, escolhe a pasta extraída que contém `manifest.json`.

## Utilização

1. Inicia sessão no **BetTrackr** (basta abrir a app uma vez — a extensão
   capta o token e a origem automaticamente; em local usa `http://localhost`).
2. Abre **betclic.pt** ou a página principal de **betano.pt** e entra.
3. Mantém o separador principal do Betano aberto durante a importação; não é necessário abrir a janela do histórico.
4. Clica no ícone da extensão e escolhe **Importar Betclic**, **Importar Betano**
   ou **Importar tudo**.

## Limitações conhecidas

- **Histórico** — os sites podem limitar o histórico ou alterar as APIs internas.
- **Estados** — estados desconhecidos do Betano não são importados sem evidência
  suficiente para evitar distorcer os resultados.
- **Freebets** — no Betano, `FullBet` é freebet; `RiskFree` mantém-se como stake
  monetária e o tipo da promoção fica guardado em metadata.
- **Termos dos sites** — o acesso automatizado pode violar os termos dos
  bookmakers. Usa por tua conta e risco.

## Ficheiros

| Ficheiro | Papel |
| --- | --- |
| `manifest.json` | Configuração MV3, permissões e content scripts |
| `src/inject.js` / `src/inject-betano.js` | Bridges no contexto das páginas dos bookmakers |
| `src/content-betclic.js` / `src/content-betano.js` | Bridges isolados para o service worker |
| `src/content-bettrackr.js` | Lê o token do BetTrackr do `localStorage` |
| `src/background.js` | Pagina, mapeia, deduplica, atualiza e importa |
| `src/mapper.js` / `src/mapper-betano.js` | Mappers específicos para o modelo BetTrackr |
| `popup.*` | Interface: estado das sessões e ações por bookmaker |
