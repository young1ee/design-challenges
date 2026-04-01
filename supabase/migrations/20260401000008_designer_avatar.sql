-- Add avatar_url column to designers
alter table designers add column if not exists avatar_url text;

-- Create avatars storage bucket (public)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow anyone to read avatars
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

-- Allow authenticated users to update/replace avatars
create policy "Authenticated users can update avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

-- Allow authenticated users to delete avatars
create policy "Authenticated users can delete avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');

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
