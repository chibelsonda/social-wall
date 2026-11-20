import { MAX_PHOTO_SIZE, validatePhoto } from "./photos";

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
