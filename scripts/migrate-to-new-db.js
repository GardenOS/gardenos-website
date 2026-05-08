#!/usr/bin/env node
/**
 * 数据库迁移脚本：从旧 Neon 迁移到新 Neon
 * 1. 在新库跑所有 migrations（建表）
 * 2. 从旧库逐表读取数据
 * 3. 写入新库
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// ── 旧库（从当前 .env.local 读取）──────────────────────────────────────
const envLocalPath = path.join(__dirname, "../.env.local");
const envLocal = fs.readFileSync(envLocalPath, "utf8");
const envMap = {};
envLocal.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#")) {
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      envMap[key] = value;
    }
  }
});

const OLD_URL = envMap["DATABASE_URL_UNPOOLED"] || envMap["DATABASE_URL"];

// ── 新库（直接硬编码，迁移完成后脚本可删除）────────────────────────────
const NEW_URL =
  "postgresql://neondb_owner:npg_yGc9xsa8rhTM@ep-calm-surf-a7d5dv67.ap-southeast-2.aws.neon.tech/neondb?sslmode=require";

if (!OLD_URL) {
  console.error("❌ 找不到旧库连接串，请确认 .env.local 里有 DATABASE_URL");
  process.exit(1);
}

if (OLD_URL === NEW_URL || OLD_URL.includes("ep-calm-surf-a7d5dv67")) {
  console.error("❌ 旧库和新库地址相同，请检查");
  process.exit(1);
}

console.log("旧库 host:", OLD_URL.match(/@([^/]+)\//)?.[1] ?? "unknown");
console.log("新库 host:", NEW_URL.match(/@([^/]+)\//)?.[1] ?? "unknown");
console.log("");

const oldPool = new Pool({ connectionString: OLD_URL, ssl: true });
const newPool = new Pool({ connectionString: NEW_URL, ssl: true });

// ── 需要迁移的表（顺序很重要，避免外键依赖） ──────────────────────────
const TABLES = [
  "live_events",
  "live_rsvps",
  "live_event_audit_logs",
  "registrations",
  "survey_responses",
  "clerk_users",
  "internal_access_whitelist",
  "page_views",
  // "airtable_customers" not in old DB, skip
];

async function runMigrations(client) {
  const migrationsDir = path.join(__dirname, "../src/backend/db/migrations");
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  console.log(`── 在新库执行 ${files.length} 个迁移 ──`);
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    await client.query(sql);
    console.log(`  ✓ ${file}`);
  }
  console.log("");
}

async function migrateTable(oldClient, newClient, table) {
  // 检查旧库里表是否存在
  const exists = await oldClient.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  if (exists.rowCount === 0) {
    console.log(`  ⚠  ${table} 在旧库不存在，跳过`);
    return 0;
  }

  const { rows } = await oldClient.query(`SELECT * FROM public.${table} ORDER BY 1`);
  if (rows.length === 0) {
    console.log(`  –  ${table}: 0 行`);
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const insertSql = `INSERT INTO public.${table} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

  let count = 0;
  for (const row of rows) {
    await newClient.query(insertSql, columns.map((c) => row[c]));
    count++;
  }

  // 同步序列（BIGSERIAL / SERIAL 主键）
  try {
    await newClient.query(
      `SELECT setval(pg_get_serial_sequence('public.${table}', 'id'), COALESCE((SELECT MAX(id) FROM public.${table}), 1))`
    );
  } catch (_) {
    // 没有 id 序列的表忽略
  }

  console.log(`  ✓  ${table}: ${count} 行`);
  return count;
}

async function main() {
  const oldClient = await oldPool.connect();
  const newClient = await newPool.connect();

  try {
    // 1. 建表
    await runMigrations(newClient);

    // 2. 逐表迁移
    console.log("── 迁移数据 ──");
    let total = 0;
    for (const table of TABLES) {
      total += await migrateTable(oldClient, newClient, table);
    }

    console.log(`\n✅ 迁移完成，共迁移 ${total} 行`);
  } catch (err) {
    console.error("\n❌ 迁移失败:", err.message);
    throw err;
  } finally {
    oldClient.release();
    newClient.release();
    await oldPool.end();
    await newPool.end();
  }
}

main().catch(() => process.exit(1));
