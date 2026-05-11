-- Track RSVP invite email sends to prevent duplicates and monitor delivery
CREATE TABLE IF NOT EXISTS live_invite_send_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES live_events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, email)
);

-- Index for efficient lookup of previously sent invites
CREATE INDEX IF NOT EXISTS idx_invite_send_records_event_email ON live_invite_send_records(event_id, email);
CREATE INDEX IF NOT EXISTS idx_invite_send_records_email ON live_invite_send_records(email);
