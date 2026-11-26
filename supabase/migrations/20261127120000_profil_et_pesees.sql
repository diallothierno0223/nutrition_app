-- Profil, Objectifs personnels, Objectif de poids et Pesées (ticket 08, ADR 0004).

-- Date de modification tenue à jour par la base : sert à proposer une réestimation des Objectifs.
-- Un réenregistrement à l'identique ne compte pas comme une modification.
create function public.noter_modification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new is not distinct from old then
    return new;
  end if;
  new.modifie_le := now();
  return new;
end;
$$;

create table public.profils (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  taille_cm numeric check (taille_cm between 100 and 250),
  date_naissance date check (date_naissance > '1900-01-01'),
  sexe text check (sexe in ('homme', 'femme')),
  niveau_activite text check (niveau_activite in ('sedentaire', 'leger', 'modere', 'actif', 'tres_actif')),
  fuseau text,
  objectifs_personnels text not null default '',
  -- Objectif de poids chiffré : variation visée (kg, négative pour perdre) et échéance.
  objectif_poids_variation_kg numeric check (objectif_poids_variation_kg between -50 and 50),
  objectif_poids_echeance date,
  modifie_le timestamptz not null default now()
);

create table public.pesees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pese_le date not null,
  poids_kg numeric not null check (poids_kg between 20 and 400),
  unique (user_id, pese_le)
);

alter table public.profils enable row level security;
alter table public.pesees enable row level security;

create policy "Chacun gère son propre Profil"
  on public.profils for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère ses propres Pesées"
  on public.pesees for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger noter_modification_du_profil
  before update on public.profils
  for each row execute function public.noter_modification();

-- Les Règles du médecin et les Objectifs journaliers suivent aussi leur date de modification.
alter table public.regles_medecin add column modifie_le timestamptz not null default now();
-- Les Règles existantes gardent leur date de création : sinon elles proposeraient toutes une réestimation.
update public.regles_medecin set modifie_le = cree_le;

create trigger noter_modification_de_la_regle
  before update on public.regles_medecin
  for each row execute function public.noter_modification();

create trigger noter_modification_des_objectifs
  before update on public.objectifs_journaliers
  for each row execute function public.noter_modification();
