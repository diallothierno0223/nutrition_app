-- Plats de la semaine (ticket 14) : à chaque génération, un Plat d'une portion par Recette et par petit-déjeuner
-- (portion calculée par le noyau métier, transmise dans « plat » de chaque Recette). Les Plats de la semaine
-- précédente sont retirés ; les Repas déjà enregistrés à partir d'eux ne changent pas (ce sont des copies).
-- Un Plat permanent a rendez_vous_id nul.

alter table public.plats add column rendez_vous_id uuid references public.rendez_vous (id) on delete cascade;

-- Même signature : remplace la fonction (droits conservés, rôle de service seulement).
create or replace function public.ecrire_rendez_vous(
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
  v_plat_id uuid;
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

  -- Les Plats de la semaine ne concernent que le dernier Rendez-vous.
  delete from public.plats where user_id = p_user_id and rendez_vous_id is not null;

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

    if jsonb_array_length(coalesce(v_recette.r -> 'plat', '[]'::jsonb)) > 0 then
      insert into public.plats (user_id, nom, rendez_vous_id)
      values (p_user_id, v_recette.r ->> 'nom', v_id)
      returning id into v_plat_id;

      insert into public.constituants_de_plat
        (plat_id, position, nom, quantite, unite, equivalent_cuisine,
         calories, proteines, glucides, sucres, lipides, ags, fibres, sel)
      select v_plat_id, c.rang::integer, c.c ->> 'nom', (c.c ->> 'quantite')::numeric, c.c ->> 'unite', c.c ->> 'equivalent_cuisine',
             (c.c ->> 'calories')::numeric, (c.c ->> 'proteines')::numeric, (c.c ->> 'glucides')::numeric,
             (c.c ->> 'sucres')::numeric, (c.c ->> 'lipides')::numeric, (c.c ->> 'ags')::numeric,
             (c.c ->> 'fibres')::numeric, (c.c ->> 'sel')::numeric
      from jsonb_array_elements(v_recette.r -> 'plat') with ordinality as c(c, rang);
    end if;
  end loop;

  return v_id;
end;
$$;
