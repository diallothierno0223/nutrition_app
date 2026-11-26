-- Règles du médecin : consignes datées en texte libre, archivées plutôt que supprimées (ticket 10).
create type public.categorie_de_regle as enum ('a_privilegier', 'a_eviter', 'conseil');

create table public.regles_medecin (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  categorie public.categorie_de_regle not null,
  texte text not null check (length(btrim(texte)) > 0),
  date_consultation date not null,
  -- null : la Règle est active et transmise à l'IA ; sinon, date de son archivage.
  archivee_le timestamptz,
  cree_le timestamptz not null default now()
);

alter table public.regles_medecin enable row level security;

create policy "Chacun lit ses propres Règles du médecin"
  on public.regles_medecin for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Chacun ajoute ses propres Règles du médecin"
  on public.regles_medecin for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Chacun modifie ou archive ses propres Règles du médecin"
  on public.regles_medecin for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Pas de politique de suppression : une Règle s'archive, elle ne se supprime jamais (sauf avec le compte).
