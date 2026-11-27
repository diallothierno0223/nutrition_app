-- Liste de courses (ticket 13). La liste elle-même est calculée par le noyau métier ; la base garde l'état :
-- Recettes incluses, cases cochées et ajouts manuels. Une nouvelle génération forcée garde le même Rendez-vous,
-- donc ses ajouts manuels.

alter table public.recettes add column dans_la_liste boolean not null default true;
grant update (dans_la_liste) on public.recettes to authenticated;

alter table public.ingredients_de_recette add column coche boolean not null default false;

create policy "Chacun coche les ingrédients de ses Recettes"
  on public.ingredients_de_recette for update
  to authenticated
  using (exists (
    select 1 from public.recettes re join public.rendez_vous r on r.id = re.rendez_vous_id
    where re.id = recette_id and r.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.recettes re join public.rendez_vous r on r.id = re.rendez_vous_id
    where re.id = recette_id and r.user_id = (select auth.uid())
  ));

revoke update on public.ingredients_de_recette from authenticated;
grant update (coche) on public.ingredients_de_recette to authenticated;

create table public.articles_manuels (
  id uuid primary key default gen_random_uuid(),
  rendez_vous_id uuid not null references public.rendez_vous (id) on delete cascade,
  nom text not null check (length(btrim(nom)) > 0),
  coche boolean not null default false,
  cree_le timestamptz not null default now()
);

alter table public.articles_manuels enable row level security;

create policy "Chacun gère les ajouts manuels de ses Listes de courses"
  on public.articles_manuels for all
  to authenticated
  using (exists (select 1 from public.rendez_vous r where r.id = rendez_vous_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.rendez_vous r where r.id = rendez_vous_id and r.user_id = (select auth.uid())));
