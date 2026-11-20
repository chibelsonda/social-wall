"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { demoPosts } from "@/lib/demo-posts";
import {
  removePostPhoto,
  uploadPostPhoto,
  uploadVisitorAvatar,
  validateAvatar,
  validatePhoto,
} from "@/lib/photos";
import { addPostNewestFirst, createPost, fetchPosts, subscribeToPosts } from "@/lib/posts";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 280;
const MAX_VISITOR_NAME_LENGTH = 40;
const LOCAL_POSTS_KEY = "my-wall-demo-posts";
const VISITOR_PROFILE_KEY = "my-wall-visitor-profile";

type VisitorProfile = {
  name: string;
  avatarUrl: string | null;
};

function CameraIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path d="M8.7 5.25 10 3.5h4l1.3 1.75H19A2.25 2.25 0 0 1 21.25 7.5v9A2.25 2.25 0 0 1 19 18.75H5a2.25 2.25 0 0 1-2.25-2.25v-9A2.25 2.25 0 0 1 5 5.25h3.7ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-1.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path d="m20.65 3.33-8.02 17.05a.75.75 0 0 1-1.4-.12L9.4 13.85l-5.65-3.5a.75.75 0 0 1 .2-1.36l15.82-6.7a.75.75 0 0 1 .88 1.04ZM6 9.83l4.44 2.75a.75.75 0 0 1 .33.44l1.43 5.03 5.98-12.72L6 9.83Z" />
    </svg>
  );
}

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

function loadVisitorProfile(): VisitorProfile {
  try {
    const stored = window.localStorage.getItem(VISITOR_PROFILE_KEY);
    if (!stored) return { name: "Visitor", avatarUrl: null };

    const profile = JSON.parse(stored) as Partial<VisitorProfile>;
    return {
      name:
        typeof profile.name === "string" && profile.name.trim()
          ? profile.name.slice(0, MAX_VISITOR_NAME_LENGTH)
          : "Visitor",
      avatarUrl: typeof profile.avatarUrl === "string" ? profile.avatarUrl : null,
    };
  } catch {
    return { name: "Visitor", avatarUrl: null };
  }
}

export function WallApp() {
  const defaultOwnerName = process.env.NEXT_PUBLIC_WALL_OWNER_NAME || "Alex Morgan";
  const network = process.env.NEXT_PUBLIC_WALL_NETWORK || "Stanford Alum";
  const city = process.env.NEXT_PUBLIC_WALL_CITY || "Palo Alto, CA";

  const [supabase, setSupabase] = useState<ReturnType<typeof getBrowserSupabase> | undefined>(
    undefined,
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [visitorName, setVisitorName] = useState("Visitor");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSupabase(getBrowserSupabase());
    const profile = loadVisitorProfile();
    setVisitorName(profile.name);
    setAvatarUrl(profile.avatarUrl);
    setIsProfileLoaded(true);
  }, []);

  useEffect(() => {
    if (!isProfileLoaded) return;

    window.localStorage.setItem(
      VISITOR_PROFILE_KEY,
      JSON.stringify({ name: visitorName, avatarUrl } satisfies VisitorProfile),
    );
  }, [avatarUrl, isProfileLoaded, visitorName]);

  useEffect(() => {
    if (!selectedAvatar) {
      setAvatarPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatar]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedPhoto]);

  useEffect(() => {
    let active = true;

    if (supabase === undefined) return;

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

  function clearSelectedPhoto() {
    setSelectedPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function clearAvatar() {
    setSelectedAvatar(null);
    setAvatarUrl(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateAvatar(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedAvatar(file);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validatePhoto(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedPhoto(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    const trimmedVisitorName = visitorName.trim();
    if (
      !trimmedMessage ||
      trimmedMessage.length > MAX_MESSAGE_LENGTH ||
      !trimmedVisitorName ||
      isSharing ||
      supabase === undefined
    ) {
      return;
    }

    setIsSharing(true);
    setError(null);

    let uploadedPhotoPath: string | null = null;

    try {
      let resolvedAvatarUrl = avatarUrl;

      if (selectedAvatar) {
        if (!supabase) {
          setError("Profile photo uploads require a connected Supabase project.");
          return;
        }

        try {
          const uploadedAvatar = await uploadVisitorAvatar(supabase, selectedAvatar);
          resolvedAvatarUrl = uploadedAvatar.publicUrl;
          setAvatarUrl(uploadedAvatar.publicUrl);
          setSelectedAvatar(null);
          if (avatarInputRef.current) avatarInputRef.current.value = "";
        } catch {
          setError("Failed to upload profile photo. Please try again.");
          return;
        }
      }

      if (supabase) {
        let imageUrl: string | null = null;

        if (selectedPhoto) {
          try {
            const uploadedPhoto = await uploadPostPhoto(supabase, selectedPhoto);
            uploadedPhotoPath = uploadedPhoto.path;
            imageUrl = uploadedPhoto.publicUrl;
          } catch {
            setError("Failed to upload photo. Please try again.");
            return;
          }
        }

        let savedPost: Post;
        try {
          savedPost = await createPost(supabase, {
            author: trimmedVisitorName,
            avatar_url: resolvedAvatarUrl,
            message: trimmedMessage,
            image_url: imageUrl,
          });
        } catch (postError) {
          if (uploadedPhotoPath) await removePostPhoto(supabase, uploadedPhotoPath);
          throw postError;
        }
        setPosts((current) => addPostNewestFirst(current, savedPost));
      } else {
        if (selectedPhoto) {
          setError("Photo uploads require a connected Supabase project.");
          return;
        }

        const localPost: Post = {
          id: crypto.randomUUID(),
          author: trimmedVisitorName,
          avatar_url: resolvedAvatarUrl,
          message: trimmedMessage,
          image_url: null,
          created_at: new Date().toISOString(),
        };
        setPosts((current) => {
          const updated = addPostNewestFirst(current, localPost);
          window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
      setMessage("");
      clearSelectedPhoto();
    } catch {
      setError("Your post wasn't shared. Please check your connection and try again.");
    } finally {
      setIsSharing(false);
    }
  }

  const remainingCharacters = MAX_MESSAGE_LENGTH - message.length;
  const visitorInitial = visitorName.trim().slice(0, 1).toUpperCase() || "V";
  const displayedAvatar = avatarPreview || avatarUrl;
  const trimmedVisitorName = visitorName.trim();
  const hasCustomizedProfile = Boolean(avatarUrl) || trimmedVisitorName !== "Visitor";
  const profileName = hasCustomizedProfile && trimmedVisitorName ? trimmedVisitorName : defaultOwnerName;
  const profileInitials = profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="wall-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top" aria-label="Wall home">
            wall<span className="brand-dot">.</span>
          </a>
          <span className="topbar-note">a little corner of the internet</span>
        </div>
      </header>

      <div className="page-grid" id="top">
        <aside className="profile-column" aria-label={`${profileName}'s profile`}>
          <div
            className={avatarUrl ? "portrait portrait--uploaded" : "portrait"}
            role="img"
            aria-label={
              avatarUrl ? `${profileName}'s profile photo` : `Placeholder portrait for ${profileName}`
            }
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={640}
                height={640}
                unoptimized
              />
            ) : (
              <span>{profileInitials}</span>
            )}
          </div>

          <section className="info-card">
            <div className="info-card-heading">
              <h2>About</h2>
              <span className="profile-status">Online</span>
            </div>
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
            <p className="eyebrow">{profileName}&apos;s profile</p>
            <h1 id="wall-heading">The Wall</h1>
            <p>Leave a note, share a moment, and make this little corner of the internet memorable.</p>
          </div>

          {supabase === null && (
            <div className="demo-banner" role="status">
              Demo mode · Posts are saved in this browser. Add Supabase keys for a shared live wall.
            </div>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <div className="composer-heading">
              <div>
                <span className="section-kicker">New post</span>
                <h2>Write something</h2>
              </div>
              <span className="privacy-note">Visible to everyone</span>
            </div>
            <fieldset className="visitor-profile">
              <legend>Posting as</legend>
              <div className="visitor-profile-row">
                <div className="visitor-avatar" aria-hidden="true">
                  {displayedAvatar ? (
                    <Image
                      src={displayedAvatar}
                      alt=""
                      width={72}
                      height={72}
                      unoptimized
                    />
                  ) : (
                    visitorInitial
                  )}
                </div>
                <div className="visitor-profile-fields">
                  <label htmlFor="visitor-name">Display name</label>
                  <input
                    id="visitor-name"
                    name="visitor-name"
                    type="text"
                    value={visitorName}
                    onChange={(event) => setVisitorName(event.target.value)}
                    maxLength={MAX_VISITOR_NAME_LENGTH}
                    required
                    disabled={isSharing}
                  />
                  <div className="avatar-controls">
                    <input
                      ref={avatarInputRef}
                      className="photo-input"
                      id="visitor-avatar"
                      name="visitor-avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      disabled={isSharing}
                    />
                    <label className="photo-picker" htmlFor="visitor-avatar">
                      <CameraIcon />
                      {displayedAvatar ? "Change profile photo" : "Add profile photo"}
                    </label>
                    {displayedAvatar && (
                      <button className="clear-avatar" type="button" onClick={clearAvatar}>
                        Remove
                      </button>
                    )}
                    <span>JPG, PNG, or WebP · up to 2 MB</span>
                  </div>
                </div>
              </div>
            </fieldset>

            <label className="sr-only" htmlFor="wall-message">Write something…</label>
            <textarea
              id="wall-message"
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder={`What do you want to say to ${profileName}?`}
              rows={4}
            />
            <div className="photo-controls">
              <input
                ref={photoInputRef}
                className="photo-input"
                id="wall-photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoChange}
                disabled={isSharing}
              />
              <label className="photo-picker" htmlFor="wall-photo">
                <CameraIcon />
                Add a photo
              </label>
              <span>JPG, PNG, WebP, or GIF · up to 5 MB</span>
            </div>
            {selectedPhoto && photoPreview && (
              <div className="photo-preview">
                <Image
                  src={photoPreview}
                  alt="Selected photo preview"
                  width={640}
                  height={420}
                  unoptimized
                />
                <div>
                  <span>{selectedPhoto.name}</span>
                  <button className="remove-photo" type="button" onClick={clearSelectedPhoto}>
                    Remove
                  </button>
                </div>
              </div>
            )}
            <div className="composer-footer">
              <span className={remainingCharacters < 30 ? "character-count character-count--low" : "character-count"}>
                {remainingCharacters} characters left
              </span>
              <button
                className="share-button"
                type="submit"
                disabled={
                  !message.trim() ||
                  !visitorName.trim() ||
                  isSharing ||
                  supabase === undefined ||
                  !isProfileLoaded
                }
              >
                <span>{isSharing ? "Sharing…" : "Share"}</span>
                {!isSharing && <SendIcon />}
              </button>
            </div>
          </form>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="feed-heading">
            <div>
              <span className="section-kicker">The latest</span>
              <h2>Recent posts</h2>
            </div>
            <span className="post-count">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
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
                    {post.avatar_url ? (
                      <Image
                        src={post.avatar_url}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized
                      />
                    ) : (
                      post.author.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="post-content">
                    <div className="post-meta">
                      <h3>{post.author}</h3>
                      <time dateTime={post.created_at}>{formatTimestamp(post.created_at)}</time>
                    </div>
                    <p>{post.message}</p>
                    {post.image_url && (
                      <Image
                        className="post-image"
                        src={post.image_url}
                        alt={`Photo shared by ${post.author}`}
                        width={960}
                        height={640}
                        unoptimized
                      />
                    )}
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
