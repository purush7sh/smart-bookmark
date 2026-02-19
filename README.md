# Smart Bookmark App

Live Demo: https://smart-bookmark-ruddy-nine.vercel.app  
GitHub: https://github.com/purush7sh/smart-bookmark

## Features
- Google OAuth authentication using Supabase
- Add and delete bookmarks (title + URL)
- Bookmarks are private per user (Row Level Security)
- Realtime updates across multiple tabs
- Deployed on Vercel

## Tech Stack
- Next.js (App Router)
- Supabase (Auth, Database, Realtime)
- Tailwind CSS
- Vercel

## How It Works
- Users sign in with Google using Supabase Auth
- Each bookmark is stored with the user_id
- Row Level Security (RLS) ensures users only see their own bookmarks
- Supabase Realtime listens to changes on the bookmarks table and updates the UI instantly
- The app is deployed on Vercel

## Problems I Faced & How I Solved Them

### 1. Vercel build failing with "Root Directory" error
- Problem: My project was inside a nested folder and Vercel couldn’t find `package.json`.
- Solution: I moved all Next.js files to the repository root and re-deployed.

### 2. "supabaseUrl is required" error during build
- Problem: Environment variables were not set in Vercel.
- Solution: I added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel Environment Variables.

### 3. 404 Not Found after successful build
- Problem: Incorrect project structure / wrong root directory configuration.
- Solution: Recreated the project in Vercel with correct root and verified App Router setup.

### 4. Realtime not updating initially
- Problem: Realtime channel was not subscribed correctly.
- Solution: Used Supabase `channel(...).on('postgres_changes', ...)` and refetched bookmarks on change.

## How to Run Locally

```bash
git clone https://github.com/purush7sh/smart-bookmark.git
cd smart-bookmark
npm install
npm run dev
