alter table public.posts
add column if not exists image_urls text[] not null default '{}'::text[];

update public.posts
set image_urls = array[image_url]
where image_url is not null
  and cardinality(image_urls) = 0;

alter table public.posts
drop constraint if exists posts_image_urls_limit;

alter table public.posts
add constraint posts_image_urls_limit
check (cardinality(image_urls) <= 5);
