-- Génération planifiée du Rendez-vous du samedi (ticket 15).
-- pg_cron appelle generer-rendez-vous en mode automatique chaque heure, du vendredi 16 h au samedi 12 h (UTC) :
-- la fonction décide elle-même, compte par compte, via le noyau métier (samedi ≥ 6 h dans le fuseau du Profil,
-- pas déjà généré). Les heures suivantes servent de nouveaux essais et couvrent l'heure d'été.
--
-- L'adresse du projet et la clé de service viennent du Vault (jamais dans une migration) :
--   select vault.create_secret('https://<projet>.supabase.co', 'url_projet');
--   select vault.create_secret('<clé service_role>', 'cle_service');
-- Sans ces secrets (développement local), l'appel ne fait rien.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create function public.declencher_rendez_vous_automatiques()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_cle text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'url_projet';
  select decrypted_secret into v_cle from vault.decrypted_secrets where name = 'cle_service';
  if v_url is null or v_cle is null then
    return;
  end if;

  perform net.http_post(
    url := v_url || '/functions/v1/generer-rendez-vous',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_cle, 'Content-Type', 'application/json'),
    body := jsonb_build_object('automatique', true),
    timeout_milliseconds := 120000
  );
end;
$$;

revoke execute on function public.declencher_rendez_vous_automatiques() from public, anon, authenticated;

select cron.schedule('rendez-vous-vendredi-soir', '0 16-23 * * 5', 'select public.declencher_rendez_vous_automatiques()');
select cron.schedule('rendez-vous-samedi-matin', '0 0-12 * * 6', 'select public.declencher_rendez_vous_automatiques()');
