import type { RealtimePostgresInsertPayload, SupabaseClient } from "@supabase/supabase-js";
import type { Post } from "./types";

const POST_FIELDS = "id,author,avatar_url,message,image_url,created_at";

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

export function subscribeToPosts(client: SupabaseClient, onInsert: (post: Post) => void) {
  const channel = client
    .channel("public:posts:wall-feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      (payload: RealtimePostgresInsertPayload<Post>) => onInsert(payload.new),
    )
    .subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
