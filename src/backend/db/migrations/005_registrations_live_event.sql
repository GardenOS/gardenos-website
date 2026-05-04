-- Link registrations to a specific live event (nullable for historical data)
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS live_event_id UUID REFERENCES live_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_live_event_id
  ON public.registrations (live_event_id);
