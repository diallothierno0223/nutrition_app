-- Hydratation : l'eau et les boissons sans calories, par ajouts de quelques centaines de ml (ticket 04).
create table public.hydratation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bu_le timestamptz not null,
  -- Journée calculée sur le téléphone (fuseau local), comme pour les Repas.
  journee date not null,
  quantite_ml integer not null check (quantite_ml between 1 and 2000)
);

create index hydratation_par_journee on public.hydratation (user_id, journee);

alter table public.hydratation enable row level security;

-- Suppression permise : c'est l'annulation d'un ajout.
create policy "Chacun gère sa propre Hydratation"
  on public.hydratation for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- security_invoker : la vue applique la RLS de l'appelant.
create view public.hydratation_du_jour
with (security_invoker = true)
as
select user_id, journee, sum(quantite_ml)::integer as total_ml
from public.hydratation
group by user_id, journee;

-- Objectif d'Hydratation (Cible), en ml ; affiché en litres dans l'app.
alter table public.objectifs_journaliers
  add column eau_ml integer check (eau_ml > 0);
