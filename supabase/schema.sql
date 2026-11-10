-- =========================================================
-- Goldenstream Scoreboard — Supabase schema
-- شغّل الملف ده كله مرة واحدة في: SQL Editor → New query → Run
-- =========================================================

-- ---------- Tables ----------
create table if not exists public.boards (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title         text not null default 'LIVE',

  team_a_name   text not null default 'Home',
  team_a_score  int  not null default 0 check (team_a_score >= 0),
  team_a_bg     text not null default '#C8102E',
  team_a_text   text not null default '#FFFFFF',
  team_a_logo   text,

  team_b_name   text not null default 'Away',
  team_b_score  int  not null default 0 check (team_b_score >= 0),
  team_b_bg     text not null default '#1D4ED8',
  team_b_text   text not null default '#FFFFFF',
  team_b_logo   text,

  board_bg      text not null default '#14161F',
  board_text    text not null default '#FFFFFF',

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists boards_owner_idx on public.boards(owner_id, created_at desc);

create table if not exists public.saved_teams (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  bg          text not null,
  text_color  text not null,
  logo_url    text,
  created_at  timestamptz not null default now()
);

create index if not exists saved_teams_owner_idx on public.saved_teams(owner_id, created_at desc);

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists boards_touch on public.boards;
create trigger boards_touch before update on public.boards
for each row execute function public.touch_updated_at();

-- ---------- Row Level Security ----------
alter table public.boards      enable row level security;
alter table public.saved_teams enable row level security;

-- صفحة الـ Display لازم تشتغل من غير login (OBS)، فالقراءة مفتوحة لأي حد معاه الـ id
drop policy if exists "boards readable by link" on public.boards;
create policy "boards readable by link" on public.boards
  for select using (true);

drop policy if exists "owner inserts boards" on public.boards;
create policy "owner inserts boards" on public.boards
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "owner updates boards" on public.boards;
create policy "owner updates boards" on public.boards
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "owner deletes boards" on public.boards;
create policy "owner deletes boards" on public.boards
  for delete to authenticated using (auth.uid() = owner_id);

drop policy if exists "owner manages saved teams" on public.saved_teams;
create policy "owner manages saved teams" on public.saved_teams
  for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------- Atomic score change ----------
-- بيزود/ينقص السكور جوه الداتابيز نفسها، فلو اتنين بيدوسوا في نفس اللحظة مفيش ضغطة بتضيع
create or replace function public.bump_score(p_board uuid, p_team text, p_delta int)
returns void
language sql
security invoker
as $$
  update public.boards set
    team_a_score = case when p_team = 'a' then greatest(0, team_a_score + p_delta) else team_a_score end,
    team_b_score = case when p_team = 'b' then greatest(0, team_b_score + p_delta) else team_b_score end
  where id = p_board and owner_id = auth.uid();
$$;

grant execute on function public.bump_score(uuid, text, int) to authenticated;

-- ---------- Realtime ----------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'boards'
  ) then
    alter publication supabase_realtime add table public.boards;
  end if;
end $$;

-- ---------- Storage (team logos) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152,
        array['image/png','image/jpeg','image/svg+xml','image/gif','image/webp'])
on conflict (id) do nothing;

-- كل يوزر يرفع ويمسح جوه فولدر باسمه بس: logos/<user_id>/...
drop policy if exists "users upload own logos" on storage.objects;
create policy "users upload own logos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "users delete own logos" on storage.objects;
create policy "users delete own logos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
