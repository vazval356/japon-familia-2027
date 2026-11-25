-- Votación de la guía de Japón 2027
-- Pegar entero en Supabase > SQL Editor > New query > Run

create table if not exists public.votes (
  person     text        not null check (char_length(person) between 1 and 30),
  item       text        not null check (item ~ '^[a-z0-9]{2,20}$'),
  vote       text        not null check (vote in ('si', 'quiza', 'no')),
  updated_at timestamptz not null default now(),
  primary key (person, item)
);

alter table public.votes enable row level security;

grant select, insert, update, delete on public.votes to anon;

-- Cualquiera con el enlace de la guía puede ver y emitir votos (sin cuentas).
create policy "leer votos"   on public.votes for select to anon using (true);
create policy "votar"        on public.votes for insert to anon with check (true);
create policy "cambiar voto" on public.votes for update to anon using (true) with check (true);
create policy "quitar voto"  on public.votes for delete to anon using (true);
