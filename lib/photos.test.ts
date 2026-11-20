import { MAX_AVATAR_SIZE, MAX_PHOTO_SIZE, validateAvatar, validatePhoto } from "./photos";

describe("validatePhoto", () => {
  it("accepts supported image formats within the size limit", () => {
    const photo = new File(["photo"], "photo.png", { type: "image/png" });
    expect(validatePhoto(photo)).toBeNull();
  });

  it("rejects unsupported files and oversized photos", () => {
    const textFile = new File(["hello"], "notes.txt", { type: "text/plain" });
    const largePhoto = new File([new Uint8Array(MAX_PHOTO_SIZE + 1)], "large.jpg", {
      type: "image/jpeg",
    });

    expect(validatePhoto(textFile)).toBe("Choose a JPG, PNG, WebP, or GIF image.");
    expect(validatePhoto(largePhoto)).toBe("Photos must be 5 MB or smaller.");
  });
});

describe("validateAvatar", () => {
  it("accepts supported profile photos and rejects GIFs", () => {
    const avatar = new File(["avatar"], "avatar.webp", { type: "image/webp" });
    const gif = new File(["avatar"], "avatar.gif", { type: "image/gif" });

    expect(validateAvatar(avatar)).toBeNull();
    expect(validateAvatar(gif)).toBe("Choose a JPG, PNG, or WebP profile photo.");
  });

  it("rejects oversized profile photos", () => {
    const avatar = new File([new Uint8Array(MAX_AVATAR_SIZE + 1)], "avatar.jpg", {
      type: "image/jpeg",
    });

    expect(validateAvatar(avatar)).toBe("Profile photos must be 2 MB or smaller.");
  });
});
