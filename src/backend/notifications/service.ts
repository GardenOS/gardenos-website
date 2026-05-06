import { Resend } from "resend";
import type { RsvpRecord } from "@/backend/rsvp/rsvp";
import { createAuditLog } from "@/backend/audit/repository";
import type { LiveEvent } from "@/backend/live-events/liveEvent";

export type NotificationDispatchResult = {
  queued: boolean;
  reason?: string;
};

export type RegisterConfirmationInput = {
  email: string;
  fullName?: string | null;
};

export type NotificationEventDetails = Pick<LiveEvent, "id" | "title" | "description" | "scheduledStartAt">;

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEventTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));
}

function buildCalendarSection(event: NotificationEventDetails | null | undefined): string {
  if (!event?.scheduledStartAt) {
    return "";
  }

  const startAt = new Date(event.scheduledStartAt);
  if (Number.isNaN(startAt.getTime())) {
    return "";
  }

  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  const googleDates = `${startAt.toISOString().replace(/[-:]|\.\d{3}/g, "")}/${endAt
    .toISOString()
    .replace(/[-:]|\.\d{3}/g, "")}`;
  const eventTitle = event.title.trim() || "GardenOS 活动";
  const description = event.description?.trim() || "GardenOS 活动预约确认";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mygardenos.com";
  const icsUrl = `${siteUrl.replace(/\/$/, "")}/api/calendar/live-event/${encodeURIComponent(event.id)}`;
  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", eventTitle);
  googleUrl.searchParams.set("dates", googleDates);
  googleUrl.searchParams.set("details", description);

  return `
    <div style="margin-top:24px;padding:20px;border-radius:16px;background:#f5faf2;border:1px solid #d8e9d3;">
      <p style="margin:0 0 8px;font-size:14px;color:#2d6a2d;font-weight:600;">预约时间</p>
      <p style="margin:0 0 14px;font-size:15px;color:#1f2937;">${escapeHtml(formatEventTime(event.scheduledStartAt))}</p>
      <div>
        <a href="${googleUrl.toString()}" style="display:inline-block;margin-right:10px;margin-bottom:10px;padding:10px 16px;border-radius:999px;background:#2d6a2d;color:#ffffff;text-decoration:none;font-weight:600;">加入 Google Calendar</a>
        <a href="${icsUrl}" style="display:inline-block;margin-bottom:10px;padding:10px 16px;border-radius:999px;border:1px solid #2d6a2d;color:#2d6a2d;text-decoration:none;font-weight:600;">下载 .ics 日历文件</a>
      </div>
    </div>
  `;
}

async function sendSuccessMail(
  to: string,
  name: string,
  event?: NotificationEventDetails | null
): Promise<{ error?: { message: string } }> {
  const resend = new Resend(apiKey);
  const safeName = escapeHtml(name);
  const calendarSection = buildCalendarSection(event);

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#2d6a2d;">恭喜预约成功！</h2>
      <p>您好，${safeName}，</p>
      <p>您已成功预约本次活动，期待与您相见！</p>
      ${calendarSection}
      <br/>
      <p style="color:#888;font-size:12px;">— MYGARDENOS.COM</p>
    </div>
  `;

  const result = await resend.emails.send({ from: emailFrom, to, subject: "恭喜预约成功 — MYGARDENOS.COM", html });
  if (result.error) {
    console.warn(`[notifications] Send from ${emailFrom} failed: ${result.error.message}`);
    return { error: result.error };
  }

  console.log(`[notifications] Email sent from ${emailFrom} to ${to}`);
  return {};
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

export async function queueRsvpConfirmation(
  rsvp: RsvpRecord,
  event?: NotificationEventDetails | null
): Promise<NotificationDispatchResult> {
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not configured, skipping email.");
    return { queued: false, reason: "notification-provider-not-configured" };
  }

  const name = rsvp.fullName ?? rsvp.email;
  const { error } = await sendSuccessMail(rsvp.email, name, event);

  if (error) {
    console.error("[notifications] Failed to send RSVP confirmation email:", error);
    await logEmailFailure(rsvp.id, rsvp.email, error.message, "live-rsvp");
    return { queued: false, reason: error.message };
  }

  return { queued: true };
}

export async function queueRegisterConfirmation(
  input: RegisterConfirmationInput,
  event?: NotificationEventDetails | null
): Promise<NotificationDispatchResult> {
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not configured, skipping email.");
    return { queued: false, reason: "notification-provider-not-configured" };
  }

  const to = String(input.email ?? "").trim();
  const name = String(input.fullName ?? "").trim() || to;
  if (!to) {
    return { queued: false, reason: "missing-recipient-email" };
  }

  const { error } = await sendSuccessMail(to, name, event);
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
