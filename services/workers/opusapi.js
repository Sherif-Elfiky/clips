require('../config');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const OPUS_API_URL = 'https://api.opus.pro/api/clip-projects';
const OPUS_API_KEY = process.env.OPUS_API_KEY;

const PROCESS_URL = `${API_BASE_URL}/content/process`;
const COUNT_URL = `${API_BASE_URL}/content/count-queued`;
const completedUrl = (id) => `${API_BASE_URL}/content/completed/${id}`;

// How long each generated clip should be, in seconds. [[0, 90]] = up to 90s.
const CLIP_DURATIONS = [[0, 90]];
// Genre hint for OpusClip's curation model.
const GENRE = 'Comedy';
const DELAY_BETWEEN_JOBS_MS = 1000;

async function getQueuedCount() {
  try {
    const res = await fetch(COUNT_URL);
    const count = parseInt(await res.text(), 10);
    return Number.isNaN(count) ? 0 : count;
  } catch (err) {
    console.error('Error getting queued count:', err.message);
    return 0;
  }
}

async function getNextVideo() {
  try {
    const res = await fetch(PROCESS_URL);
    const data = await res.json();
    if (!data || !data.videoUrl) {
      console.log('No video URL in response');
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error fetching next video:', err.message);
    return null;
  }
}

async function submitToOpus(videoUrl) {
  // No `range` is set on purpose: curation runs over the FULL source video,
  // since we already filter to short videos upstream in fetchurl.js.
  const body = {
    videoUrl,
    curationPref: {
      clipDurations: CLIP_DURATIONS,
      genre: GENRE,
    },
    importPref: {
      sourceLang: 'auto',
    },
  };

  const res = await fetch(OPUS_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPUS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpusClip API ${res.status}: ${text}`);
  }

  return res.json();
}

async function markDone(id, opusProjectId) {
  try {
    const res = await fetch(completedUrl(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ opusProjectId }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to mark done: ${res.status} ${text}`);
    }
    const data = await res.json();
    console.log('Marked done:', data.message);
    return true;
  } catch (err) {
    console.error('Error marking done:', err.message);
    return false;
  }
}

async function processQueue() {
  if (!OPUS_API_KEY) {
    console.error('OPUS_API_KEY is not set. Add it to services/.env before running.');
    return;
  }

  while (true) {
    const count = await getQueuedCount();
    if (count === 0) {
      console.log('No queued videos. Queue drained.');
      break;
    }

    const video = await getNextVideo();
    if (!video) {
      console.log('Could not fetch a queued video, stopping.');
      break;
    }

    const { videoUrl, _id: jobId } = video;

    try {
      const project = await submitToOpus(videoUrl);
      console.log(`Submitted ${videoUrl} -> project ${project.id} (stage: ${project.stage})`);
      await markDone(jobId, project.id);
    } catch (err) {
      console.error(`Failed to submit ${videoUrl}:`, err.message);
      // Leave the job queued so it can be retried on the next run.
    }

    await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_JOBS_MS));
  }
}

if (require.main === module) {
  processQueue()
    .then(() => console.log('Worker finished'))
    .catch((err) => console.error('Worker failed:', err));
}

module.exports = { processQueue, submitToOpus };
