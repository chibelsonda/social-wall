import { addPostNewestFirst, replaceAuthorAvatar } from "./posts";
import type { Post } from "./types";

describe("addPostNewestFirst", () => {
  it("deduplicates posts and sorts the newest first", () => {
    const older: Post = {
      id: "older",
      author: "A",
      avatar_url: null,
      message: "Older",
      image_url: null,
      image_urls: [],
      created_at: "2025-01-01T10:00:00.000Z",
    };
    const newer: Post = {
      id: "newer",
      author: "B",
      avatar_url: null,
      message: "Newer",
      image_url: null,
      image_urls: [],
      created_at: "2025-01-01T11:00:00.000Z",
    };

    expect(addPostNewestFirst([older, newer], newer).map((post) => post.id)).toEqual(["newer", "older"]);
  });
});

describe("replaceAuthorAvatar", () => {
  it("updates all posts from the visitor while leaving other authors unchanged", () => {
    const matchingPost: Post = {
      id: "matching",
      author: "Casey",
      avatar_url: "https://example.com/old-avatar.png",
      message: "Mine",
      image_url: null,
      image_urls: [],
      created_at: "2025-01-01T11:00:00.000Z",
    };
    const otherPost: Post = {
      ...matchingPost,
      id: "other",
      author: "Someone else",
      avatar_url: "https://example.com/other-avatar.png",
    };

    expect(
      replaceAuthorAvatar(
        [matchingPost, otherPost],
        "Casey",
        null,
      ),
    ).toEqual([{ ...matchingPost, avatar_url: null }, otherPost]);
  });
});
