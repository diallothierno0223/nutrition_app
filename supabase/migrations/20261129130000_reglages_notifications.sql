-- Réglages des notifications locales (ticket 16) : heure et activation de chacune (matin, midi, soir, samedi).
-- Les notifications sont programmées sur le téléphone ; la base garde seulement les réglages. Un réglage absent ou
-- invalide prend sa valeur par défaut (10 h, 14 h, 21 h, samedi 9 h), à la lecture par le noyau métier.
alter table public.reglages add column notifications jsonb not null default '{}'::jsonb
  check (jsonb_typeof(notifications) = 'object');
