import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
const FROM = "The Full Collection <hello@thefullcollection.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://portal.thefullcollection.com";

/**
 * Notify team members when a client approves content.
 */
export async function sendApprovalEmail({
  to,
  clientName,
  cardTitle,
}: {
  to: string;
  clientName: string;
  cardTitle: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0A0A0A; color: #F0EDE6;">
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="color: #E02020; font-weight: 800; font-size: 14px; letter-spacing: 0.28em; text-transform: uppercase;">THE FULL COLLECTION</span>
      </div>
      <div style="background: #111111; border: 1px solid #252525; border-radius: 16px; padding: 28px;">
        <div style="display: inline-block; background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.3); color: #10B981; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px;">Approved</div>
        <h2 style="color: #F0EDE6; font-size: 18px; margin: 0 0 8px;">${clientName} approved content</h2>
        <p style="color: #A8A49C; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">"<strong style="color: #F0EDE6;">${cardTitle}</strong>" has been approved and is ready for publishing.</p>
        <p style="color: #5A5652; font-size: 12px; margin: 0 0 20px;">Approved at ${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
        <a href="${APP_URL}/team/portal" style="display: inline-block; background: #E02020; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600;">View in Portal</a>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${clientName} approved "${cardTitle}"`,
    html,
  });
}

/**
 * Notify team members when a client requests revisions.
 */
export async function sendRevisionRequestEmail({
  to,
  clientName,
  cardTitle,
  revisionNotes,
}: {
  to: string;
  clientName: string;
  cardTitle: string;
  revisionNotes: string;
}) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #0A0A0A; color: #F0EDE6;">
      <div style="text-align: center; margin-bottom: 28px;">
        <span style="color: #E02020; font-weight: 800; font-size: 14px; letter-spacing: 0.28em; text-transform: uppercase;">THE FULL COLLECTION</span>
      </div>
      <div style="background: #111111; border: 1px solid #252525; border-radius: 16px; padding: 28px;">
        <div style="display: inline-block; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #EF4444; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; margin-bottom: 16px;">Revisions Requested</div>
        <h2 style="color: #F0EDE6; font-size: 18px; margin: 0 0 8px;">${clientName} requested revisions</h2>
        <p style="color: #A8A49C; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">on "<strong style="color: #F0EDE6;">${cardTitle}</strong>"</p>
        <div style="background: #181818; border: 1px solid #252525; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #A8A49C; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 8px; font-weight: 600;">Revision Notes</p>
          <p style="color: #F0EDE6; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${revisionNotes}</p>
        </div>
        <a href="${APP_URL}/team/portal" style="display: inline-block; background: #E02020; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 600;">View in Portal</a>
      </div>
    </div>
  `;

  return resend.emails.send({
    from: FROM,
    to,
    subject: `${clientName} requested revisions on "${cardTitle}"`,
    html,
  });
}
