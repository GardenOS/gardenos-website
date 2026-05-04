#!/usr/bin/env node
/**
 * 邮件发送两步验证脚本
 * 步骤1：用 onboarding@resend.dev 发送 → 验证 API Key + 代码配置
 * 步骤2：用 info@mygardenos.com 发送   → 验证域名是否在 Resend 已生效
 *
 * 用法：node scripts/test-email.js
 */

const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx < 0) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}

async function sendOne(resend, from, to) {
  const result = await resend.emails.send({
    from,
    to,
    subject: `[测试] 邮件发送验证 — 来自 ${from}`,
    html: `
      <div style="font-family:sans-serif;padding:24px;">
        <h3>邮件发送测试</h3>
        <p>发件人：<strong>${from}</strong></p>
        <p>收件人：<strong>${to}</strong></p>
        <p>时间：${new Date().toISOString()}</p>
        <p style="color:#888;font-size:12px;">— MYGARDENOS.COM</p>
      </div>
    `,
  });
  return result;
}

async function main() {
  loadEnvLocal();

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("❌ RESEND_API_KEY 未配置");
    process.exit(1);
  }

  // Resend SDK (动态 require，避免 ESM 问题)
  const { Resend } = require("resend");
  const resend = new Resend(apiKey);

  // 收件人固定为账号本人（测试模式下 onboarding@resend.dev 只能发到自己）
  const TO = "haohan6037@gmail.com";

  console.log("=".repeat(55));
  console.log("步骤 1：用 onboarding@resend.dev 发送（验证 API Key）");
  console.log("=".repeat(55));
  const r1 = await sendOne(resend, "onboarding@resend.dev", TO);
  if (r1.error) {
    console.log(`❌ 失败：${r1.error.message}`);
  } else {
    console.log(`✅ 成功，邮件 ID：${r1.data?.id}`);
  }

  console.log("");
  console.log("=".repeat(55));
  console.log("步骤 2：用 info@mygardenos.com 发送（验证域名）");
  console.log("=".repeat(55));
  const r2 = await sendOne(resend, "info@mygardenos.com", TO);
  if (r2.error) {
    console.log(`❌ 失败：${r2.error.message}`);
  } else {
    console.log(`✅ 成功，邮件 ID：${r2.data?.id}`);
  }

  console.log("");
  console.log("检查你的 Gmail 收件箱：haohan6037@gmail.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
