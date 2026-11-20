alter table public.posts
add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-avatars',
  'wall-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Wall avatars are publicly readable" on storage.objects;
create policy "Wall avatars are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'wall-avatars');

drop policy if exists "Visitors can upload wall avatars" on storage.objects;
create policy "Visitors can upload wall avatars"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'wall-avatars'
  and (storage.foldername(name))[1] = 'visitors'
);
