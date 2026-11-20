# My Wall

A nostalgic Facebook-style wall built with Next.js 15, React 19, and Supabase. Visitors can publish a short message, see the newest 50 posts first, and receive new posts in realtime without refreshing.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Create a Supabase project. In its SQL Editor, run these migrations in order:

   - [`supabase/migrations/001_create_posts.sql`](supabase/migrations/001_create_posts.sql) creates the posts table, public read/insert policies, newest-first index, and Realtime feed.
   - [`supabase/migrations/002_add_post_photos.sql`](supabase/migrations/002_add_post_photos.sql) adds photo URLs and creates the public `wall-photos` Storage bucket with restricted upload policies.
   - [`supabase/migrations/003_add_visitor_profiles.sql`](supabase/migrations/003_add_visitor_profiles.sql) adds per-post avatars and creates the public `wall-avatars` Storage bucket for visitor profile photos.
   - [`supabase/migrations/004_add_multiple_post_images.sql`](supabase/migrations/004_add_multiple_post_images.sql) adds support for up to five images per post and migrates existing single-image posts.

4. Add the project URL and publishable key from **Connect → App Frameworks** to `.env.local`.

5. Start the app:

   ```bash
   npm run dev
   ```

Without Supabase variables, the UI runs in demo mode and stores posts in the current browser. This makes local visual review possible, but the variables are required for the shared, persistent production wall.

## Customize the profile

Visitors without a custom name see neutral “Community wall” copy, and visitors without a custom photo use the included default avatar. On Vercel, the About card uses approximate request-location headers and the visitor's browser timezone instead of hard-coded profile details; no IP address or coordinates are stored or returned to the client.

## Visitor profiles

Visitors can choose a display name and an optional profile photo before posting. The current profile is remembered in that browser, while each post stores its own name and avatar snapshot. This intentionally remains a no-login wall, so display names are not verified identities.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy on Vercel

Push the repository to GitHub, import it into Vercel, and add the same two Supabase environment variables before deploying. Use the production URL for the test submission.
