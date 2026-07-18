-- Create database-side grouping/summarization function for event participants
create or replace function public.get_event_summary(
  p_event_id uuid,
  p_group_by_key text,
  p_source_column text
)
returns table (
  group_value text,
  total_participants bigint,
  checked_in_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    coalesce(nullif(
      case
        when p_source_column = 'custom_data' then p.custom_data ->> p_group_by_key
        when p_source_column = 'extra_data' then p.extra_data ->> p_group_by_key
        when p_source_column = 'institution' then p.extra_data ->> 'institution'
        when p_source_column = 'phone' then p.extra_data ->> 'phone'
        else null
      end, ''
    ), 'Tidak Diketahui') as group_value,
    count(*)::bigint as total_participants,
    count(*) filter (where p.is_checked_in = true)::bigint as checked_in_count
  from participants p
  where p.event_id = p_event_id
  group by 1
  order by total_participants desc, group_value asc;
end;
$$;
