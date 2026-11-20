"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from "react";
import { demoPosts } from "@/lib/demo-posts";
import {
  MAX_POST_PHOTOS,
  removePostPhotos,
  uploadPostPhoto,
  uploadVisitorAvatar,
  validateAvatar,
  validatePhotoSelection,
} from "@/lib/photos";
import { addPostNewestFirst, createPost, fetchPosts, subscribeToPosts } from "@/lib/posts";
import { getBrowserSupabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 280;
const MAX_VISITOR_NAME_LENGTH = 40;
const LOCAL_POSTS_KEY = "my-wall-demo-posts";
const VISITOR_PROFILE_KEY = "my-wall-visitor-profile";
const THEME_KEY = "my-wall-theme";
const DEFAULT_AVATAR_SRC = "/images/default-avatar.png";

type Theme = "light" | "dark";

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

function PhotoIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="9" cy="9.5" r="1.5" />
      <path d="m5.5 17 4.5-4.5 3.25 3.25 2.25-2.25 3 3" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
      <path d="M9 3.25h6a.75.75 0 0 1 .75.75v1.25H20a.75.75 0 0 1 0 1.5h-1.05l-.73 12.02A2.25 2.25 0 0 1 15.98 21H8.02a2.25 2.25 0 0 1-2.24-2.23L5.05 6.75H4a.75.75 0 0 1 0-1.5h4.25V4A.75.75 0 0 1 9 3.25Zm.75 2h4.5v-.5h-4.5v.5ZM6.55 6.75l.73 11.93a.75.75 0 0 0 .74.82h7.96a.75.75 0 0 0 .74-.82l.73-11.93H6.55Zm3.2 2.5a.75.75 0 0 1 .75.75v6.25a.75.75 0 0 1-1.5 0V10a.75.75 0 0 1 .75-.75Zm4.5 0A.75.75 0 0 1 15 10v6.25a.75.75 0 0 1-1.5 0V10a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12M18 6 6 18" />
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

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.57 4.57 6 6M18 18l1.43 1.43M2.5 12h2M19.5 12h2M4.57 19.43 6 18M18 6l1.43-1.43" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.25 15.2A8.5 8.5 0 0 1 8.8 3.75 8.5 8.5 0 1 0 20.25 15.2Z" />
    </svg>
  );
}

function formatTimestamp(timestamp: string, currentTime: number) {
  const value = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const elapsedMilliseconds = Date.parse(timestamp) - currentTime;
  if (Math.abs(elapsedMilliseconds) < 60_000) return "now";

  const elapsedMinutes = Math.round(elapsedMilliseconds / 60_000);

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
  const [supabase, setSupabase] = useState<ReturnType<typeof getBrowserSupabase> | undefined>(
    undefined,
  );
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [message, setMessage] = useState("");
  const [visitorName, setVisitorName] = useState("Visitor");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarSaving, setIsAvatarSaving] = useState(false);
  const [isAvatarSaved, setIsAvatarSaved] = useState(false);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [visitorLocation, setVisitorLocation] = useState<string | null>(null);
  const [visitorTimezone, setVisitorTimezone] = useState<string | null>(null);
  const [isVisitorContextLoading, setIsVisitorContextLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>("light");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lightboxTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const resolvedTheme: Theme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : prefersDark
          ? "dark"
          : "light";

    setTheme(resolvedTheme);
    document.documentElement.dataset.theme = resolvedTheme;
  }, []);

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    const timer = window.setInterval(updateCurrentTime, 30_000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") updateCurrentTime();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    setSupabase(getBrowserSupabase());
    const profile = loadVisitorProfile();
    setVisitorName(profile.name);
    setAvatarUrl(profile.avatarUrl);
    setIsProfileLoaded(true);
  }, []);

  useEffect(() => {
    let active = true;
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    setVisitorTimezone(browserTimezone);

    fetch("/api/visitor-context", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to detect visitor context");
        return response.json() as Promise<{ location: string | null; timezone: string | null }>;
      })
      .then((context) => {
        if (!active) return;
        setVisitorLocation(context.location);
        setVisitorTimezone(context.timezone || browserTimezone);
      })
      .catch(() => {
        // Browser timezone remains available when local development has no Vercel geo headers.
      })
      .finally(() => {
        if (active) setIsVisitorContextLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  useEffect(() => {
    if (!isProfileLoaded) return;

    window.localStorage.setItem(
      VISITOR_PROFILE_KEY,
      JSON.stringify({ name: visitorName, avatarUrl } satisfies VisitorProfile),
    );
  }, [avatarUrl, isProfileLoaded, visitorName]);

  useEffect(() => {
    if (!lightboxImage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lightboxCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxImage(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxImage]);

  function closeLightbox() {
    setLightboxImage(null);
    window.setTimeout(() => lightboxTriggerRef.current?.focus(), 0);
  }

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
    if (selectedPhotos.length === 0) {
      setPhotoPreviews([]);
      return;
    }

    const previewUrls = selectedPhotos.map((photo) => URL.createObjectURL(photo));
    setPhotoPreviews(previewUrls);
    return () => previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
  }, [selectedPhotos]);

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

  function clearSelectedPhotos() {
    setSelectedPhotos([]);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function removeSelectedPhoto(index: number) {
    setSelectedPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
  }

  function clearAvatar() {
    setSelectedAvatar(null);
    setAvatarUrl(null);
    setIsAvatarSaved(true);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
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
    setIsAvatarSaved(false);

    if (!supabase) {
      setSelectedAvatar(null);
      setError("Profile photo uploads require a connected Supabase project.");
      event.target.value = "";
      return;
    }

    setIsAvatarSaving(true);

    try {
      const uploadedAvatar = await uploadVisitorAvatar(supabase, file);
      setAvatarUrl(uploadedAvatar.publicUrl);
      setSelectedAvatar(null);
      setIsAvatarSaved(true);
      event.target.value = "";
    } catch {
      setSelectedAvatar(null);
      setError("Failed to upload profile photo. Please try again.");
      event.target.value = "";
    } finally {
      setIsAvatarSaving(false);
    }
  }

  function addSelectedPhotos(files: File[]) {
    if (files.length === 0) return;

    const validationError = validatePhotoSelection(files, selectedPhotos.length);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedPhotos((current) => [...current, ...files]);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    addSelectedPhotos(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handlePhotoDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (isSharing || selectedPhotos.length >= MAX_POST_PHOTOS) return;

    event.dataTransfer.dropEffect = "copy";
    setIsPhotoDragging(true);
  }

  function handlePhotoDragLeave(event: DragEvent<HTMLDivElement>) {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setIsPhotoDragging(false);
  }

  function handlePhotoDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsPhotoDragging(false);
    if (isSharing || selectedPhotos.length >= MAX_POST_PHOTOS) return;

    addSelectedPhotos(Array.from(event.dataTransfer.files));
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

    const uploadedPhotoPaths: string[] = [];

    try {
      if (supabase) {
        const imageUrls: string[] = [];

        if (selectedPhotos.length > 0) {
          try {
            for (const photo of selectedPhotos) {
              const uploadedPhoto = await uploadPostPhoto(supabase, photo);
              uploadedPhotoPaths.push(uploadedPhoto.path);
              imageUrls.push(uploadedPhoto.publicUrl);
            }
          } catch {
            await removePostPhotos(supabase, uploadedPhotoPaths);
            setError("One or more photos failed to upload. Please try again.");
            return;
          }
        }

        let savedPost: Post;
        try {
          savedPost = await createPost(supabase, {
            author: trimmedVisitorName,
            avatar_url: avatarUrl,
            message: trimmedMessage,
            image_url: imageUrls[0] ?? null,
            image_urls: imageUrls,
          });
        } catch (postError) {
          await removePostPhotos(supabase, uploadedPhotoPaths);
          throw postError;
        }
        setPosts((current) => addPostNewestFirst(current, savedPost));
      } else {
        if (selectedPhotos.length > 0) {
          setError("Photo uploads require a connected Supabase project.");
          return;
        }

        const localPost: Post = {
          id: crypto.randomUUID(),
          author: trimmedVisitorName,
          avatar_url: avatarUrl,
          message: trimmedMessage,
          image_url: null,
          image_urls: [],
          created_at: new Date().toISOString(),
        };
        setPosts((current) => {
          const updated = addPostNewestFirst(current, localPost);
          window.localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
      setMessage("");
      clearSelectedPhotos();
    } catch {
      setError("Your post wasn't shared. Please check your connection and try again.");
    } finally {
      setIsSharing(false);
    }
  }

  const remainingCharacters = MAX_MESSAGE_LENGTH - message.length;
  const displayedAvatar = avatarPreview || avatarUrl;
  const trimmedVisitorName = visitorName.trim();
  const hasVisitorName = Boolean(trimmedVisitorName) && trimmedVisitorName !== "Visitor";
  const profileName = hasVisitorName ? trimmedVisitorName : null;
  const profileLabel = profileName ? `${profileName}'s profile` : "Community wall";
  const profilePhotoLabel = profileName
    ? displayedAvatar
      ? `${profileName}'s profile photo`
      : `Default profile photo for ${profileName}`
    : displayedAvatar
      ? "Visitor profile photo"
      : "Default community profile photo";

  return (
    <main className="wall-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top" aria-label="Wall home">
            wall<span className="brand-dot">.</span>
          </a>
          <div className="topbar-actions">
            <span className="topbar-note">a little corner of the internet</span>
            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <div className="page-grid" id="top">
        <aside className="profile-column" aria-label={profileLabel}>
          <div className="portrait-editor">
            <div
              className="portrait portrait--image"
              role="img"
              aria-label={profilePhotoLabel}
            >
              <Image
                src={displayedAvatar || DEFAULT_AVATAR_SRC}
                alt=""
                width={640}
                height={640}
                unoptimized={Boolean(displayedAvatar)}
                priority
              />
            </div>
            <input
              ref={avatarInputRef}
              className="photo-input"
              id="visitor-avatar"
              name="visitor-avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              disabled={isSharing || isAvatarSaving || supabase === undefined}
            />
            <div className="portrait-actions">
              {displayedAvatar && (
                <button
                  className="portrait-remove"
                  type="button"
                  onClick={clearAvatar}
                  disabled={isAvatarSaving}
                  title="Remove profile photo"
                  aria-label="Remove profile photo"
                >
                  <TrashIcon />
                </button>
              )}
              <label
                className="portrait-camera"
                htmlFor="visitor-avatar"
                title={
                  isAvatarSaving
                    ? "Saving profile photo"
                    : displayedAvatar
                      ? "Change profile photo"
                      : "Add profile photo"
                }
              >
                <CameraIcon />
                <span className="sr-only">
                  {isAvatarSaving
                    ? "Saving profile photo"
                    : displayedAvatar
                      ? "Change profile photo"
                      : "Add profile photo"}
                </span>
              </label>
            </div>
          </div>

          <section className="info-card">
            <div className="info-card-heading">
              <h2>About</h2>
              <span className="profile-status">Online</span>
            </div>
            <dl>
              <div>
                <dt>Time zone</dt>
                <dd aria-live="polite">
                  {visitorTimezone?.replaceAll("_", " ") || "Detecting…"}
                </dd>
              </div>
              <div>
                <dt>Approx. location</dt>
                <dd aria-live="polite" title="Approximate location based on network information">
                  {isVisitorContextLoading ? "Detecting…" : visitorLocation || "Unavailable locally"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="wall-column" aria-labelledby="wall-heading">
          <div className="profile-heading">
            <p className="eyebrow">{profileLabel}</p>
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
              <h2>Write something</h2>
            </div>
            <div className="visitor-profile">
              <div className="visitor-profile-row">
                <div className="visitor-avatar" aria-hidden="true">
                  <Image
                    src={displayedAvatar || DEFAULT_AVATAR_SRC}
                    alt=""
                    width={72}
                    height={72}
                    unoptimized={Boolean(displayedAvatar)}
                  />
                </div>
                <div className="visitor-profile-fields">
                  <label className="sr-only" htmlFor="visitor-name">Display name</label>
                  <input
                    id="visitor-name"
                    name="visitor-name"
                    type="text"
                    value={visitorName}
                    onChange={(event) => setVisitorName(event.target.value)}
                    maxLength={MAX_VISITOR_NAME_LENGTH}
                    required
                    disabled={isSharing}
                    placeholder="Display name"
                  />
                  <span className="sr-only" aria-live="polite">
                    {isAvatarSaving
                      ? "Saving profile photo…"
                      : isAvatarSaved
                        ? "Profile photo saved"
                        : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="message-field">
              <label className="sr-only" htmlFor="wall-message">Write something…</label>
              <textarea
                id="wall-message"
                name="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={
                  profileName
                    ? `What do you want to say to ${profileName}?`
                    : "Share something with the community…"
                }
                rows={4}
              />
            </div>
            <div
              className={[
                "photo-dropzone",
                isPhotoDragging ? "photo-dropzone--active" : "",
                isSharing || selectedPhotos.length >= MAX_POST_PHOTOS
                  ? "photo-dropzone--disabled"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-testid="photo-dropzone"
              onDragEnter={handlePhotoDragOver}
              onDragOver={handlePhotoDragOver}
              onDragLeave={handlePhotoDragLeave}
              onDrop={handlePhotoDrop}
            >
              <input
                ref={photoInputRef}
                className="photo-input"
                id="wall-photo"
                name="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handlePhotoChange}
                disabled={isSharing || selectedPhotos.length >= MAX_POST_PHOTOS}
              />
              <label
                className="photo-dropzone-label"
                htmlFor="wall-photo"
                aria-label="Add photos"
                title={`Add photos · up to ${MAX_POST_PHOTOS} images, 5 MB each`}
              >
                <PhotoIcon />
                <strong>
                  {selectedPhotos.length >= MAX_POST_PHOTOS
                    ? "Photo limit reached"
                    : isPhotoDragging
                      ? "Drop photos here"
                      : "Drag & drop photos here"}
                </strong>
                <span>Or click to browse · JPG, PNG, WebP, or GIF · up to 5 MB each</span>
              </label>
              {selectedPhotos.length > 0 && photoPreviews.length === selectedPhotos.length && (
                <div className="photo-preview-section">
                  <div className="photo-preview-heading">
                    <span>
                      {selectedPhotos.length} of {MAX_POST_PHOTOS} photos selected
                    </span>
                    <button type="button" onClick={clearSelectedPhotos}>Remove all</button>
                  </div>
                  <div className="photo-preview-grid">
                    {selectedPhotos.map((photo, index) => (
                      <div className="photo-preview" key={`${photo.name}-${photo.lastModified}-${index}`}>
                        <Image
                          src={photoPreviews[index]}
                          alt={`Selected photo ${index + 1} preview`}
                          width={640}
                          height={420}
                          unoptimized
                        />
                        <div>
                          <span>{photo.name}</span>
                          <button
                            className="remove-photo"
                            type="button"
                            onClick={() => removeSelectedPhoto(index)}
                            title={`Remove ${photo.name}`}
                            aria-label={`Remove ${photo.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                  isAvatarSaving ||
                  supabase === undefined ||
                  !isProfileLoaded
                }
              >
                <span>{isSharing ? "Sharing…" : "Share post"}</span>
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
            <h2>Recent posts</h2>
            <span className="post-count">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
          </div>

          <div className="feed" aria-live="polite" aria-busy={isLoading}>
            {isLoading ? (
              <div className="feed-state">Loading the wall…</div>
            ) : posts.length === 0 ? (
              <div className="feed-state">The wall is quiet. Be the first to leave a note.</div>
            ) : (
              posts.map((post) => {
                const postImages =
                  post.image_urls?.length > 0
                    ? post.image_urls
                    : post.image_url
                      ? [post.image_url]
                      : [];

                return (
                  <article className="post" key={post.id}>
                    <div className="post-avatar" aria-hidden="true">
                      <Image
                        src={post.avatar_url || DEFAULT_AVATAR_SRC}
                        alt=""
                        width={44}
                        height={44}
                        unoptimized={Boolean(post.avatar_url)}
                      />
                    </div>
                    <div className="post-content">
                      <div className="post-meta">
                        <h3>{post.author}</h3>
                        <time dateTime={post.created_at}>
                          {formatTimestamp(post.created_at, currentTime)}
                        </time>
                      </div>
                      <p>{post.message}</p>
                      {postImages.length > 0 && (
                        <div className={`post-gallery post-gallery--${postImages.length}`}>
                          {postImages.map((imageUrl, index) => (
                            <button
                              className="post-image-button"
                              type="button"
                              key={`${imageUrl}-${index}`}
                              aria-label={`View photo ${index + 1} of ${postImages.length} shared by ${post.author}`}
                              onClick={(event) => {
                                const alt = `Photo ${index + 1} of ${postImages.length} shared by ${post.author}`;
                                lightboxTriggerRef.current = event.currentTarget;
                                setLightboxImage({ src: imageUrl, alt });
                              }}
                            >
                              <Image
                                className="post-image"
                                src={imageUrl}
                                alt=""
                                width={960}
                                height={640}
                                unoptimized
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {lightboxImage && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Post photo viewer"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <button
            ref={lightboxCloseRef}
            className="lightbox-close"
            type="button"
            onClick={closeLightbox}
            aria-label="Close photo viewer"
          >
            <CloseIcon />
          </button>
          <div className="lightbox-content">
            <Image
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              width={1600}
              height={1200}
              unoptimized
              priority
            />
          </div>
        </div>
      )}
    </main>
  );
}
