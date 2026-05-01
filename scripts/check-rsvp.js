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

const pool = new Pool({
  connectionString,
  ssl: true,
});

async function checkRsvp() {
  const client = await pool.connect();
  
  try {
    console.log('Checking for testuser@example.com RSVP...\n');

    // Query recent RSVPs
    const result = await client.query(
      `SELECT r.id, r.event_id, r.email, r.full_name, r.status, r.registered_at,
              e.title, e.status as event_status
       FROM live_rsvps r
       LEFT JOIN live_events e ON r.event_id = e.id
       WHERE r.email = 'testuser@example.com'
       ORDER BY r.registered_at DESC
       LIMIT 5`
    );
    
    if (result.rows.length === 0) {
      console.log('✓ No exact match yet (data may have deduplication), checking all RSVPs:');
      
      const allRsvps = await client.query(
        `SELECT r.id, r.email, r.full_name, r.status, r.registered_at,
                e.title
         FROM live_rsvps r
         LEFT JOIN live_events e ON r.event_id = e.id
         ORDER BY r.registered_at DESC
         LIMIT 10`
      );
      
      console.log(`\nTotal RSVPs in database: ${allRsvps.rows.length}`);
      console.log('\nRecent RSVPs:');
      allRsvps.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. Email: ${row.email}, Event: ${row.title}, Status: ${row.status}, Time: ${row.registered_at}`);
      });
    } else {
      console.log(`✅ Found ${result.rows.length} RSVP record(s) for testuser@example.com:\n`);
      result.rows.forEach((row, idx) => {
        console.log(`Record ${idx + 1}:`);
        console.log(`  RSVP ID: ${row.id}`);
        console.log(`  Email: ${row.email}`);
        console.log(`  Name: ${row.full_name}`);
        console.log(`  Event: ${row.title} (${row.event_status})`);
        console.log(`  RSVP Status: ${row.status}`);
        console.log(`  Registered: ${row.registered_at}`);
      });
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkRsvp();
