require('../config');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const POST_URL = `${API_BASE_URL}/content/new`;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_WATCH_BASE = 'https://www.youtube.com/watch?v=';
const API_KEY = process.env.YT_API_KEY;

const MAX_RESULTS = 15;

const QUERIES = [
    'stand up comedy Laugh Factory',
    'stand up comedy Comedy Store',
    'stand up comedy Dry Bar Comedy',
    'stand up comedy full special',
];

function getQuery() {
    return QUERIES[Math.floor(Math.random() * QUERIES.length)];
}

function pickRandom(videos) {
    return videos[Math.floor(Math.random() * videos.length)];
}

async function fetchVideos() {
    const query = getQuery();
    const url = new URL(YOUTUBE_API_BASE);
    url.search = new URLSearchParams({
        part: "snippet",
        type: "video",
        q: query,
        videoDuration: "medium",
        videoEmbeddable: "true",
        maxResults: String(MAX_RESULTS),
        order: "viewCount",
        key: API_KEY
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();


    const videos = data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        url: `${YOUTUBE_WATCH_BASE}${item.id.videoId}`
    }));

    return videos;
}

async function postVideo(videoUrl) {
    try {
        const res = await fetch(POST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoUrl,
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to post video: ${res.status} ${text}`);
        }

        const data = await res.json();
        console.log('Posted video to queue:', data.videoUrl);
        return data;
    } catch (err) {
        console.error('Error posting video:', err.message);
        return null;
    }
}

async function fetchURLs() {
    try {
        const videos = await fetchVideos();
        if (videos.length === 0) {
            console.log('No videos found');
            return;
        }
        const video = pickRandom(videos);
        const result = await postVideo(video.url);
        if (result) {
            console.log(`Queued: ${video.title}`);
        }
    } catch (err) {
        console.error(err);
    }
}

fetchURLs().catch(err => console.error(err));
