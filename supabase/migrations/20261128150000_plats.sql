-- Plats réutilisables (ticket 07, voir GLOSSARY.md).
-- Un Plat est un modèle de Repas pour une portion. Le réutiliser copie ses Constituants (multipliés par le
-- Coefficient de portion dans le noyau métier) dans un nouveau Repas : aucun lien ne relie le Repas au Plat.

create table public.plats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nom text not null check (length(btrim(nom)) > 0),
  cree_le timestamptz not null default now()
);

create table public.constituants_de_plat (
  id uuid primary key default gen_random_uuid(),
  plat_id uuid not null references public.plats (id) on delete cascade,
  position integer not null,
  nom text not null,
  quantite numeric not null check (quantite >= 0),
  unite text not null check (unite in ('g', 'ml')),
  equivalent_cuisine text not null,
  calories numeric not null check (calories >= 0),
  proteines numeric not null check (proteines >= 0),
  glucides numeric not null check (glucides >= 0),
  sucres numeric not null check (sucres >= 0),
  lipides numeric not null check (lipides >= 0),
  ags numeric not null check (ags >= 0),
  fibres numeric not null check (fibres >= 0),
  sel numeric not null check (sel >= 0),
  unique (plat_id, position)
);

create index plats_par_utilisateur on public.plats (user_id);

alter table public.plats enable row level security;
alter table public.constituants_de_plat enable row level security;

create policy "Chacun gère ses propres Plats"
  on public.plats for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère les Constituants de ses Plats"
  on public.constituants_de_plat for all
  to authenticated
  using (exists (select 1 from public.plats p where p.id = plat_id and p.user_id = (select auth.uid())))
  with check (exists (select 1 from public.plats p where p.id = plat_id and p.user_id = (select auth.uid())));

-- Crée un Plat et ses Constituants (une portion) en une transaction ; renvoie son identifiant.
-- Sert à « Enregistrer comme Plat » depuis un Repas, et à garder une Recette comme Plat permanent.
create function public.creer_plat(p_nom text, p_constituants jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plat_id uuid;
begin
  if jsonb_array_length(p_constituants) = 0 then
    raise exception 'Un Plat a au moins un Constituant' using errcode = '23514';
  end if;

  insert into public.plats (nom) values (btrim(p_nom)) returning id into v_plat_id;

  insert into public.constituants_de_plat
    (plat_id, position, nom, quantite, unite, equivalent_cuisine,
     calories, proteines, glucides, sucres, lipides, ags, fibres, sel)
  select v_plat_id, e.rang::integer, e.c ->> 'nom', (e.c ->> 'quantite')::numeric, e.c ->> 'unite', e.c ->> 'equivalent_cuisine',
         (e.c ->> 'calories')::numeric, (e.c ->> 'proteines')::numeric, (e.c ->> 'glucides')::numeric,
         (e.c ->> 'sucres')::numeric, (e.c ->> 'lipides')::numeric, (e.c ->> 'ags')::numeric,
         (e.c ->> 'fibres')::numeric, (e.c ->> 'sel')::numeric
  from jsonb_array_elements(p_constituants) with ordinality as e(c, rang);

  return v_plat_id;
end;
$$;

-- Enregistre un Repas déjà analysé à partir des Constituants d'un Plat (copiés et multipliés par l'app) :
-- pas d'appel à l'IA, donc pas de Commentaire. Renvoie l'identifiant du Repas.
create function public.enregistrer_repas_depuis_plat(
  p_description text,
  p_mange_le timestamptz,
  p_journee date,
  p_type_repas public.type_de_repas,
  p_constituants jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_repas_id uuid;
begin
  insert into public.repas (description, mange_le, journee, type_repas, statut)
  values (p_description, p_mange_le, p_journee, p_type_repas, 'analyse')
  returning id into v_repas_id;

  insert into public.constituants
    (repas_id, position, nom, quantite, unite, equivalent_cuisine,
     calories, proteines, glucides, sucres, lipides, ags, fibres, sel)
  select v_repas_id, e.rang::integer, e.c ->> 'nom', (e.c ->> 'quantite')::numeric, e.c ->> 'unite', e.c ->> 'equivalent_cuisine',
         (e.c ->> 'calories')::numeric, (e.c ->> 'proteines')::numeric, (e.c ->> 'glucides')::numeric,
         (e.c ->> 'sucres')::numeric, (e.c ->> 'lipides')::numeric, (e.c ->> 'ags')::numeric,
         (e.c ->> 'fibres')::numeric, (e.c ->> 'sel')::numeric
  from jsonb_array_elements(p_constituants) with ordinality as e(c, rang);

  return v_repas_id;
end;
$$;

revoke execute on function public.creer_plat(text, jsonb) from public, anon;
grant execute on function public.creer_plat(text, jsonb) to authenticated;
revoke execute on function public.enregistrer_repas_depuis_plat(text, timestamptz, date, public.type_de_repas, jsonb) from public, anon;
grant execute on function public.enregistrer_repas_depuis_plat(text, timestamptz, date, public.type_de_repas, jsonb) to authenticated;
