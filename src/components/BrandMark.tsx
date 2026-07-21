// Marca da app: o mesmo SVG do ícone instalável (assets/logo.svg, copiado
// para public/favicon.svg por scripts/gen-icons.mjs), para a identidade ser
// igual dentro e fora da app. Partilhado pelos dois shells (desktop/mobile)
// e pelo ecrã de autenticação.
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/favicon.svg"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="shrink-0 select-none"
    />
  );
}
