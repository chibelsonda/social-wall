alter table public.posts
add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-photos',
  'wall-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Wall photos are publicly readable" on storage.objects;
create policy "Wall photos are publicly readable"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'wall-photos');

drop policy if exists "Visitors can upload wall photos" on storage.objects;
create policy "Visitors can upload wall photos"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'wall-photos'
  and (storage.foldername(name))[1] = 'posts'
);
