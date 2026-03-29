import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const FROM = "The Full Collection <hello@thefullcollection.com>";

export async function sendReportEmail({
  to,
  clientName,
  monthLabel,
  downloadUrl,
}: {
  to: string;
  clientName: string;
  monthLabel: string;
  downloadUrl: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0A0A0A; color: #F0EDE6;">
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="color: #E02020; font-weight: 800; font-size: 14px; letter-spacing: 0.28em; text-transform: uppercase;">THE FULL COLLECTION</span>
      </div>
      <div style="background: #111111; border: 1px solid #252525; border-radius: 16px; padding: 28px;">
        <h2 style="color: #F0EDE6; font-size: 18px; margin: 0 0 8px;">Your Monthly Report is Ready</h2>
        <p style="color: #A8A49C; font-size: 14px; line-height: 1.6; margin: 0 0 8px;">Hi ${clientName},</p>
        <p style="color: #A8A49C; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">Your <strong style="color: #F0EDE6;">${monthLabel}</strong> content performance report is ready. Click below to view and download it.</p>
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${downloadUrl}" style="display: inline-block; background: #E02020; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">Download Report</a>
        </div>
        <p style="color: #5A5652; font-size: 12px; margin: 0; text-align: center;">This link expires in 7 days.</p>
      </div>
      <p style="color: #5A5652; font-size: 11px; text-align: center; margin-top: 20px;">The Full Collection &mdash; thefullcollection.com</p>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `Your Monthly Content Report — ${monthLabel}`,
    html,
  });
}
