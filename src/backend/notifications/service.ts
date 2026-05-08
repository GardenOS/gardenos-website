import fs from "fs";
import path from "path";
import { Resend } from "resend";
import type { RsvpRecord } from "@/backend/rsvp/rsvp";
import { createAuditLog } from "@/backend/audit/repository";
import type { LiveEvent } from "@/backend/live-events/liveEvent";
import { createRsvpInviteToken } from "@/backend/rsvp/inviteToken";

export type NotificationDispatchResult = {
  queued: boolean;
  reason?: string;
};

export type RegisterConfirmationInput = {
  email: string;
  fullName?: string | null;
  lang?: string | null;
};

export type NotificationEventDetails = Pick<LiveEvent, "id" | "title" | "description" | "scheduledStartAt">;

export type InviteRsvpInput = {
  email: string;
  event: NotificationEventDetails;
};

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

function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:9090";
  }

  return "https://mygardenos.com";
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
  const siteUrl = getSiteUrl();
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

const EMAIL_I18N = {
  zh: {
    subject: "恭喜预约成功 — MYGARDENOS.COM",
    title: "恭喜预约成功",
    greetingWithName: (n: string) => `<p class="text greeting">您好，<strong>${n}</strong>，</p>`,
    greetingNoName: `<p class="text greeting">您好，</p>`,
    intro: "您已成功预约GardenOS割草机器人演示直播！",
    notice: `<strong>演示时间地点确认后，</strong>我们将第一时间发邮件通知您。请留意来自 <span class="email">info@mygardenos.com</span> 的邮件。`,
    reply: "如有任何问题，欢迎直接回复此邮件。",
    expect: "期待与您相见",
    signature: "— GardenOS 团队",
    text: "感谢您预约 GardenOS 活动！请访问 mygardenos.com 了解更多。",
  },
  en: {
    subject: "Registration Confirmed — MYGARDENOS.COM",
    title: "Registration Confirmed",
    greetingWithName: (n: string) => `<p class="text greeting">Hello, <strong>${n}</strong>,</p>`,
    greetingNoName: `<p class="text greeting">Hello,</p>`,
    intro: "You've successfully registered for the GardenOS mowing robot demonstration!",
    notice: `<strong>Once the demo time and location are confirmed,</strong> we'll notify you by email right away. Please watch for emails from <span class="email">info@mygardenos.com</span>.`,
    reply: "If you have any questions, feel free to reply to this email.",
    expect: "Looking forward to meeting you",
    signature: "— The GardenOS Team",
    text: "Thank you for registering for a GardenOS event! Visit mygardenos.com to learn more.",
  },
} as const;

async function sendRegisterImageMail(
  to: string,
  name?: string | null,
  lang?: string | null
): Promise<{ error?: { message: string } }> {
  const resend = new Resend(apiKey);
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const assetsUrl = `${siteUrl}/email/rsvp/assets`;
  const safeName = escapeHtml(String(name ?? "").trim());
  const i18n = lang === "en" ? EMAIL_I18N.en : EMAIL_I18N.zh;
  const greetingLine = safeName ? i18n.greetingWithName(safeName) : i18n.greetingNoName;

  const templatePath = path.join(process.cwd(), "public", "email", "rsvp", "index.html");
  let html = fs.readFileSync(templatePath, "utf-8");
  html = html
    .replaceAll("{{ASSETS_URL}}", assetsUrl)
    .replaceAll("{{TITLE}}", i18n.title)
    .replaceAll("{{GREETING_LINE}}", greetingLine)
    .replaceAll("{{INTRO}}", i18n.intro)
    .replaceAll("{{NOTICE}}", i18n.notice)
    .replaceAll("{{REPLY}}", i18n.reply)
    .replaceAll("{{EXPECT}}", i18n.expect)
    .replaceAll("{{SIGNATURE}}", i18n.signature);

  const result = await resend.emails.send({
    from: emailFrom,
    to,
    subject: i18n.subject,
    html,
    text: i18n.text,
  });

  if (result.error) {
    console.warn(`[notifications] Send from ${emailFrom} failed: ${result.error.message}`);
    return { error: result.error };
  }

  console.log(`[notifications] Register confirmation email sent from ${emailFrom} to ${to}`);
  return {};
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
  if (!to) {
    return { queued: false, reason: "missing-recipient-email" };
  }

  const { error } = await sendRegisterImageMail(to, input.fullName, input.lang);
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

export async function queueRsvpInvite(input: InviteRsvpInput): Promise<NotificationDispatchResult> {
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not configured, skipping invite email.");
    return { queued: false, reason: "notification-provider-not-configured" };
  }

  const to = String(input.email ?? "").trim().toLowerCase();
  if (!to) {
    return { queued: false, reason: "missing-recipient-email" };
  }

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const token = createRsvpInviteToken({
    email: to,
    eventId: input.event.id,
    expiresInSeconds: 7 * 24 * 60 * 60,
  });
  const oneClickUrl = `${siteUrl}/api/live/rsvp/one-click?token=${encodeURIComponent(token)}`;
  const title = escapeHtml(input.event.title || "GardenOS 直播活动");
  const time = input.event.scheduledStartAt ? escapeHtml(formatEventTime(input.event.scheduledStartAt)) : "时间待确认";

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
      <h2 style="color:#2d6a2d;margin-bottom:24px;">直播预约邀请</h2>
      <p style="font-size:15px;line-height:1.6;color:#1f2937;margin:0 0 12px;">我们准备了新的直播场次：</p>
      <p style="font-size:16px;font-weight:600;color:#2d6a2d;margin:0 0 12px;">${title}</p>
      <p style="font-size:14px;color:#6b7280;margin:0 0 32px;">预计时间：${time}</p>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="${oneClickUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;background:#2d6a2d;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;line-height:1.5;">预约这场直播</a>
      </div>
      
      <p style="font-size:13px;color:#6b7280;margin:24px 0 0;">无法点击按钮？复制下方链接到浏览器打开：</p>
      <p style="font-size:12px;color:#2d6a2d;word-break:break-all;margin:8px 0;padding:12px;background:#f5faf2;border-radius:6px;font-family:monospace;">${oneClickUrl}</p>
      
      <p style="color:#888;font-size:12px;margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;">— MYGARDENOS.COM</p>
    </div>
  `;

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: emailFrom,
    to,
    subject: `邀请预约直播：${input.event.title}`,
    html,
  });

  if (result.error) {
    console.error("[notifications] Failed to send RSVP invite email:", result.error);
    await createAuditLog({
      entityType: "live_event",
      entityId: input.event.id,
      action: "invite_email_failed",
      afterData: {
        to,
        subject: `邀请预约直播：${input.event.title}`,
        error: result.error.message,
      },
    }).catch((dbErr) => console.error("[notifications] Failed to write invite failure audit log:", dbErr));

    return { queued: false, reason: result.error.message };
  }

  console.log(`[notifications] Invite email sent from ${emailFrom} to ${to} for event ${input.event.id}`);
  return { queued: true };
}
