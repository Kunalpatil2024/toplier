begin;

alter table public.listings
  add column if not exists owner_id uuid references auth.users (id) on delete set null;

alter table public.listings
  drop constraint if exists listings_rank_value_valid;
alter table public.listings
  add constraint listings_rank_value_valid
  check (rank_value between 1 and 1000000000 and rank_value = trunc(rank_value));

alter table public.climb_events
  drop constraint if exists climb_events_previous_rank_value_check;
alter table public.climb_events
  add constraint climb_events_previous_rank_value_check
  check (previous_rank_value > 0);

create index if not exists listings_owner_id_idx on public.listings (owner_id);

revoke insert, update, delete on public.listings from public, anon, authenticated;
grant select on public.listings to anon, authenticated;
revoke all on public.climb_events from public, anon, authenticated;
revoke all on function public.create_listing(text, text, text, text, text, text, numeric)
  from public, anon, authenticated;
revoke all on function public.climb_listing(uuid, numeric)
  from public, anon, authenticated;

create or replace function public.create_listing(
  p_name text,
  p_description text,
  p_website_url text,
  p_category text,
  p_twitter_url text,
  p_logo_url text,
  p_rank_value numeric
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_listing_id uuid;
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'Sign in before submitting a listing.' using errcode = '42501';
  end if;

  perform 1
  from public.leaderboard_settings
  where id = true
  for update;

  if not found then
    raise exception 'Leaderboard settings are missing.' using errcode = '55000';
  end if;

  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 60 then
    raise exception 'Product name must be between 2 and 60 characters.' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_description, ''))) not between 10 and 280 then
    raise exception 'Description must be between 10 and 280 characters.' using errcode = '22023';
  end if;
  if coalesce(p_website_url, '') !~* '^https?://[^[:space:]]+$' then
    raise exception 'Enter a valid website URL.' using errcode = '22023';
  end if;
  if p_category not in ('AI', 'SaaS', 'Startups', 'Creators', 'Gaming', 'Developer Tools', 'Student Projects', 'Other') then
    raise exception 'Choose a valid category.' using errcode = '22023';
  end if;
  if p_twitter_url is not null and p_twitter_url !~* '^https?://(www\.)?(x\.com|twitter\.com)/[^[:space:]]*$' then
    raise exception 'Enter a valid X or Twitter URL.' using errcode = '22023';
  end if;
  if p_logo_url is not null and p_logo_url !~* '^https?://[^[:space:]]+$' then
    raise exception 'Enter a valid logo URL.' using errcode = '22023';
  end if;
  if p_rank_value is null or p_rank_value not between 99 and 1000000000 or p_rank_value <> trunc(p_rank_value) then
    raise exception 'Starting value must be a whole amount between ₹99 and ₹1,000,000,000.' using errcode = '22023';
  end if;

  insert into public.listings (
    name, description, website_url, category, twitter_url, logo_url, rank_value, owner_id
  )
  values (
    btrim(p_name), btrim(p_description), p_website_url, p_category,
    p_twitter_url, p_logo_url, p_rank_value, v_owner_id
  )
  returning id into v_listing_id;

  return v_listing_id;
end;
$$;

create or replace function public.climb_listing(
  p_listing_id uuid,
  p_new_rank_value numeric
)
returns table (new_rank_value numeric, next_required_value numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_current_rank_value numeric;
  v_current_leader_id uuid;
  v_current_leader_value numeric;
  v_required_rank_value numeric;
  v_increment constant integer := 5;
begin
  if v_user_id is null then
    raise exception 'Sign in to climb your listing.' using errcode = '42501';
  end if;

  perform 1
  from public.leaderboard_settings
  where id = true
  for update;

  if not found then
    raise exception 'Leaderboard settings are missing.' using errcode = '55000';
  end if;

  select rank_value, owner_id
  into v_current_rank_value, v_owner_id
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found.' using errcode = 'P0002';
  end if;
  if v_owner_id is distinct from v_user_id then
    raise exception 'You can only climb a listing you own.' using errcode = '42501';
  end if;

  select id, rank_value
  into v_current_leader_id, v_current_leader_value
  from public.listings
  order by rank_value desc, created_at asc, id asc
  limit 1;

  if v_current_leader_id = p_listing_id then
    raise exception 'This listing is already #1. No climb is needed.' using errcode = '22023';
  end if;

  v_required_rank_value := v_current_leader_value + v_increment;
  if p_new_rank_value is null
    or p_new_rank_value not between 1 and 1000000000
    or p_new_rank_value <> trunc(p_new_rank_value) then
    raise exception 'Enter a valid positive whole amount.' using errcode = '22023';
  end if;
  if p_new_rank_value < v_required_rank_value then
    raise exception 'The current #1 requires at least ₹%. Refresh the page and try again.', v_required_rank_value
      using errcode = '22023';
  end if;
  if p_new_rank_value <= v_current_rank_value then
    raise exception 'The new value must be higher than this listing''s current value.' using errcode = '22023';
  end if;

  update public.listings
  set rank_value = p_new_rank_value
  where id = p_listing_id;

  insert into public.climb_events (listing_id, previous_rank_value, new_rank_value)
  values (p_listing_id, v_current_rank_value, p_new_rank_value);

  return query select p_new_rank_value, p_new_rank_value + v_increment;
end;
$$;

revoke all on function public.create_listing(text, text, text, text, text, text, numeric)
  from public, anon, authenticated;
revoke all on function public.climb_listing(uuid, numeric)
  from public, anon, authenticated;
grant execute on function public.create_listing(text, text, text, text, text, text, numeric)
  to authenticated;
grant execute on function public.climb_listing(uuid, numeric)
  to authenticated;

commit;
