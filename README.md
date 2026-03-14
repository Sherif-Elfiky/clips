# Clips — Automated Short-Form Clip Pipeline

An end-to-end system that discovers long-form videos, queues them, and automates the creation of short clips for social media.

---

## Why I Built This

Creating short clips from longer videos (like stand-up specials or long-form content) is repetitive: find a video, open the clip tool, paste the URL, describe what you want, click generate, then do it again for the next one. Doing that manually doesn’t scale and eats time that could go into ideas and distribution instead of copy-paste.

I built this project to remove that bottleneck. The goal was a single pipeline that **finds** source videos, **queues** them with clear instructions, and **runs** the clip-creation step automatically, so I can focus on what to clip and where to post, not on repeating the same clicks.

---

## Impact

- **Time saved** — The pipeline handles discovery and submission. What used to be many manual steps per video becomes “queue runs, clips get generated,” with the option to run it on a schedule or on demand.
- **Scalable workflow** — One job queue and a small set of workers can keep a steady stream of clips without scaling manual effort. Add more source criteria or schedules without adding more hands-on work.
- **Consistent process** — Every video is handled the same way: queued, processed, and marked done. That makes it easier to reason about what’s been clipped, what’s pending, and what failed.
- **Foundation for automation** — The same pattern (discover → queue → process) can be extended with approval steps, different clip tools, or other platforms without rebuilding from scratch.

---

## How It Works

1. **Discovery** — A worker uses the YouTube Data API to find candidate videos (e.g. stand-up) and enqueues them with a message describing what kind of clips to make.
2. **Queue** — An Express API and MongoDB store jobs and their status (`queued` / `done`), so you can track progress and retry or inspect failures.
3. **Processing** — A headless browser worker (Puppeteer) drives the clip-creation tool for each queued job and marks the job done when finished.

## Tech Stack

- **Node.js, Express** — REST API and job queue endpoints  
- **MongoDB, Mongoose** — Job storage and status  
- **Puppeteer** — Browser automation for the clip tool  
- **YouTube Data API** — Source video discovery  

## Running Locally

1. Install dependencies: `cd services && npm install`
2. Set env vars (e.g. `MONGODB_URI`, `YT_API_KEY`, and any keys for the clip tool) in `services/.env` or your environment.
3. Start MongoDB, then run the server and workers:
   - From repo root: `./run.sh`
   - Or run the server and workers separately (see `services/` and `services/workers/`).
