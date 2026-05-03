-- Add promo video URL and poster URL to live_events
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS promo_video_url TEXT;
ALTER TABLE live_events ADD COLUMN IF NOT EXISTS poster_url TEXT;
