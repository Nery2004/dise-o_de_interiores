create table if not exists color_palettes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  colors jsonb not null,
  created_at timestamptz default now()
);

alter table color_palettes enable row level security;

drop policy if exists "Public read color palettes" on color_palettes;
create policy "Public read color palettes"
on color_palettes
for select
using (true);

drop policy if exists "Public insert color palettes" on color_palettes;
create policy "Public insert color palettes"
on color_palettes
for insert
with check (true);
