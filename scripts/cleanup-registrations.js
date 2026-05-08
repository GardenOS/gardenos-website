#!/usr/bin/env node
// Dedup registrations: keep only the latest record per email

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '../.env.local');
const envLocal = fs.readFileSync(envLocalPath, 'utf8');
envLocal.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = value;
    }
  }
});

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
  // Show current state
  const before = await pool.query('SELECT email, COUNT(*) as cnt FROM registrations GROUP BY email ORDER BY cnt DESC');
  console.log('Current registrations per email:');
  before.rows.forEach(r => console.log(`  ${r.email}: ${r.cnt} records`));

  // Delete duplicates, keep the latest (highest id) per email
  const result = await pool.query(`
    DELETE FROM registrations
    WHERE id NOT IN (
      SELECT MAX(id) FROM registrations GROUP BY lower(email)
    )
  `);
  console.log(`\nDeleted ${result.rowCount} duplicate records.`);

  // Show after state
  const after = await pool.query('SELECT email, name, submitted_at FROM registrations ORDER BY submitted_at DESC');
  console.log('\nRemaining registrations:');
  after.rows.forEach(r => console.log(`  [${r.email}] ${r.name} - ${r.submitted_at}`));

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
