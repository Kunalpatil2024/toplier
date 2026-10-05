create table if not exists public.leaderboard_settings (
  id boolean primary key default true check (id),
  minimum_increment integer not null default 5 check (minimum_increment > 0)
);

insert into public.leaderboard_settings (id, minimum_increment)
values (true, 5)
on conflict (id) do nothing;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  description text not null check (char_length(btrim(description)) between 10 and 280),
  website_url text not null check (website_url ~* '^https?://[^[:space:]]+$'),
  category text not null check (category in ('AI', 'SaaS', 'Startups', 'Creators', 'Gaming', 'Developer Tools', 'Student Projects', 'Other')),
  twitter_url text check (twitter_url is null or twitter_url ~* '^https?://(www\.)?(x\.com|twitter\.com)/[^[:space:]]*$'),
  logo_url text check (logo_url is null or logo_url ~* '^https?://[^[:space:]]+$'),
  rank_value numeric not null default 99,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.climb_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  previous_rank_value numeric not null check (previous_rank_value >= 99),
  new_rank_value numeric not null check (new_rank_value > previous_rank_value),
  created_at timestamptz not null default now()
);

alter table public.listings
  alter column rank_value type numeric using rank_value::numeric,
  alter column rank_value set default 99,
  alter column rank_value set not null;

alter table public.listings drop constraint if exists listings_rank_value_valid;
alter table public.listings
  add constraint listings_rank_value_valid
  check (rank_value between 99 and 1000000000 and rank_value = trunc(rank_value));

alter table public.climb_events
  alter column previous_rank_value type numeric using previous_rank_value::numeric,
  alter column new_rank_value type numeric using new_rank_value::numeric;

create index if not exists listings_rank_value_idx on public.listings (rank_value desc);
create index if not exists listings_category_idx on public.listings (category);
create index if not exists climb_events_listing_id_idx on public.climb_events (listing_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_set_updated_at on public.listings;
create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

alter table public.listings enable row level security;
alter table public.users enable row level security;
alter table public.climb_events enable row level security;
alter table public.leaderboard_settings enable row level security;

drop policy if exists "Listings are publicly readable" on public.listings;
create policy "Listings are publicly readable"
on public.listings for select to anon, authenticated using (true);

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
on public.users for select to authenticated using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Leaderboard settings are publicly readable" on public.leaderboard_settings;
create policy "Leaderboard settings are publicly readable"
on public.leaderboard_settings for select to anon, authenticated using (true);

revoke all on public.listings from public, anon, authenticated;
revoke all on public.climb_events from public, anon, authenticated;
revoke all on public.leaderboard_settings from public, anon, authenticated;
grant select on public.listings to anon, authenticated;
grant select on public.leaderboard_settings to anon, authenticated;
grant select, update on public.users to authenticated;

drop function if exists public.create_listing(text, text, text, text, text, text, integer);
drop function if exists public.climb_listing(uuid, integer);

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
begin
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

  insert into public.listings (name, description, website_url, category, twitter_url, logo_url, rank_value)
  values (btrim(p_name), btrim(p_description), p_website_url, p_category, p_twitter_url, p_logo_url, p_rank_value)
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
  v_current_rank_value numeric;
  v_value_to_beat numeric;
  v_required_rank_value numeric;
  v_increment constant integer := 5;
begin
  perform 1
  from public.leaderboard_settings
  where id = true
  for update;

  if not found then
    raise exception 'Leaderboard settings are missing.' using errcode = '55000';
  end if;
  if p_new_rank_value is null or p_new_rank_value not between 99 and 1000000000 or p_new_rank_value <> trunc(p_new_rank_value) then
    raise exception 'Enter a valid positive whole amount.' using errcode = '22023';
  end if;

  select rank_value into v_current_rank_value
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found.' using errcode = 'P0002';
  end if;

  with ranked as (
    select id, rank_value,
      row_number() over (order by rank_value desc, created_at asc, id asc) as position
    from public.listings
  )
  select above.rank_value into v_value_to_beat
  from ranked as current_listing
  join ranked as above on above.position = current_listing.position - 1
  where current_listing.id = p_listing_id;

  if v_value_to_beat is null then
    v_value_to_beat := v_current_rank_value;
  end if;

  v_required_rank_value := v_value_to_beat + v_increment;
  if p_new_rank_value < v_required_rank_value or p_new_rank_value <= v_current_rank_value then
    raise exception 'This climb needs at least ₹%.', v_required_rank_value using errcode = '22023';
  end if;

  update public.listings
  set rank_value = p_new_rank_value
  where id = p_listing_id;

  insert into public.climb_events (listing_id, previous_rank_value, new_rank_value)
  values (p_listing_id, v_current_rank_value, p_new_rank_value);

  return query select p_new_rank_value, p_new_rank_value + v_increment;
end;
$$;

revoke all on function public.create_listing(text, text, text, text, text, text, numeric) from public, anon, authenticated;
revoke all on function public.climb_listing(uuid, numeric) from public, anon, authenticated;
grant execute on function public.create_listing(text, text, text, text, text, text, numeric) to service_role;
grant execute on function public.climb_listing(uuid, numeric) to service_role;