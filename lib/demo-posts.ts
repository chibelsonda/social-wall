import type { Post } from "./types";

const now = Date.now();

export const demoPosts: Post[] = [
  {
    id: "demo-anna",
    author: "Anna",
    message: "Hey Alex, did you debug your coffee maker yet? Last cup tasted like JavaScript errors.",
    created_at: new Date(now - 2 * 60_000).toISOString(),
  },
  {
    id: "demo-adelaide",
    author: "Adelaide",
    message: "Saw your last coding session—pretty sure you broke Stack Overflow again. 🚨",
    created_at: new Date(now - 12 * 60_000).toISOString(),
  },
  {
    id: "demo-juho",
    author: "Juho",
    message: "Are you still coding in pajamas, or have you upgraded to full-time sweatpants mode?",
    created_at: new Date(now - 38 * 60_000).toISOString(),
  },
  {
    id: "demo-maija",
    author: "Maija",
    message: "Rumor has it your computer has more stickers than code running on it. Confirm?",
    created_at: new Date(now - 75 * 60_000).toISOString(),
  },
];
