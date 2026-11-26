-- Repas et Constituants (voir GLOSSARY.md).
-- Un Repas est créé « en attente » par l'app, puis analyse-repas y écrit ses Constituants et son Commentaire (ADR 0003).
-- Les totaux ne sont pas stockés : ils se calculent à partir des Constituants (noyau métier ; vues SQL à partir du ticket 03).
-- La RLS laisse l'utilisateur écrire ses Constituants lui-même : c'est voulu, pour la correction après coup (ADR 0003).

create type public.type_de_repas as enum ('petit_dejeuner', 'dejeuner', 'collation', 'diner');
create type public.statut_repas as enum ('en_attente', 'analyse');

create table public.repas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mange_le timestamptz not null,
  -- Journée et Type de repas sont calculés sur le téléphone (fuseau local) par le noyau métier.
  journee date not null,
  type_repas public.type_de_repas not null,
  description text not null check (length(btrim(description)) > 0),
  statut public.statut_repas not null default 'en_attente',
  commentaire text,
  erreur_analyse text,
  cree_le timestamptz not null default now()
);

create index repas_par_journee on public.repas (user_id, journee);

create table public.constituants (
  id uuid primary key default gen_random_uuid(),
  repas_id uuid not null references public.repas (id) on delete cascade,
  position integer not null,
  nom text not null,
  quantite numeric not null check (quantite >= 0),
  unite text not null check (unite in ('g', 'ml')),
  equivalent_cuisine text not null,
  calories numeric not null check (calories >= 0),
  proteines numeric not null check (proteines >= 0),
  glucides numeric not null check (glucides >= 0),
  lipides numeric not null check (lipides >= 0),
  ags numeric not null check (ags >= 0),
  fibres numeric not null check (fibres >= 0),
  sel numeric not null check (sel >= 0),
  unique (repas_id, position)
);

alter table public.repas enable row level security;
alter table public.constituants enable row level security;

create policy "Chacun gère ses propres Repas"
  on public.repas for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Chacun gère les Constituants de ses Repas"
  on public.constituants for all
  to authenticated
  using (exists (select 1 from public.repas r where r.id = repas_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.repas r where r.id = repas_id and r.user_id = (select auth.uid())));

-- Enregistre une analyse en une transaction : remplace les Constituants, écrit le Commentaire, passe le Repas à « analyse ».
-- Security invoker : la RLS de l'appelant s'applique, un Repas d'autrui est introuvable.
create function public.enregistrer_analyse(p_repas_id uuid, p_constituants jsonb, p_commentaire text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.repas where id = p_repas_id for update;
  if not found then
    raise exception 'Repas introuvable' using errcode = 'P0002';
  end if;

  delete from public.constituants where repas_id = p_repas_id;

  insert into public.constituants
    (repas_id, position, nom, quantite, unite, equivalent_cuisine, calories, proteines, glucides, lipides, ags, fibres, sel)
  select p_repas_id, e.rang::integer, e.c ->> 'nom', (e.c ->> 'quantite')::numeric, e.c ->> 'unite', e.c ->> 'equivalent_cuisine',
         (e.c ->> 'calories')::numeric, (e.c ->> 'proteines')::numeric, (e.c ->> 'glucides')::numeric,
         (e.c ->> 'lipides')::numeric, (e.c ->> 'ags')::numeric, (e.c ->> 'fibres')::numeric, (e.c ->> 'sel')::numeric
  from jsonb_array_elements(p_constituants) with ordinality as e(c, rang);

  update public.repas
     set statut = 'analyse', commentaire = p_commentaire, erreur_analyse = null
   where id = p_repas_id;
end;
$$;

revoke execute on function public.enregistrer_analyse(uuid, jsonb, text) from public, anon;
grant execute on function public.enregistrer_analyse(uuid, jsonb, text) to authenticated;
