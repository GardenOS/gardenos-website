#!/usr/bin/env node

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const envLocalPath = path.join(__dirname, "../.env.local");
const envLocal = fs.readFileSync(envLocalPath, "utf8");
envLocal.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const [key, ...valueParts] = trimmed.split("=");
  process.env[key.trim()] = valueParts.join("=").trim();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  ssl: true,
});

async function main() {
  const result = await pool.query(
    `SELECT r.email, r.full_name, e.title, e.status
     FROM live_rsvps r
     JOIN live_events e ON e.id = r.event_id
     WHERE r.email = $1
     ORDER BY r.registered_at DESC
     LIMIT 1`,
    ["nearest-guest@example.com"]
  );

  console.log(JSON.stringify(result.rows[0] ?? null));
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
