-- Corrections après revue des tickets 07 à 15.

-- 1. Le mode de génération descend jusqu'au SQL, pour qu'aucun appel non forcé ne remplace un Rendez-vous existant,
--    même si deux appels se croisent (traitement automatique et ouverture de l'app, par exemple) :
--    - « automatique » et « demande » : un Rendez-vous existant est renvoyé tel quel ;
--    - « force » : nouvelle génération ; les Recettes sont remplacées, mais les marques « à refaire » sont gardées
--      pour les Recettes qui reviennent sous le même nom.
drop function public.ecrire_rendez_vous(uuid, date, text, jsonb, boolean);

create function public.ecrire_rendez_vous(
  p_user_id uuid,
  p_samedi date,
  p_bilan text,
  p_recettes jsonb,
  p_mode text
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
  v_a_refaire text[];
begin
  if p_mode not in ('automatique', 'demande', 'force') then
    raise exception 'Mode de génération inconnu : %', p_mode using errcode = '22023';
  end if;

  select id into v_id from public.rendez_vous where user_id = p_user_id and samedi = p_samedi for update;

  if found and p_mode <> 'force' then
    return v_id;
  elsif found then
    select coalesce(array_agg(lower(btrim(nom))), '{}') into v_a_refaire
    from public.recettes where rendez_vous_id = v_id and a_refaire;
    update public.rendez_vous set bilan = p_bilan, genere_le = now(), automatique = false where id = v_id;
    delete from public.recettes where rendez_vous_id = v_id;
  else
    v_a_refaire := '{}';
    insert into public.rendez_vous (user_id, samedi, bilan, automatique)
    values (p_user_id, p_samedi, p_bilan, p_mode = 'automatique')
    returning id into v_id;
  end if;

  -- Les Plats de la semaine ne concernent que le dernier Rendez-vous.
  delete from public.plats where user_id = p_user_id and rendez_vous_id is not null;

  for v_recette in select e.r, e.rang from jsonb_array_elements(p_recettes) with ordinality as e(r, rang) loop
    insert into public.recettes
      (rendez_vous_id, position, nom, categorie, portions, etapes, conservation, ordre_conseille, a_refaire)
    values (
      v_id, v_recette.rang, v_recette.r ->> 'nom', (v_recette.r ->> 'categorie')::public.categorie_de_recette,
      (v_recette.r ->> 'portions')::integer,
      array(select jsonb_array_elements_text(v_recette.r -> 'etapes')),
      v_recette.r ->> 'conservation', v_recette.r ->> 'ordre_conseille',
      lower(btrim(v_recette.r ->> 'nom')) = any (v_a_refaire)
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

revoke execute on function public.ecrire_rendez_vous(uuid, date, text, jsonb, text) from public, anon, authenticated;
grant execute on function public.ecrire_rendez_vous(uuid, date, text, jsonb, text) to service_role;

-- 2. Un utilisateur ne peut pas rattacher lui-même un Plat à un Rendez-vous (ce qui le ferait retirer à la
--    génération suivante) : seul le nom d'un Plat se saisit et se modifie directement.
revoke insert, update on public.plats from authenticated;
grant insert (nom) on public.plats to authenticated;
grant update (nom) on public.plats to authenticated;

-- 3. Fenêtre du traitement automatique élargie à tous les fuseaux : « samedi 6 h » tombe entre le vendredi 16 h
--    (UTC+14) et le samedi 18 h (UTC−12). Le noyau métier décide toujours compte par compte.
select cron.unschedule('rendez-vous-samedi-matin');
select cron.schedule('rendez-vous-samedi', '0 0-18 * * 6', 'select public.declencher_rendez_vous_automatiques()');
