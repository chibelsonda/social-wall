create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author text not null default 'Visitor' check (char_length(author) between 1 and 80),
  message text not null check (char_length(message) between 1 and 280),
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "Public posts are readable" on public.posts;
create policy "Public posts are readable"
on public.posts for select
to anon, authenticated
using (true);

drop policy if exists "Visitors can create posts" on public.posts;
create policy "Visitors can create posts"
on public.posts for insert
to anon, authenticated
with check (
  char_length(author) between 1 and 80
  and char_length(message) between 1 and 280
);

create index if not exists posts_created_at_desc_idx
on public.posts (created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end
$$;
