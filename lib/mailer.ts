// lib/mailer.ts
// Envio de email transacional via Resend (https://resend.com) — uma chamada
// HTTP simples, sem SDK. Sem RESEND_API_KEY configurada, o email não é
// enviado e o link aparece no log do servidor (útil em desenvolvimento).
//
// Env:
//   RESEND_API_KEY  chave da API do Resend (obrigatória para enviar de facto)
//   MAIL_FROM       remetente; sem domínio verificado no Resend usa o sandbox
//                   "BetTrackr <onboarding@resend.dev>" (só entrega ao email
//                   da própria conta Resend)

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "BetTrackr <onboarding@resend.dev>";

interface MailResult {
  sent: boolean;
}

async function sendMail(to: string, subject: string, html: string): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false };

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || DEFAULT_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend respondeu ${res.status}: ${body.slice(0, 300)}`);
  }
  return { sent: true };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<MailResult> {
  const subject = "BetTrackr — recuperação de password";
  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
      <h2 style="font-size:18px;margin:0 0 12px">Recuperação de password</h2>
      <p style="font-size:14px;line-height:1.5;margin:0 0 16px">
        Recebemos um pedido para repor a password da tua conta BetTrackr.
        Clica no botão abaixo para definir uma nova password. O link expira em <strong>1 hora</strong>
        e só pode ser usado uma vez.
      </p>
      <p style="margin:0 0 16px">
        <a href="${resetUrl}"
           style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px">
          Definir nova password
        </a>
      </p>
      <p style="font-size:12px;color:#64748b;line-height:1.5;margin:0 0 8px">
        Se o botão não funcionar, copia este endereço para o browser:<br>
        <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all">${resetUrl}</a>
      </p>
      <p style="font-size:12px;color:#64748b;line-height:1.5;margin:0">
        Se não pediste esta recuperação, ignora este email — a tua password mantém-se.
      </p>
    </div>`;
  return sendMail(to, subject, html);
}
