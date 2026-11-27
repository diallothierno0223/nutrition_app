-- Totaux de la Semaine (lundi–dimanche) pour le récapitulatif du Dashboard (ticket 11).
-- date_trunc('week') donne le lundi (semaine ISO) ; les Journées sont déjà rattachées au fuseau du téléphone.
-- security_invoker : la vue applique la RLS de l'appelant.
create view public.totaux_de_la_semaine
with (security_invoker = true)
as
select t.user_id,
       date_trunc('week', t.journee)::date as lundi,
       count(*) as journees_renseignees,
       sum(t.calories) as calories,
       sum(t.proteines) as proteines,
       sum(t.glucides) as glucides,
       sum(t.sucres) as sucres,
       sum(t.lipides) as lipides,
       sum(t.ags) as ags,
       sum(t.fibres) as fibres,
       sum(t.sel) as sel
from public.totaux_du_jour t
group by t.user_id, date_trunc('week', t.journee);
