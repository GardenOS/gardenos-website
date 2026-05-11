-- Extend invite send status to include skipped results for batch invite visibility
ALTER TABLE live_invite_send_records
  DROP CONSTRAINT IF EXISTS live_invite_send_records_status_check;

ALTER TABLE live_invite_send_records
  ADD CONSTRAINT live_invite_send_records_status_check
  CHECK (status IN ('sent', 'failed', 'skipped'));
