#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envLocalPath = path.join(__dirname, '../.env.local');
const envLocal = fs.readFileSync(envLocalPath, 'utf8');
envLocal.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=');
    if (key) {
      process.env[key.trim()] = value.trim();
    }
  }
});

const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL or DATABASE_URL_UNPOOLED not set in environment');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  // For Neon, ensure SSL is handled properly
  ssl: true,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // Migration 001: Initial schema
    console.log('Running migration 001_init_live_tables.sql...');
    const migration001Path = path.join(__dirname, '../src/backend/db/migrations/001_init_live_tables.sql');
    const migration001 = fs.readFileSync(migration001Path, 'utf8');
    await client.query(migration001);
    console.log('✓ Migration 001 completed');

    // Migration 002: Indexes
    console.log('Running migration 002_live_indexes.sql...');
    const migration002Path = path.join(__dirname, '../src/backend/db/migrations/002_live_indexes.sql');
    const migration002 = fs.readFileSync(migration002Path, 'utf8');
    await client.query(migration002);
    console.log('✓ Migration 002 completed');

    // Migration 003: Promo video and poster columns
    console.log('Running migration 003_live_events_promo.sql...');
    const migration003Path = path.join(__dirname, '../src/backend/db/migrations/003_live_events_promo.sql');
    const migration003 = fs.readFileSync(migration003Path, 'utf8');
    await client.query(migration003);
    console.log('✓ Migration 003 completed');

    // Migration 004: Registrations table (replaces airtable_customers for intake)
    console.log('Running migration 004_registrations.sql...');
    const migration004Path = path.join(__dirname, '../src/backend/db/migrations/004_registrations.sql');
    const migration004 = fs.readFileSync(migration004Path, 'utf8');
    await client.query(migration004);
    console.log('✓ Migration 004 completed');

    // Migration 005: Link registrations to live_event_id
    console.log('Running migration 005_registrations_live_event.sql...');
    const migration005Path = path.join(__dirname, '../src/backend/db/migrations/005_registrations_live_event.sql');
    const migration005 = fs.readFileSync(migration005Path, 'utf8');
    await client.query(migration005);
    console.log('✓ Migration 005 completed');

    // Migration 006: Extend live_events.status with ended
    console.log('Running migration 006_live_event_status_ended.sql...');
    const migration006Path = path.join(__dirname, '../src/backend/db/migrations/006_live_event_status_ended.sql');
    const migration006 = fs.readFileSync(migration006Path, 'utf8');
    await client.query(migration006);
    console.log('✓ Migration 006 completed');

    console.log('\n✓ All migrations completed successfully!');
  } catch (error) {
    console.error('ERROR during migration:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
