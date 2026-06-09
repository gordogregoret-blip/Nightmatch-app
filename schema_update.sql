-- ============================================================
-- NIGHTMATCH — Schema Update v2
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agregar drink_prefs a profiles
alter table profiles add column if not exists drink_prefs text[] default '{}';
alter table profiles add column if not exists bio text default '';

-- ============================================================
-- EVENTS (eventos dentro de una noche)
-- ============================================================
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  night_id    uuid references nights(id) on delete set null,
  name        text not null,
  description text,
  start_time  time,
  end_time    time,
  emoji       text default '🎉',
  is_active   boolean default true,
  created_at  timestamptz default now()
);
alter table events enable row level security;
create policy "Eventos visibles" on events for select using (true);
create policy "Admin insert evento" on events for insert with check (
  exists (select 1 from venue_admins where venue_id = events.venue_id and user_id = auth.uid())
);
create policy "Admin update evento" on events for update using (
  exists (select 1 from venue_admins where venue_id = events.venue_id and user_id = auth.uid())
);

-- ============================================================
-- VENUE_ADS (publicidades / banners del venue)
-- ============================================================
create table if not exists venue_ads (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  title       text not null,
  description text,
  cta_text    text default 'Ver más',
  is_active   boolean default true,
  created_at  timestamptz default now()
);
alter table venue_ads enable row level security;
create policy "Ads visibles" on venue_ads for select using (true);
create policy "Admin insert ad" on venue_ads for insert with check (
  exists (select 1 from venue_admins where venue_id = venue_ads.venue_id and user_id = auth.uid())
);
create policy "Admin update ad" on venue_ads for update using (
  exists (select 1 from venue_admins where venue_id = venue_ads.venue_id and user_id = auth.uid())
);
create policy "Admin delete ad" on venue_ads for delete using (
  exists (select 1 from venue_admins where venue_id = venue_ads.venue_id and user_id = auth.uid())
);

-- ============================================================
-- VENUE_ADMINS (usuarios que administran un venue)
-- ============================================================
create table if not exists venue_admins (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid not null references venues(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        text default 'admin',
  created_at  timestamptz default now(),
  unique(venue_id, user_id)
);
alter table venue_admins enable row level security;
create policy "Admin ve sus venues" on venue_admins for select using (auth.uid() = user_id);
create policy "Admin insert" on venue_admins for insert with check (auth.uid() = user_id);

-- Policies para que admins puedan editar sus venues
create policy "Admin update venue" on venues for update using (
  exists (select 1 from venue_admins where venue_id = venues.id and user_id = auth.uid())
);
create policy "Admin insert night" on nights for insert with check (
  exists (select 1 from venue_admins where venue_id = nights.venue_id and user_id = auth.uid())
);
create policy "Admin update night" on nights for update using (
  exists (select 1 from venue_admins where venue_id = nights.venue_id and user_id = auth.uid())
);
create policy "Admin insert promo" on promotions for insert with check (
  exists (
    select 1 from nights n
    join venue_admins va on va.venue_id = n.venue_id
    where n.id = promotions.night_id and va.user_id = auth.uid()
  )
);
create policy "Admin update promo" on promotions for update using (
  exists (
    select 1 from nights n
    join venue_admins va on va.venue_id = n.venue_id
    where n.id = promotions.night_id and va.user_id = auth.uid()
  )
);

-- ============================================================
-- Actualizar trigger de match: ventana 8pm–8am
-- ============================================================
create or replace function check_mutual_like()
returns trigger language plpgsql security definer as $$
declare
  existing_like uuid;
  night_expires timestamptz;
begin
  select id into existing_like
  from likes
  where from_user_id = NEW.to_user_id
    and to_user_id   = NEW.from_user_id
    and night_id     = NEW.night_id;

  if existing_like is not null then
    -- Ventana: 8pm a 8am del día siguiente
    -- Si son las 2am, expira hoy a las 8am
    -- Si son las 10pm, expira mañana a las 8am
    if extract(hour from now() at time zone 'America/Argentina/Buenos_Aires') < 8 then
      night_expires := date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
                       + time '08:00' - interval '3 hours'; -- back to UTC
    else
      night_expires := date_trunc('day', now() at time zone 'America/Argentina/Buenos_Aires')
                       + interval '1 day' + time '08:00' - interval '3 hours';
    end if;

    insert into matches (user_a_id, user_b_id, venue_id, night_id, expires_at)
    values (NEW.from_user_id, NEW.to_user_id, NEW.venue_id, NEW.night_id, night_expires)
    on conflict do nothing;
  end if;

  return NEW;
end;
$$;

drop trigger if exists on_like_insert on likes;
create trigger on_like_insert
  after insert on likes
  for each row execute function check_mutual_like();

-- ============================================================
-- Hacer admin del venue de prueba al usuario test
-- ============================================================
insert into venue_admins (venue_id, user_id)
select v.id, p.id
from venues v, profiles p
where p.id in (select id from auth.users where email = 'test@nightmatch.com')
on conflict do nothing;
