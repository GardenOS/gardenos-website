-- Add English title for bilingual live event display
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS title_en TEXT;
