#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx < 0) continue;
    const key = t.slice(0, idx).trim();
    const value = t.slice(idx + 1).trim();
    process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL / DATABASE_URL_UNPOOLED missing");
  }

  const pool = new Pool({ connectionString, ssl: true });
  try {
    const failed = await pool.query(
      `SELECT id, entity_id, action, after_data, created_at
       FROM live_event_audit_logs
       WHERE action = 'email_send_failed'
       ORDER BY created_at DESC
       LIMIT 10`
    );

    const recentRsvp = await pool.query(
      `SELECT id, event_id, email, full_name, status, created_at
       FROM live_rsvps
       ORDER BY created_at DESC
       LIMIT 5`
    );

    console.log("=== email_send_failed (latest 10) ===");
    console.log(JSON.stringify(failed.rows, null, 2));
    console.log("\n=== recent rsvps (latest 5) ===");
    console.log(JSON.stringify(recentRsvp.rows, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
