import { addPostNewestFirst } from "./posts";
import type { Post } from "./types";

describe("addPostNewestFirst", () => {
  it("deduplicates posts and sorts the newest first", () => {
    const older: Post = {
      id: "older",
      author: "A",
      avatar_url: null,
      message: "Older",
      image_url: null,
      created_at: "2025-01-01T10:00:00.000Z",
    };
    const newer: Post = {
      id: "newer",
      author: "B",
      avatar_url: null,
      message: "Newer",
      image_url: null,
      created_at: "2025-01-01T11:00:00.000Z",
    };

    expect(addPostNewestFirst([older, newer], newer).map((post) => post.id)).toEqual(["newer", "older"]);
  });
});
