// src/lib/haptics.ts
// Feedback tátil na app nativa (Android via Capacitor). Na web é um no-op.
// O plugin é importado dinamicamente (mesmo padrão de src/lib/liveUpdate.ts)
// para nunca entrar no bundle web nem rebentar fora do Capacitor. Todas as
// funções engolem erros — feedback tátil nunca deve partir um fluxo.

import { isNativeApp } from "./apiBase";

type ImpactWeight = "light" | "medium" | "heavy";
type NotificationKind = "success" | "warning" | "error";

async function haptics() {
  if (!isNativeApp()) return null;
  try {
    return await import("@capacitor/haptics");
  } catch {
    return null;
  }
}

/** Toque curto — usar em botões, tabs, seleção de chips. */
export async function tapHaptic(weight: ImpactWeight = "light"): Promise<void> {
  const mod = await haptics();
  if (!mod) return;
  try {
    const style =
      weight === "heavy"
        ? mod.ImpactStyle.Heavy
        : weight === "medium"
          ? mod.ImpactStyle.Medium
          : mod.ImpactStyle.Light;
    await mod.Haptics.impact({ style });
  } catch {
    /* no-op */
  }
}

/** Notificação — usar em sucesso/erro de ações (guardar, apagar). */
export async function notifyHaptic(kind: NotificationKind = "success"): Promise<void> {
  const mod = await haptics();
  if (!mod) return;
  try {
    const type =
      kind === "error"
        ? mod.NotificationType.Error
        : kind === "warning"
          ? mod.NotificationType.Warning
          : mod.NotificationType.Success;
    await mod.Haptics.notification({ type });
  } catch {
    /* no-op */
  }
}

/** Vibração muito curta para gestos (drag de sheet, swipe de linha). */
export async function selectionHaptic(): Promise<void> {
  const mod = await haptics();
  if (!mod) return;
  try {
    await mod.Haptics.selectionStart();
    await mod.Haptics.selectionChanged();
    await mod.Haptics.selectionEnd();
  } catch {
    /* no-op */
  }
}
