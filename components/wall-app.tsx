"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { demoPosts } from "@/lib/demo-posts";
import { addPostNewestFirst, createPost, fetchPosts, subscribeToPosts } from "@/lib/posts";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 280;
const LOCAL_POSTS_KEY = "my-wall-demo-posts";

function formatTimestamp(timestamp: string) {
  const value = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const elapsedMinutes = Math.round((Date.parse(timestamp) - Date.now()) / 60_000);

  if (Math.abs(elapsedMinutes) < 60) return value.format(elapsedMinutes, "minute");
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) return value.format(elapsedHours, "hour");
  return value.format(Math.round(elapsedHours / 24), "day");
}

function loadLocalPosts() {
  try {
    const stored = window.localStorage.getItem(LOCAL_POSTS_KEY);
    return stored ? (JSON.parse(stored) as Post[]) : demoPosts;
  } catch {
    return demoPosts;
  }
}

export function WallApp() {
  const ownerName = process.env.NEXT_PUBLIC_WALL_OWNER_NAME || "Alex Morgan";
  const network = process.env.NEXT_PUBLIC_WALL_NETWORK || "Stanford Alum";
  const city = process.env.NEXT_PUBLIC_WALL_CITY || "Palo Alto, CA";
  const initials = ownerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      setPosts(loadLocalPosts());
      setIsLoading(false);
      return;
    }

    fetchPosts(supabase)
      .then((loadedPosts) => {
        if (active) setPosts(loadedPosts);
      })
      .catch(() => {
        if (active) setError("We couldn't load the wall. Please try refreshing the page.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const unsubscribe = subscribeToPosts(supabase, (post) => {
      if (active) setPosts((current) => addPostNewestFirst(current, post));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || trimmedMessage.length > MAX_MESSAGE_LENGTH || isSharing) return;

    setIsSharing(true);
    setError(null);

    try {
      if (supabase) {
        const savedPost = await createPost(supabase, { author: "Visitor", message: trimmedMessage });
        setPosts((current) => addPostNewestFirst(current, savedPost));
      } else {
        const localPost: Post = {
          id: crypto.randomUUID(),
          author: "Visitor",
          message: trimmedMessage,
          created_at: new Date().toISOString(),
        };
        setPosts((current) => {
          const updated = addPostNewestFirst(current, localPost);
          window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
      setMessage("");
    } catch {
      setError("Your post wasn't shared. Please check your connection and try again.");
    } finally {
      setIsSharing(false);
    }
  }

  const remainingCharacters = MAX_MESSAGE_LENGTH - message.length;

  return (
    <main className="wall-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Wall home">
          wall
        </a>
        <span className="topbar-note">a little corner of the internet</span>
      </header>

      <div className="page-grid" id="top">
        <aside className="profile-column" aria-label={`${ownerName}'s profile`}>
          <div className="portrait" role="img" aria-label={`Placeholder portrait for ${ownerName}`}>
            <span>{initials}</span>
          </div>

          <section className="info-card">
            <h2>Information</h2>
            <dl>
              <div>
                <dt>Networks</dt>
                <dd>{network}</dd>
              </div>
              <div>
                <dt>Current City</dt>
                <dd>{city}</dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="wall-column" aria-labelledby="wall-heading">
          <div className="profile-heading">
            <p className="eyebrow">{ownerName}&apos;s profile</p>
            <h1 id="wall-heading">The Wall</h1>
            <p>Leave a note. Keep it kind. Make it memorable.</p>
          </div>

          {!supabase && (
            <div className="demo-banner" role="status">
              Demo mode · Posts are saved in this browser. Add Supabase keys for a shared live wall.
            </div>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <label htmlFor="wall-message">Write something…</label>
            <textarea
              id="wall-message"
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={`What do you want to say to ${ownerName}?`}
              rows={4}
            />
            <div className="composer-footer">
              <span className={remainingCharacters < 30 ? "character-count character-count--low" : "character-count"}>
                {remainingCharacters} characters left
              </span>
              <button type="submit" disabled={!message.trim() || isSharing}>
                {isSharing ? "Sharing…" : "Share"}
              </button>
            </div>
          </form>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="feed-heading">
            <h2>Recent posts</h2>
            <span>{posts.length} on the wall</span>
          </div>

          <div className="feed" aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
              <div className="feed-state">Loading the wall…</div>
            ) : posts.length === 0 ? (
              <div className="feed-state">The wall is quiet. Be the first to leave a note.</div>
            ) : (
              posts.map((post) => (
                <article className="post" key={post.id}>
                  <div className="post-avatar" aria-hidden="true">
                    {post.author.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <h3>{post.author}</h3>
                      <time dateTime={post.created_at}>{formatTimestamp(post.created_at)}</time>
                    </div>
                    <p>{post.message}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
