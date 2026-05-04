import { Resend } from "resend";
import type { RsvpRecord } from "@/backend/rsvp/rsvp";
import { createAuditLog } from "@/backend/audit/repository";

export type NotificationDispatchResult = {
  queued: boolean;
  reason?: string;
};

export type RegisterConfirmationInput = {
  email: string;
  fullName?: string | null;
};

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
const FALLBACK_SENDER = "onboarding@resend.dev";

async function sendSuccessMail(to: string, name: string): Promise<{ error?: { message: string } }> {
  const resend = new Resend(apiKey);

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#2d6a2d;">恭喜预约成功！</h2>
      <p>您好，${name}，</p>
      <p>您已成功预约本次活动，期待与您相见！</p>
      <br/>
      <p style="color:#888;font-size:12px;">— MYGARDENOS.COM</p>
    </div>
  `;

  const senders = Array.from(new Set([emailFrom, FALLBACK_SENDER]));

  const results = await Promise.all(
    senders.map(async (from) => {
      const result = await resend.emails.send({ from, to, subject: "恭喜预约成功 — MYGARDENOS.COM", html });
      if (result.error) {
        console.warn(`[notifications] Send from ${from} failed: ${result.error.message}`);
      } else {
        console.log(`[notifications] Email sent from ${from} to ${to}`);
      }
      return result;
    })
  );

  // 只要有一封发送成功，就算成功
  const anySuccess = results.some((r) => !r.error);
  if (anySuccess) return {};

  // 全部失败时返回第一个错误
  return { error: results[0].error };
}

async function logEmailFailure(entityId: string, to: string, reason: string, source: string): Promise<void> {
  await createAuditLog({
    entityType: "rsvp",
    entityId,
    action: "email_send_failed",
    afterData: {
      to,
      source,
      subject: "恭喜预约成功 — MYGARDENOS.COM",
      error: reason,
    },
  }).catch((dbErr) => console.error("[notifications] Failed to write audit log:", dbErr));
}

export async function queueRsvpConfirmation(rsvp: RsvpRecord): Promise<NotificationDispatchResult> {
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not configured, skipping email.");
    return { queued: false, reason: "notification-provider-not-configured" };
  }

  const name = rsvp.fullName ?? rsvp.email;
  const { error } = await sendSuccessMail(rsvp.email, name);

  if (error) {
    console.error("[notifications] Failed to send RSVP confirmation email:", error);
    await logEmailFailure(rsvp.id, rsvp.email, error.message, "live-rsvp");
    return { queued: false, reason: error.message };
  }

  return { queued: true };
}

export async function queueRegisterConfirmation(input: RegisterConfirmationInput): Promise<NotificationDispatchResult> {
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not configured, skipping email.");
    return { queued: false, reason: "notification-provider-not-configured" };
  }

  const to = String(input.email ?? "").trim();
  const name = String(input.fullName ?? "").trim() || to;
  if (!to) {
    return { queued: false, reason: "missing-recipient-email" };
  }

  const { error } = await sendSuccessMail(to, name);
  if (error) {
    console.error("[notifications] Failed to send register confirmation email:", {
      to,
      reason: error.message,
    });
    await logEmailFailure(`register:${to}`, to, error.message, "register");
    return { queued: false, reason: error.message };
  }

  return { queued: true };
}
