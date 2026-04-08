<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/161PQcgIc24BwVXMWnOArxoNPf2Jooxgq

**Live demo (Vercel):** [Update with your Vercel deployment URL]

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Skill Gap tool: job posting URL fetch (local dev)

The **Skill Gap** section can call `POST /api/fetch-job-posting` to download a public job page and strip HTML to text. That route runs as a **Vercel Serverless Function** in [`api/fetch-job-posting.ts`](api/fetch-job-posting.ts).

- **Production on Vercel:** `/api/*` is served automatically.
- **Local `npm run dev` (Vite):** the dev server [proxies](vite.config.ts) `/api` to `http://127.0.0.1:3001`. In a second terminal run:
  - `npx vercel dev --listen 3001`
  from the project root (login to Vercel if prompted), then open the app on port 3000 as usual.
- If the proxy target is down, URL fetch fails—users can still **paste the job description**.

Many career sites block scrapers or require login; pasted text is the reliable fallback.

**Privacy:** resume and job text are sent to **Google Gemini** for analysis. URLs are fetched by your server (or Vercel), not the user’s browser.
