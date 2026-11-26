-- Réglages de l'utilisateur : une ligne par compte, créée à la création du compte.
-- Les colonnes (heures de notification, paramètres du samedi…) arrivent avec leurs tickets.
create table public.reglages (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cree_le timestamptz not null default now()
);

alter table public.reglages enable row level security;

create policy "Chacun lit ses propres Réglages"
  on public.reglages for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Chacun modifie ses propres Réglages"
  on public.reglages for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create function public.creer_reglages_du_compte()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.reglages (user_id) values (new.id);
  return new;
end;
$$;

create trigger creer_reglages_apres_creation_du_compte
  after insert on auth.users
  for each row execute function public.creer_reglages_du_compte();
