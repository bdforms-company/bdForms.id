-- Create batch check-in function to handle high throughput offline-sync reconciliation
create or replace function batch_check_in(tokens text[])
returns void as $$
begin
  update participants
  set is_checked_in = true,
      check_in_time = now()
  where qr_token = any(tokens);
end;
$$ language plpgsql;
