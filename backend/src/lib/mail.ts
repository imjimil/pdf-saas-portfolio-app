import nodemailer from 'nodemailer';

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

/** Sends a contact notification when SMTP is configured in the environment. */
export async function sendContactNotification(payload: ContactPayload): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.CONTACT_TO_EMAIL || user;

  if (!host || !user || !pass || !to) return false;

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Mypdftools" <${user}>`,
    to,
    replyTo: payload.email,
    subject: `Mypdftools — message from ${payload.name}`,
    text: `${payload.message}\n\n—\n${payload.name}\n${payload.email}`,
    html: `<p>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
<p>—<br><strong>${escapeHtml(payload.name)}</strong><br>${escapeHtml(payload.email)}</p>`,
  });

  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
