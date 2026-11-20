import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WallApp } from "./wall-app";

describe("WallApp", () => {
  it("shows detected visitor context instead of hard-coded profile details", async () => {
    render(<WallApp />);

    expect(await screen.findByText("Quezon City, Philippines")).toBeInTheDocument();
    expect(screen.getByText("Asia/Manila")).toBeInTheDocument();
    expect(screen.queryByText("Stanford Alum")).not.toBeInTheDocument();
  });

  it("uses the default avatar when the visitor has no profile photo", async () => {
    render(<WallApp />);

    const defaultPortrait = await screen.findByRole("img", {
      name: "Default community profile photo",
    });

    expect(defaultPortrait.querySelector("img")?.getAttribute("src")).toContain(
      "default-avatar.png",
    );
    expect(screen.getByText("Community wall")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Share something with the community…")).toBeInTheDocument();
  });

  it("publishes a message at the top of the local demo feed", async () => {
    const user = userEvent.setup();
    render(<WallApp />);

    const input = screen.getByLabelText("Write something…");
    await user.type(input, "Hello from the test wall!");
    await user.click(screen.getByRole("button", { name: "Share post" }));

    await waitFor(() => {
      expect(screen.getByText("Hello from the test wall!")).toBeInTheDocument();
    });
    expect(input).toHaveValue("");
    expect(JSON.parse(window.localStorage.getItem("my-wall-demo-posts") || "[]")[0].message).toBe(
      "Hello from the test wall!",
    );
  });

  it("previews multiple photos for one post", async () => {
    const user = userEvent.setup();
    render(<WallApp />);

    const firstPhoto = new File(["first"], "first.jpg", { type: "image/jpeg" });
    const secondPhoto = new File(["second"], "second.png", { type: "image/png" });

    await user.upload(screen.getByLabelText("Add photos"), [firstPhoto, secondPhoto]);

    expect(await screen.findByText("2 of 5 photos selected")).toBeInTheDocument();
    expect(screen.getByAltText("Selected photo 1 preview")).toBeInTheDocument();
    expect(screen.getByAltText("Selected photo 2 preview")).toBeInTheDocument();
  });

  it("opens published post images in a dismissible overlay", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      "my-wall-demo-posts",
      JSON.stringify([
        {
          id: "post-with-photo",
          author: "Casey",
          avatar_url: null,
          message: "A photo from today.",
          image_url: "https://example.com/photo.jpg",
          image_urls: ["https://example.com/photo.jpg"],
          created_at: new Date().toISOString(),
        },
      ]),
    );
    render(<WallApp />);

    await user.click(
      await screen.findByRole("button", {
        name: "View photo 1 of 1 shared by Casey",
      }),
    );

    expect(screen.getByRole("dialog", { name: "Post photo viewer" })).toBeInTheDocument();
    expect(screen.getByAltText("Photo 1 of 1 shared by Casey")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close photo viewer" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Post photo viewer" })).not.toBeInTheDocument();
    });
  });

  it("disables Share post for a blank message and enforces 280 characters", async () => {
    const user = userEvent.setup();
    render(<WallApp />);

    const input = screen.getByLabelText("Write something…");
    const shareButton = screen.getByRole("button", { name: "Share post" });
    expect(shareButton).toBeDisabled();

    await user.type(input, "a".repeat(285));
    expect(input).toHaveValue("a".repeat(280));
    expect(screen.getByText("0 characters left")).toBeInTheDocument();
    expect(shareButton).toBeEnabled();
  });

  it("uses and remembers the visitor's display name", async () => {
    const user = userEvent.setup();
    render(<WallApp />);

    const nameInput = screen.getByLabelText("Display name");
    await user.clear(nameInput);
    await user.type(nameInput, "Casey Rivera");
    await user.type(screen.getByLabelText("Write something…"), "Posting with my own name.");
    await user.click(screen.getByRole("button", { name: "Share post" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Casey Rivera" })).toBeInTheDocument();
    });

    const storedProfile = JSON.parse(
      window.localStorage.getItem("my-wall-visitor-profile") || "{}",
    );
    const storedPosts = JSON.parse(window.localStorage.getItem("my-wall-demo-posts") || "[]");
    expect(storedProfile.name).toBe("Casey Rivera");
    expect(storedPosts[0]).toMatchObject({
      author: "Casey Rivera",
      avatar_url: null,
      image_urls: [],
      message: "Posting with my own name.",
    });
  });

  it("uses the saved visitor avatar as the main profile photo", async () => {
    window.localStorage.setItem(
      "my-wall-visitor-profile",
      JSON.stringify({
        name: "Casey Rivera",
        avatarUrl: "https://example.com/casey-avatar.png",
      }),
    );

    render(<WallApp />);

    const profilePhoto = await screen.findByRole("img", {
      name: "Casey Rivera's profile photo",
    });
    const removeButton = screen.getByRole("button", { name: "Remove profile photo" });

    expect(profilePhoto).toBeInTheDocument();
    expect(removeButton.closest(".portrait-editor")).toBe(profilePhoto.parentElement);
    expect(screen.getByText("Casey Rivera's profile")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("What do you want to say to Casey Rivera?")).toBeInTheDocument();
  });

  it("switches themes and remembers the preference", async () => {
    const user = userEvent.setup();
    render(<WallApp />);

    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("my-wall-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });
});
