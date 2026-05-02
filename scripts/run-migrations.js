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
