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
  console.error('ERROR: DATABASE_URL or DATABASE_URL_UNPOOLED not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: true,
});

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('✓ Connected to Neon database');

    // Test: Check if tables exist
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    
    console.log(`✓ Found ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Test: Query live_events table
    const eventsResult = await client.query(`SELECT COUNT(*) FROM live_events`);
    console.log(`\n✓ live_events table: ${eventsResult.rows[0].count} records`);

    // Create a test event
    const testEventResult = await client.query(
      `INSERT INTO live_events (slug, title, status, visibility) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, slug, title, status, visibility, created_at`,
      ['test-event-' + Date.now(), 'Test Live Event', 'prelive', 'published']
    );
    
    const testEvent = testEventResult.rows[0];
    console.log(`\n✓ Created test event:`);
    console.log(`  ID: ${testEvent.id}`);
    console.log(`  Title: ${testEvent.title}`);
    console.log(`  Status: ${testEvent.status}`);
    console.log(`  Visibility: ${testEvent.visibility}`);

    // Test: Insert RSVP
    const rsvpResult = await client.query(
      `INSERT INTO live_rsvps (event_id, email, full_name, source) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, status, registered_at`,
      [testEvent.id, 'test@example.com', 'Test User', 'test']
    );
    
    const testRsvp = rsvpResult.rows[0];
    console.log(`\n✓ Created test RSVP:`);
    console.log(`  Email: ${testRsvp.email}`);
    console.log(`  Status: ${testRsvp.status}`);

    // Test: Query RSVPs for the event
    const rsvpsResult = await client.query(
      `SELECT COUNT(*) FROM live_rsvps WHERE event_id = $1`,
      [testEvent.id]
    );
    console.log(`\n✓ Found ${rsvpsResult.rows[0].count} RSVPs for this event`);

    console.log('\n✅ All database tests passed!');
    console.log('\nDatabase is ready to use. You can now start the dev server with: npm run dev');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabase();
