-- Objectifs journaliers : la seule source des seuils chiffrés (voir GLOSSARY.md).
-- Une ligne par utilisateur ; null = pas d'Objectif défini pour ce nutriment.
create table public.objectifs_journaliers (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  calories numeric check (calories > 0),
  proteines numeric check (proteines > 0),
  glucides numeric check (glucides > 0),
  lipides numeric check (lipides > 0),
  ags numeric check (ags > 0),
  fibres numeric check (fibres > 0),
  sel numeric check (sel > 0),
  modifie_le timestamptz not null default now()
);

alter table public.objectifs_journaliers enable row level security;

create policy "Chacun gère ses propres Objectifs"
  on public.objectifs_journaliers for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Totaux du jour : somme des Constituants des Repas analysés, par Journée. Les Repas en attente ne comptent pas.
-- security_invoker : la vue applique la RLS de l'appelant.
create view public.totaux_du_jour
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
       sum(c.sel) as sel
from public.repas r
join public.constituants c on c.repas_id = r.id
where r.statut = 'analyse'
group by r.user_id, r.journee;
