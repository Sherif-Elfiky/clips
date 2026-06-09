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

1. **Discovery** — A worker (`workers/fetchurl.js`) uses the YouTube Data API to find candidate videos (e.g. stand-up) and enqueues them with a message describing what kind of clips to make.
2. **Queue** — An Express API and MongoDB store jobs and their status (`queued` / `done` / `failed`), so you can track progress and retry or inspect failures.
3. **Processing** — A worker (`workers/opusapi.js`) submits each queued job to the OpusClip API, which generates the clips, and marks the job done.

## Tech Stack

- **Node.js, Express** — REST API and job queue endpoints
- **MongoDB, Mongoose** — Job storage and status
- **OpusClip API** — AI clip generation
- **YouTube Data API** — Source video discovery

## API Endpoints

| Method | Path                     | Description                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/health`                | Service and DB health check          |
| GET    | `/content`               | List all jobs                        |
| GET    | `/content/queued`        | List queued jobs                     |
| GET    | `/content/done`          | List completed jobs                  |
| GET    | `/content/count-queued`  | Count of queued jobs                 |
| GET    | `/content/process`       | Next queued job to process           |
| POST   | `/content/new`           | Add a job (`{ videoUrl, message }`)  |
| PUT    | `/content/completed/:id` | Mark a job done                      |
| DELETE | `/content/delete/:id`    | Delete a job by id                   |
| DELETE | `/content/delete-queued` | Delete all queued jobs               |
| DELETE | `/content/delete-all`    | Delete all jobs                      |

## Running Locally

1. Install dependencies: `cd services && npm install`
2. Configure environment: copy `services/.env.example` to `services/.env` and fill in `YT_API_KEY` and `OPUS_API_KEY` (see the example file for all variables).
3. Start MongoDB, then run the server and workers:
   - From repo root: `./run.sh`
   - Or individually: `npm start` (server), `npm run fetch` (discovery), `npm run clip` (OpusClip submission).

> **Note:** The OpusClip API requires a Pro (Beta) or Business plan with available credits.
