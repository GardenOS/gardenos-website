-- Live backend indexes
CREATE INDEX IF NOT EXISTS idx_live_events_status_visibility
  ON live_events(status, visibility);

CREATE INDEX IF NOT EXISTS idx_live_events_scheduled_start
  ON live_events(scheduled_start_at);

CREATE INDEX IF NOT EXISTS idx_live_rsvps_event_status
  ON live_rsvps(event_id, status);

CREATE INDEX IF NOT EXISTS idx_live_rsvps_registered_at
  ON live_rsvps(registered_at DESC);

CREATE INDEX IF NOT EXISTS idx_live_event_audit_logs_entity
  ON live_event_audit_logs(entity_type, entity_id, created_at DESC);
