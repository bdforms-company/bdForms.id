-- Create batch check-in function to handle high throughput offline-sync reconciliation
-- Apply in Supabase SQL Editor if missing (sync falls back to /api/check-in + direct update).

create or replace function public.batch_check_in(tokens text[])
returns table (
  qr_token text,
  is_checked_in boolean,
  check_in_time timestamptz
)
language sql
security definer
set search_path = public
as $$
  update participants p
  set
    is_checked_in = true,
    check_in_time = coalesce(p.check_in_time, now())
  where p.qr_token = any(tokens)
  returning p.qr_token, p.is_checked_in, p.check_in_time;
$$;

-- Allow scanner clients (anon + authenticated) to call the RPC
grant execute on function public.batch_check_in(text[]) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
