import type {
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { Post } from "./types";

const POST_FIELDS = "id,author,avatar_url,message,image_url,image_urls,created_at";

export async function fetchPosts(client: SupabaseClient): Promise<Post[]> {
  const { data, error } = await client
    .from("posts")
    .select(POST_FIELDS)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function createPost(
  client: SupabaseClient,
  post: Pick<Post, "author" | "message"> & {
    avatar_url?: string | null;
    image_url?: string | null;
    image_urls?: string[];
  },
): Promise<Post> {
  const { data, error } = await client.from("posts").insert(post).select(POST_FIELDS).single();
  if (error) throw error;
  return data as Post;
}

export function addPostNewestFirst(posts: Post[], incoming: Post): Post[] {
  const withoutDuplicate = posts.filter((post) => post.id !== incoming.id);
  return [incoming, ...withoutDuplicate]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 50);
}

export function replaceAuthorAvatar(
  posts: Post[],
  author: string,
  nextAvatarUrl: string | null,
): Post[] {
  return posts.map((post) =>
    post.author === author ? { ...post, avatar_url: nextAvatarUrl } : post,
  );
}

export async function replacePersistedAuthorAvatar(
  client: SupabaseClient,
  author: string,
  nextAvatarUrl: string | null,
) {
  const { error } = await client.rpc("replace_wall_author_avatar", {
    post_author: author,
    next_avatar_url: nextAvatarUrl,
  });

  if (error) throw error;
}

export function subscribeToPosts(client: SupabaseClient, onChange: (post: Post) => void) {
  const channel = client
    .channel("public:posts:wall-feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      (payload: RealtimePostgresInsertPayload<Post>) => onChange(payload.new),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "posts" },
      (payload: RealtimePostgresUpdatePayload<Post>) => onChange(payload.new),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
