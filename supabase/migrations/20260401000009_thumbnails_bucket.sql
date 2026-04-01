-- Create thumbnails storage bucket (public)
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

create policy "Thumbnails are publicly readable"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

create policy "Authenticated users can upload thumbnails"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'thumbnails');

create policy "Authenticated users can update thumbnails"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'thumbnails');

create policy "Authenticated users can delete thumbnails"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'thumbnails');
