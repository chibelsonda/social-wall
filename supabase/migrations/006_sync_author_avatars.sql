create or replace function public.replace_wall_author_avatar(
  post_author text,
  next_avatar_url text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if post_author is null or char_length(trim(post_author)) = 0 then
    return 0;
  end if;

  update public.posts
  set avatar_url = next_avatar_url
  where author = trim(post_author)
    and avatar_url is distinct from next_avatar_url;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.replace_wall_author_avatar(text, text) from public;
grant execute on function public.replace_wall_author_avatar(text, text) to anon, authenticated;
