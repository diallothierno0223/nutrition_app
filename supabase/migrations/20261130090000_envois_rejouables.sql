-- File d'envoi (ticket 17) : les actions faites hors ligne sont rejouées au retour du réseau. L'identifiant du Repas
-- est choisi par le téléphone, pour qu'un rejeu (réponse perdue, nouvelle tentative) ne crée jamais de doublon.

-- Nouvelle signature, avec l'identifiant : rejouer le même envoi renvoie le Repas déjà créé, sans rien ajouter.
create function public.enregistrer_repas_depuis_plat(
  p_id uuid,
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
begin
  if exists (select 1 from public.repas where id = p_id) then
    return p_id;
  end if;

  insert into public.repas (id, description, mange_le, journee, type_repas, statut)
  values (p_id, p_description, p_mange_le, p_journee, p_type_repas, 'analyse');

  insert into public.constituants
    (repas_id, position, nom, quantite, unite, equivalent_cuisine,
     calories, proteines, glucides, sucres, lipides, ags, fibres, sel)
  select p_id, e.rang::integer, e.c ->> 'nom', (e.c ->> 'quantite')::numeric, e.c ->> 'unite', e.c ->> 'equivalent_cuisine',
         (e.c ->> 'calories')::numeric, (e.c ->> 'proteines')::numeric, (e.c ->> 'glucides')::numeric,
         (e.c ->> 'sucres')::numeric, (e.c ->> 'lipides')::numeric, (e.c ->> 'ags')::numeric,
         (e.c ->> 'fibres')::numeric, (e.c ->> 'sel')::numeric
  from jsonb_array_elements(p_constituants) with ordinality as e(c, rang);

  return p_id;
end;
$$;

revoke execute on function public.enregistrer_repas_depuis_plat(uuid, text, timestamptz, date, public.type_de_repas, jsonb)
  from public, anon;
grant execute on function public.enregistrer_repas_depuis_plat(uuid, text, timestamptz, date, public.type_de_repas, jsonb)
  to authenticated;

-- L'ancienne signature (identifiant choisi par la base) n'est plus appelée par l'app.
drop function public.enregistrer_repas_depuis_plat(text, timestamptz, date, public.type_de_repas, jsonb);
