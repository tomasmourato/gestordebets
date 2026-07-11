# BetTrackr — Extensão de importação do Betclic

Extensão de browser (Manifest V3, Chrome/Edge/Brave) que importa as tuas
apostas do Betclic.pt diretamente para o BetTrackr, sem exportações manuais.

## Como funciona

O Betclic não oferece exportação de apostas, mas o site consome uma API JSON
interna (`betting.begmedia.pt/api/v2/me/bets/...`). A extensão:

1. **Captura a sessão** — na página do Betclic, um script no contexto da página
   observa o header `Authorization` que a própria página já envia à API e
   reutiliza-o. Não lê passwords nem nada que digites.
2. **Lê as apostas** — o service worker pagina os endpoints `ended` (liquidadas)
   e `ongoing` (em curso).
3. **Traduz** — cada aposta do Betclic é mapeada para o modelo do BetTrackr
   (`src/mapper.js`), reutilizando a mesma matemática de lucro/retorno da app.
4. **Deduplica** — pela `bet_reference` do Betclic (guardada em `metadata.ref`),
   por isso reimportar não cria duplicados.
5. **Envia** — as apostas novas vão para `POST /api/bets/bulk` do BetTrackr.

Nenhuma alteração à app é necessária: a `metadata` é guardada e devolvida
opaca pela API, o que basta para a deduplicação.

## Instalação (modo programador)

1. Abre `chrome://extensions` (ou `brave://extensions`).
2. Ativa o **Modo de programador**.
3. **Carregar expandida** → escolhe esta pasta `extension/`.

## Utilização

1. Inicia sessão no **BetTrackr** (basta abrir a app uma vez — a extensão
   capta o token e a origem automaticamente; em local usa `http://localhost`).
2. Abre **betclic.pt**, entra e vai a **As minhas apostas**.
3. Clica no ícone da extensão → **Importar apostas**.

Os dois pontos no popup ficam verdes quando ambas as sessões são detetadas.

## Limitações conhecidas

- **Histórico** — a API do Betclic só expõe as apostas mais recentes; apostas
  muito antigas podem não estar disponíveis (limitação do Betclic, não da
  extensão).
- **Estados** — `NotSet`/`Win`/`Lose` estão confirmados. Cashout, anuladas e
  meio-ganhas/perdidas são mapeados por aproximação até haver amostra real; o
  resultado original do Betclic fica em `metadata` para correção posterior.
- **Termos do Betclic** — o acesso automatizado pode violar os termos do
  Betclic (uso pessoal, só da tua conta e dos teus dados, mas ainda assim
  automatizado). Usa por tua conta e risco.

## Ficheiros

| Ficheiro | Papel |
| --- | --- |
| `manifest.json` | Configuração MV3, permissões e content scripts |
| `src/inject.js` | Capta o token no contexto da página do Betclic (MAIN world) |
| `src/content-betclic.js` | Guarda o token captado no armazenamento da extensão |
| `src/content-bettrackr.js` | Lê o token do BetTrackr do `localStorage` |
| `src/background.js` | Pagina, mapeia, deduplica e importa |
| `src/mapper.js` | Betclic → modelo Bet do BetTrackr |
| `popup.*` | Interface: estado das sessões + botão de importação |
