import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WallApp } from "./wall-app";

describe("WallApp", () => {
  it("publishes a message at the top of the local demo feed", async () => {
    const user = userEvent.setup();
    render(<WallApp />);

    const input = screen.getByLabelText("Write something…");
    await user.type(input, "Hello from the test wall!");
    await user.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() => {
      expect(screen.getByText("Hello from the test wall!")).toBeInTheDocument();
    });
    expect(input).toHaveValue("");
    expect(JSON.parse(window.localStorage.getItem("my-wall-demo-posts") || "[]")[0].message).toBe(
      "Hello from the test wall!",
    );
  });

  it("disables Share for a blank message and enforces 280 characters", async () => {
    const user = userEvent.setup();
    render(<WallApp />);

    const input = screen.getByLabelText("Write something…");
    const shareButton = screen.getByRole("button", { name: "Share" });
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
    await user.click(screen.getByRole("button", { name: "Share" }));

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
      message: "Posting with my own name.",
    });
  });
});
