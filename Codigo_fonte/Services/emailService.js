import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia email para a equipa com o pedido de eliminação
 */
export async function enviarPedidoEliminacao({ nomeUtilizador, emailUtilizador, motivo, codigo }) {
  await transporter.sendMail({
    from: `"SG Kussanguluca" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_EQUIPA,
    subject: `🔴 Pedido de Eliminação de Conta — ${nomeUtilizador}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e293b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">SG Kussanguluca</h1>
          <p style="color: #94a3b8; margin: 8px 0 0;">Pedido de Eliminação de Conta</p>
        </div>
        
        <div style="background: #fff7f7; border: 1px solid #fecaca; padding: 24px; border-radius: 0 0 12px 12px;">
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
            <p style="color: #991b1b; font-weight: bold; margin: 0;">⚠️ Um utilizador solicitou a eliminação da sua conta</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">Nome:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${nomeUtilizador}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${emailUtilizador}</td>
            </tr>
          </table>

          <div style="margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Motivo apresentado:</p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px;">
              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">${motivo}</p>
            </div>
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <p style="color: #166534; font-size: 13px; margin: 0 0 8px; font-weight: bold;">Código de autorização para enviar ao utilizador (se aprovado):</p>
            <div style="text-align: center; background: white; border-radius: 8px; padding: 16px; border: 2px dashed #86efac;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #15803d; font-family: monospace;">${codigo}</span>
            </div>
            <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0; text-align: center;">
              Este código expira em 24 horas. Só envie ao utilizador se o motivo for legítimo.
            </p>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              📌 Se o motivo não for convincente, simplesmente ignore este email. O utilizador não terá acesso ao código.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

/**
 * Envia o código de confirmação ao utilizador (após aprovação da equipa)
 */
export async function enviarCodigoUtilizador({ nomeUtilizador, emailUtilizador, codigo }) {
  await transporter.sendMail({
    from: `"SG Kussanguluca" <${process.env.EMAIL_USER}>`,
    to: emailUtilizador,
    subject: `Código de confirmação — Eliminação de conta SG Kussanguluca`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e293b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">SG Kussanguluca</h1>
          <p style="color: #94a3b8; margin: 8px 0 0;">Confirmação de Eliminação de Conta</p>
        </div>

        <div style="background: white; border: 1px solid #e5e7eb; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 15px;">Olá, <strong>${nomeUtilizador}</strong>!</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            O seu pedido de eliminação de conta foi analisado e aprovado pela nossa equipa.
            Use o código abaixo para confirmar a eliminação definitiva da sua conta.
          </p>

          <div style="background: #fef2f2; border: 2px dashed #fca5a5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #991b1b; font-size: 13px; margin: 0 0 12px;">Código de confirmação</p>
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #dc2626; font-family: monospace;">${codigo}</span>
            <p style="color: #6b7280; font-size: 12px; margin: 12px 0 0;">Válido por 24 horas</p>
          </div>

          <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 6px;">
            <p style="color: #9a3412; font-size: 13px; margin: 0;">
              ⚠️ Se não reconhece este pedido, ignore este email e a sua conta permanecerá activa.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}