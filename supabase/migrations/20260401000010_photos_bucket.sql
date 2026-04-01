-- Add hero_image_url to seasons (for champion photo on season pages)
alter table seasons add column if not exists hero_image_url text;

-- Create photos storage bucket (public) for overview collage images
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

create policy "Authenticated users can update photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'photos');

create policy "Authenticated users can delete photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');
