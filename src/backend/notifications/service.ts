import fs from "fs";
import path from "path";
import { Resend } from "resend";
import type { RsvpRecord } from "@/backend/rsvp/rsvp";
import { createAuditLog } from "@/backend/audit/repository";
import type { LiveEvent } from "@/backend/live-events/liveEvent";
import { createRsvpInviteToken } from "@/backend/rsvp/inviteToken";
import { recordInviteSend } from "@/backend/live-events/inviteRecords";

export type NotificationDispatchResult = {
  queued: boolean;
  reason?: string;
};

export type RegisterConfirmationInput = {
  email: string;
  fullName?: string | null;
  lang?: string | null;
};

export type NotificationEventDetails = Pick<LiveEvent, "id" | "title" | "titleEn" | "description" | "scheduledStartAt">;

export type InviteRsvpInput = {
  email: string;
  lang?: "zh" | "en" | null;
  event: NotificationEventDetails;
};

function normalizeLang(value: string | null | undefined): "zh" | "en" {
  return value === "en" ? "en" : "zh";
}

function pickEventTitleByLang(event: NotificationEventDetails | null | undefined, lang: "zh" | "en"): string {
  if (!event) {
    return lang === "en" ? "GardenOS Live Demo" : "GardenOS 直播";
  }

  if (lang === "en") {
    const titleEn = event.titleEn?.trim();
    if (titleEn) return titleEn;
  }

  return event.title.trim() || (lang === "en" ? "GardenOS Live Demo" : "GardenOS 直播");
}

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

  const { error } = await sendRegisterImageMail(rsvp.email, rsvp.fullName, rsvp.locale, event);

  if (error) {
    console.error("[notifications] Failed to send RSVP confirmation email:", error);
    await logEmailFailure(rsvp.id, rsvp.email, error.message, "live-rsvp");
    return { queued: false, reason: error.message };
  }

  return { queued: true };
}

const EMAIL_I18N = {
  zh: {
    baseSubject: "恭喜预约成功",
    fallbackEventTitle: "GardenOS 直播",
    title: "恭喜预约成功",
    greetingWithName: (n: string) => `<p style="margin:0;font-size:18px;color:#1e293b;line-height:1.6;">您好，<strong style="color:#0c6a34;">${n}</strong>，</p>`,
    greetingNoName: `<p style="margin:0;font-size:18px;color:#1e293b;line-height:1.6;">您好，</p>`,
    intro: "您已成功预约GardenOS割草机器人演示直播！",
    notice: `<strong>演示时间地点确认后，</strong>我们将第一时间发邮件通知您。请留意来自 <span class="email">info@mygardenos.com</span> 的邮件。`,
    reply: "如有任何问题，欢迎直接回复此邮件。",
    expect: "期待与您相见",
    signature: "— GardenOS 团队",
    text: "感谢您预约 GardenOS 活动！请访问 mygardenos.com 了解更多。",
  },
  en: {
    baseSubject: "Registration Confirmed",
    fallbackEventTitle: "GardenOS Live Demo",
    title: "Registration Confirmed",
    greetingWithName: (n: string) => `<p style="margin:0;font-size:18px;color:#1e293b;line-height:1.6;">Hello, <strong style="color:#0c6a34;">${n}</strong>,</p>`,
    greetingNoName: `<p style="margin:0;font-size:18px;color:#1e293b;line-height:1.6;">Hello,</p>`,
    intro: "You've successfully registered for the GardenOS mowing robot demonstration!",
    notice: `<strong>Once the demo time and location are confirmed,</strong> we'll notify you by email right away. Please watch for emails from <span class="email">info@mygardenos.com</span>.`,
    reply: "If you have any questions, feel free to reply to this email.",
    expect: "Looking forward to meeting you",
    signature: "— The GardenOS Team",
    text: "Thank you for registering for a GardenOS event! Visit mygardenos.com to learn more.",
  },
} as const;

function formatSubjectDateTime(value: string, lang: "zh" | "en"): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (lang === "zh") {
    const parts = new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Pacific/Auckland",
    }).formatToParts(date);

    const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
    return `${pick("year")}年${pick("month")}月${pick("day")}日 ${pick("hour")}:${pick("minute")}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Pacific/Auckland",
  }).format(date);
}

function buildRegisterMailSubject(
  lang: "zh" | "en",
  event?: NotificationEventDetails | null
): string {
  const i18n = EMAIL_I18N[lang];
  const eventTitle = pickEventTitleByLang(event, lang) || i18n.fallbackEventTitle;
  const eventTime = event?.scheduledStartAt ? formatSubjectDateTime(event.scheduledStartAt, lang) : null;

  if (!eventTime) {
    return `${i18n.baseSubject} - ${eventTitle}`;
  }

  if (lang === "zh") {
    return `${i18n.baseSubject} - ${eventTitle}【${eventTime}】`;
  }

  return `${i18n.baseSubject} - ${eventTitle} [${eventTime}]`;
}

function extractUsernameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const username = localPart.split(".")[0] ?? "";
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

async function sendRegisterImageMail(
  to: string,
  name?: string | null,
  lang?: string | null,
  event?: NotificationEventDetails | null
): Promise<{ error?: { message: string } }> {
  const resend = new Resend(apiKey);
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const assetsUrl = "https://pub-02cc13bc15314870b396f792dc2ec072.r2.dev/email/rsvp/assets";
  const providedName = String(name ?? "").trim();
  const displayName = providedName || extractUsernameFromEmail(to);
  const safeName = escapeHtml(displayName);
  const resolvedLang = normalizeLang(lang);
  const i18n = EMAIL_I18N[resolvedLang];
  const greetingLine = safeName ? i18n.greetingWithName(safeName) : i18n.greetingNoName;
  const subject = buildRegisterMailSubject(resolvedLang, event);

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
    subject,
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

  const { error } = await sendRegisterImageMail(to, input.fullName, input.lang, event);
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
  const assetsUrl = "https://pub-02cc13bc15314870b396f792dc2ec072.r2.dev/email/rsvp/assets";
  const lang = normalizeLang(input.lang);
  const token = createRsvpInviteToken({
    email: to,
    eventId: input.event.id,
    expiresInSeconds: 7 * 24 * 60 * 60,
    lang,
  });
  const localePath = lang === "en" ? "en" : "zh";
  const oneClickUrl = `${siteUrl}/${localePath}/rsvp?token=${encodeURIComponent(token)}`;
  const titleZh = escapeHtml(pickEventTitleByLang(input.event, "zh"));
  const titleEn = escapeHtml(pickEventTitleByLang(input.event, "en"));
  const time = input.event.scheduledStartAt
    ? escapeHtml(formatEventTime(input.event.scheduledStartAt))
    : "待确认 / To be confirmed";
  const subject = `邀请预约直播 / Live RSVP Invitation: ${pickEventTitleByLang(input.event, "zh")} / ${pickEventTitleByLang(input.event, "en")}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1f2937;">
      <!-- 主要内容卡 -->
      <div style="margin-bottom:32px;padding:24px;background-image:url('${assetsUrl}/image1.png');background-size:cover;background-position:center;border-radius:12px;">
        <!-- 标题 -->
        <h1 style="color:#2d6a2d;margin:0 0 32px;font-size:24px;font-weight:700;">直播预约邀请 / Live RSVP Invitation</h1>
        
        <!-- 介绍段落 -->
        <div style="margin-bottom:32px;line-height:1.8;">
          <p style="margin:0 0 8px;font-size:15px;">我们即将举办一场新的直播活动，欢迎提前预约。</p>
          <p style="margin:0;font-size:15px;">We are preparing a new live session and you are welcome to reserve your spot in advance.</p>
        </div>
        
        <!-- 直播主题 -->
        <div style="margin-bottom:24px;padding:16px;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;">直播主题 / Live Topic</p>
          <p style="margin:0 0 6px;font-size:16px;font-weight:600;color:#2d6a2d;">${titleZh}</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#2d6a2d;">${titleEn}</p>
        </div>
        
        <!-- 预计时间 -->
        <div style="margin-bottom:32px;padding:16px;border-radius:8px;">
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-weight:600;">预计时间 / Scheduled Time</p>
          <p style="margin:0;font-size:15px;color:#2d6a2d;font-weight:500;">${time}</p>
        </div>
        
        <!-- 行动说明 -->
        <div style="line-height:1.8;">
          <p style="margin:0 0 8px;font-size:15px;">点击下方按钮完成预约。直播时间确认后，我们会第一时间通知你。</p>
          <p style="margin:0;font-size:15px;">Please click the button below to reserve this session. Once the live time is confirmed, we will notify you as soon as possible.</p>
        </div>
      </div>
      
      <!-- 按钮 -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${oneClickUrl}" style="display:inline-block;padding:14px 32px;border-radius:8px;background:#2d6a2d;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;line-height:1.5;">预约这场直播 / Reserve this session</a>
      </div>
      
      <!-- 备用链接 -->
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 8px;">无法点击按钮？/ Button not working?</p>
        <p style="font-size:12px;color:#666;margin:0 0 8px;">复制下方链接到浏览器打开 / Copy and open this link:</p>
        <p style="font-size:12px;color:#2d6a2d;word-break:break-all;margin:8px 0;padding:12px;background:#f5faf2;border-radius:6px;font-family:monospace;">${oneClickUrl}</p>
      </div>
      
      <!-- 页脚 -->
      <p style="color:#888;font-size:12px;margin-top:32px;text-align:center;">— MYGARDENOS.COM</p>
    </div>
  `;

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: emailFrom,
    to,
    subject,
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
        subject,
        error: result.error.message,
      },
    }).catch((dbErr) => console.error("[notifications] Failed to write invite failure audit log:", dbErr));

    await recordInviteSend(input.event.id, to, 'failed', result.error.message).catch((dbErr) =>
      console.error("[notifications] Failed to record failed invite send:", dbErr)
    );

    return { queued: false, reason: result.error.message };
  }

  console.log(`[notifications] Invite email sent from ${emailFrom} to ${to} for event ${input.event.id}`);
  await recordInviteSend(input.event.id, to, 'sent').catch((dbErr) =>
    console.error("[notifications] Failed to record successful invite send:", dbErr)
  );
  return { queued: true };
}
