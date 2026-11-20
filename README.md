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

3. Create a Supabase project. In its SQL Editor, run [`supabase/migrations/001_create_posts.sql`](supabase/migrations/001_create_posts.sql). This creates the `posts` table, public read/insert policies, the newest-first index, and enables Realtime.

4. Add the project URL and anon key from **Project Settings → API** to `.env.local`.

5. Start the app:

   ```bash
   npm run dev
   ```

Without Supabase variables, the UI runs in demo mode and stores posts in the current browser. This makes local visual review possible, but the variables are required for the shared, persistent production wall.

## Customize the profile

The optional values in `.env.example` set the profile name, network, and city. The portrait is a deliberate placeholder made from CSS so it can be replaced later with a personal image.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy on Vercel

Push the repository to GitHub, import it into Vercel, and add the same two Supabase environment variables before deploying. Use the production URL for the test submission.
