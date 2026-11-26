-- Sucres : 8e nutriment suivi, en Plafond (ticket 22).
-- Les Constituants déjà enregistrés reçoivent 0 g : ils ont été analysés avant l'ajout (historique court, accepté).

alter table public.constituants
  add column sucres numeric not null default 0 check (sucres >= 0);
-- Le défaut ne sert qu'au remplissage des lignes existantes : une nouvelle ligne doit fournir ses sucres.
alter table public.constituants alter column sucres drop default;

alter table public.objectifs_journaliers
  add column sucres numeric check (sucres > 0);

-- Nouvelle colonne en fin de vue (create or replace view n'accepte que des colonnes ajoutées à la fin).
-- security_invoker : la vue applique la RLS de l'appelant.
create or replace view public.totaux_du_jour
with (security_invoker = true)
as
select r.user_id,
       r.journee,
       sum(c.calories) as calories,
       sum(c.proteines) as proteines,
       sum(c.glucides) as glucides,
       sum(c.lipides) as lipides,
       sum(c.ags) as ags,
       sum(c.fibres) as fibres,
       sum(c.sel) as sel,
       sum(c.sucres) as sucres
from public.repas r
join public.constituants c on c.repas_id = r.id
where r.statut = 'analyse'
group by r.user_id, r.journee;

-- Même signature : remplace la fonction (droits conservés). Security invoker : la RLS de l'appelant s'applique.
create or replace function public.enregistrer_analyse(p_repas_id uuid, p_constituants jsonb, p_commentaire text)
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
    (repas_id, position, nom, quantite, unite, equivalent_cuisine,
     calories, proteines, glucides, sucres, lipides, ags, fibres, sel)
  select p_repas_id, e.rang::integer, e.c ->> 'nom', (e.c ->> 'quantite')::numeric, e.c ->> 'unite', e.c ->> 'equivalent_cuisine',
         (e.c ->> 'calories')::numeric, (e.c ->> 'proteines')::numeric, (e.c ->> 'glucides')::numeric,
         (e.c ->> 'sucres')::numeric, (e.c ->> 'lipides')::numeric, (e.c ->> 'ags')::numeric,
         (e.c ->> 'fibres')::numeric, (e.c ->> 'sel')::numeric
  from jsonb_array_elements(p_constituants) with ordinality as e(c, rang);

  update public.repas
     set statut = 'analyse', commentaire = p_commentaire, erreur_analyse = null
   where id = p_repas_id;
end;
$$;
