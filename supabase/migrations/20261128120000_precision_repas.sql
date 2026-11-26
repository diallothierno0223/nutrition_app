-- Corriger un Repas (ticket 06) : la précision ajoutée après coup est relue par analyser-repas à chaque relance.
-- Les autres corrections (quantités, Constituants, date, Type de repas, suppression) passent par la RLS existante.
alter table public.repas add column precision text;

-- Supprimer un Repas retire aussi sa photo, devenue inutile : c'est l'autre usage de la politique de suppression
-- du bucket photos-repas (en plus de retirer une photo dont le Repas n'a pas pu être enregistré).
