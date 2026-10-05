begin;

alter table public.climb_events
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_order_id text;

create unique index if not exists climb_events_razorpay_payment_id_uidx
  on public.climb_events (razorpay_payment_id)
  where razorpay_payment_id is not null;

create unique index if not exists climb_events_razorpay_order_id_uidx
  on public.climb_events (razorpay_order_id)
  where razorpay_order_id is not null;

drop function if exists public.climb_listing(uuid, integer);
drop function if exists public.climb_listing(uuid, numeric);

create or replace function public.complete_paid_climb(
  p_listing_id uuid,
  p_user_id uuid,
  p_new_rank_value numeric,
  p_razorpay_payment_id text,
  p_razorpay_order_id text
)
returns table (new_rank_value numeric, next_required_value numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid;
  v_current_rank_value numeric;
  v_current_leader_id uuid;
  v_current_leader_value numeric;
  v_required_rank_value numeric;
  v_increment integer;
begin
  if p_user_id is null or p_razorpay_payment_id is null or p_razorpay_order_id is null then
    raise exception 'Verified payment details are required.' using errcode = '22023';
  end if;

  select minimum_increment
  into v_increment
  from public.leaderboard_settings
  where id = true
  for update;

  if not found then
    raise exception 'Leaderboard settings are missing.' using errcode = '55000';
  end if;

  select owner_id, rank_value
  into v_owner_id, v_current_rank_value
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found.' using errcode = 'P0002';
  end if;
  if v_owner_id is distinct from p_user_id then
    raise exception 'You can only climb a listing you own.' using errcode = '42501';
  end if;

  select id, rank_value
  into v_current_leader_id, v_current_leader_value
  from public.listings
  order by rank_value desc, created_at asc, id asc
  limit 1;

  if v_current_leader_id = p_listing_id then
    raise exception 'This listing is already #1.' using errcode = '22023';
  end if;

  v_required_rank_value := v_current_leader_value + v_increment;
  if p_new_rank_value is null
    or p_new_rank_value not between 1 and 1000000000
    or p_new_rank_value <> trunc(p_new_rank_value)
    or p_new_rank_value < v_required_rank_value
    or p_new_rank_value <= v_current_rank_value then
    raise exception 'The leaderboard changed or the climb value is invalid. The rank was not updated.'
      using errcode = '22023';
  end if;

  insert into public.climb_events (
    listing_id,
    previous_rank_value,
    new_rank_value,
    razorpay_payment_id,
    razorpay_order_id
  )
  values (
    p_listing_id,
    v_current_rank_value,
    p_new_rank_value,
    p_razorpay_payment_id,
    p_razorpay_order_id
  );

  update public.listings
  set rank_value = p_new_rank_value
  where id = p_listing_id;

  return query select p_new_rank_value, p_new_rank_value + v_increment;
end;
$$;

revoke all on function public.complete_paid_climb(uuid, uuid, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.complete_paid_climb(uuid, uuid, numeric, text, text)
  to service_role;

commit;
