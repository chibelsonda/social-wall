import type { Metadata } from "next";
import "@fontsource-variable/nunito-sans/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Wall",
  description: "A nostalgic, realtime social wall powered by Next.js and Supabase.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
