import nodemailer, { Transporter } from "nodemailer";

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const canSend =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_PORT &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS &&
  !!process.env.MAIL_FROM;

let transporter: Transporter | null = null;

if (canSend) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const sendMail = async ({ to, subject, text, html }: SendMailOptions): Promise<void> => {
  if (!canSend || !transporter) {
    console.log("[MAIL:FALLBACK]", { to, subject, text, html });
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};
