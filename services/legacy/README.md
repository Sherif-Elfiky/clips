# Legacy

Archived, unmaintained code kept for reference only. Nothing in this folder is wired
into npm scripts, `run.sh`, or CI, and it is not expected to work without changes.

## `formfill.js`

The original clip-submission worker. It automated the OpusClip **web UI** with a
Puppeteer (stealth) browser — logging in, filling the URL/description form fields, and
clicking "Get clips in 1 click".

**Replaced by:** [`../workers/opusapi.js`](../workers/opusapi.js), which submits jobs
directly to the OpusClip REST API. The API path is faster, runs headless on a server,
and is far less brittle than scraping the UI.

### Why it's kept

The OpusClip API requires a paid plan (Pro Beta / Business) with credits. This UI
automation is the fallback if the API path ever becomes unavailable or uneconomical.

### Running it again

It depends on packages that were removed from `package.json` during cleanup:

```bash
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

You also need the `email` env var set. Known limitation (preserved as-is): the
processing loop has a hard `break` after one iteration, so it only handles a single
video per run.
