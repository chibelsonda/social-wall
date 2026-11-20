create or replace function public.replace_wall_post_avatar(
  previous_avatar_url text,
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
  if previous_avatar_url is null or char_length(previous_avatar_url) = 0 then
    return 0;
  end if;

  update public.posts
  set avatar_url = next_avatar_url
  where avatar_url = previous_avatar_url;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.replace_wall_post_avatar(text, text) from public;
grant execute on function public.replace_wall_post_avatar(text, text) to anon, authenticated;
