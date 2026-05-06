import { NextResponse } from "next/server";
import { createRsvpService } from "@/backend/rsvp/service";
import { verifyRsvpInviteToken } from "@/backend/rsvp/inviteToken";

export const runtime = "nodejs";

function html(message: string, status = 200, ctaHref = "/zh/live", ctaText = "返回直播页面"): NextResponse {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>RSVP</title></head><body style="font-family:sans-serif;padding:32px;line-height:1.6;"><h2>${message}</h2><p><a href="${ctaHref}">${ctaText}</a></p></body></html>`,
    {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const payload = verifyRsvpInviteToken(token);

  if (!payload) {
    return html("邀请链接无效或已过期。", 400, "/zh/live", "前往直播页面");
  }

  try {
    await createRsvpService({
      eventId: payload.eventId,
      email: payload.email,
      source: "email-invite-one-click",
      consentMarketing: false,
    });

    return html("预约成功！我们已为你完成预约，并会在直播开始前通过邮件通知你。", 200, "/zh/live", "去看直播");
  } catch {
    return html("预约失败，请稍后重试或重新打开邀请邮件。", 500, "/zh/live", "返回直播页面");
  }
}
