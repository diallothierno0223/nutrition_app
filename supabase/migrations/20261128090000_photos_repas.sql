-- Saisie d'un Repas par photo (ticket 05).
-- La photo est compressée sur le téléphone puis déposée dans un bucket privé, sous <user_id>/<fichier>.jpg.
-- analyser-repas la relit avec la session de l'appelant et l'envoie à l'IA avec la note (la description).

alter table public.repas add column photo_chemin text;

-- La description devient une note facultative quand il y a une photo.
alter table public.repas drop constraint repas_description_check;
alter table public.repas alter column description set default '';
alter table public.repas add constraint repas_description_ou_photo
  check (photo_chemin is not null or length(btrim(description)) > 0);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos-repas', 'photos-repas', false, 5242880, array['image/jpeg']);

-- Chacun ne voit et ne dépose que dans son propre dossier. Les photos des Repas sont conservées (pas de mise à jour) ;
-- la suppression sert seulement à retirer une photo déposée dont le Repas n'a pas pu être enregistré.
create policy "Chacun lit ses photos de Repas"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'photos-repas' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Chacun dépose ses photos de Repas"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos-repas' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Chacun supprime ses photos de Repas"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos-repas' and (storage.foldername(name))[1] = (select auth.uid())::text);
