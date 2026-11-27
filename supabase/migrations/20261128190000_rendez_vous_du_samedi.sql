-- Rendez-vous du samedi (ticket 12, voir GLOSSARY.md) : Bilan de la semaine, Recettes et petits-déjeuners.
-- Le Rendez-vous est enregistré directement, sans validation (ADR 0003). Il est écrit uniquement par l'Edge Function
-- generer-rendez-vous (rôle de service, via ecrire_rendez_vous) ; l'utilisateur le lit et marque ses Recettes.

-- Réglages du samedi : les nombres du Rendez-vous.
alter table public.reglages
  add column samedi_recettes integer not null default 3 check (samedi_recettes between 1 and 6),
  add column samedi_portions integer not null default 10 check (samedi_portions between 1 and 30),
  add column samedi_portions_nomade integer not null default 3 check (samedi_portions_nomade between 1 and 7),
  add column samedi_matins_rapides integer not null default 4 check (samedi_matins_rapides between 0 and 7);

create type public.categorie_de_recette as enum ('repas', 'petit_dejeuner_nomade', 'petit_dejeuner_rapide');

create table public.rendez_vous (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Le samedi de référence de la semaine (noyau métier : à partir de 6 h, heure locale).
  samedi date not null check (extract(isodow from samedi) = 6),
  bilan text not null,
  genere_le timestamptz not null default now(),
  automatique boolean not null,
  unique (user_id, samedi)
);

create table public.recettes (
  id uuid primary key default gen_random_uuid(),
  rendez_vous_id uuid not null references public.rendez_vous (id) on delete cascade,
  position integer not null,
  nom text not null,
  categorie public.categorie_de_recette not null,
  portions integer not null check (portions > 0),
  etapes text[] not null,
  conservation text not null,
  ordre_conseille text not null,
  a_refaire boolean not null default false,
  unique (rendez_vous_id, position)
);

-- Les ingrédients ont la forme d'un Constituant (quantité pour toute la Recette, nutriments compris) :
-- les nutriments par portion et les Plats de la semaine s'en déduisent dans le noyau métier.
create table public.ingredients_de_recette (
  id uuid primary key default gen_random_uuid(),
  recette_id uuid not null references public.recettes (id) on delete cascade,
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
  unique (recette_id, position)
);

alter table public.rendez_vous enable row level security;
alter table public.recettes enable row level security;
alter table public.ingredients_de_recette enable row level security;

-- Lecture seule pour l'utilisateur, sauf « à refaire » sur ses Recettes (colonne seule modifiable).
create policy "Chacun lit ses Rendez-vous"
  on public.rendez_vous for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Chacun lit ses Recettes"
  on public.recettes for select
  to authenticated
  using (exists (select 1 from public.rendez_vous r where r.id = rendez_vous_id and r.user_id = (select auth.uid())));

create policy "Chacun marque ses Recettes"
  on public.recettes for update
  to authenticated
  using (exists (select 1 from public.rendez_vous r where r.id = rendez_vous_id and r.user_id = (select auth.uid())))
  with check (exists (select 1 from public.rendez_vous r where r.id = rendez_vous_id and r.user_id = (select auth.uid())));

revoke update on public.recettes from authenticated;
grant update (a_refaire) on public.recettes to authenticated;

create policy "Chacun lit les ingrédients de ses Recettes"
  on public.ingredients_de_recette for select
  to authenticated
  using (exists (
    select 1 from public.recettes re join public.rendez_vous r on r.id = re.rendez_vous_id
    where re.id = recette_id and r.user_id = (select auth.uid())
  ));

-- Écrit le Rendez-vous d'un utilisateur pour un samedi, en une transaction ; renvoie son identifiant.
-- - automatique : ne remplace jamais un Rendez-vous existant (renvoie celui-ci tel quel) ;
-- - à la demande : une nouvelle génération remplace les Recettes du même Rendez-vous (même identifiant).
-- Réservée au rôle de service : l'Edge Function a déjà authentifié l'utilisateur.
create function public.ecrire_rendez_vous(
  p_user_id uuid,
  p_samedi date,
  p_bilan text,
  p_recettes jsonb,
  p_automatique boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_recette record;
  v_recette_id uuid;
begin
  select id into v_id from public.rendez_vous where user_id = p_user_id and samedi = p_samedi for update;

  if found and p_automatique then
    return v_id;
  elsif found then
    update public.rendez_vous set bilan = p_bilan, genere_le = now(), automatique = false where id = v_id;
    delete from public.recettes where rendez_vous_id = v_id;
  else
    insert into public.rendez_vous (user_id, samedi, bilan, automatique)
    values (p_user_id, p_samedi, p_bilan, p_automatique)
    returning id into v_id;
  end if;

  for v_recette in select e.r, e.rang from jsonb_array_elements(p_recettes) with ordinality as e(r, rang) loop
    insert into public.recettes (rendez_vous_id, position, nom, categorie, portions, etapes, conservation, ordre_conseille)
    values (
      v_id, v_recette.rang, v_recette.r ->> 'nom', (v_recette.r ->> 'categorie')::public.categorie_de_recette,
      (v_recette.r ->> 'portions')::integer,
      array(select jsonb_array_elements_text(v_recette.r -> 'etapes')),
      v_recette.r ->> 'conservation', v_recette.r ->> 'ordre_conseille'
    )
    returning id into v_recette_id;

    insert into public.ingredients_de_recette
      (recette_id, position, nom, quantite, unite, equivalent_cuisine,
       calories, proteines, glucides, sucres, lipides, ags, fibres, sel)
    select v_recette_id, i.rang::integer, i.c ->> 'nom', (i.c ->> 'quantite')::numeric, i.c ->> 'unite', i.c ->> 'equivalent_cuisine',
           (i.c ->> 'calories')::numeric, (i.c ->> 'proteines')::numeric, (i.c ->> 'glucides')::numeric,
           (i.c ->> 'sucres')::numeric, (i.c ->> 'lipides')::numeric, (i.c ->> 'ags')::numeric,
           (i.c ->> 'fibres')::numeric, (i.c ->> 'sel')::numeric
    from jsonb_array_elements(v_recette.r -> 'ingredients') with ordinality as i(c, rang);
  end loop;

  return v_id;
end;
$$;

revoke execute on function public.ecrire_rendez_vous(uuid, date, text, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.ecrire_rendez_vous(uuid, date, text, jsonb, boolean) to service_role;
